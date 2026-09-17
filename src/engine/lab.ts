import { dot, zeros, vectorTimesMatrix, outer, addMatrices, rotatePairwise, maxAbsDifference, targetMargin, type Matrix, type Vector } from './microscope'
import { gaussian, seededRandom } from './random'

export type CurvePoint = { count: number; accuracy: number }
export type CapacityResult = { curve: CurvePoint[]; capacity: number; maxCosine: number; meanCosine: number; welch: number | null; zeroCodes: number }
export const welchBound = (count: number, dimension: number) => count > dimension ? Math.sqrt((count - dimension) / (dimension * (count - 1))) : 0
export const normalize = (v: Vector) => { const norm = Math.sqrt(dot(v,v)); return v.map(x => norm === 0 ? 0 : x / norm) }
export function randomKeys(dimension: number, count: number, seed: number) {
  const random = seededRandom(seed)
  return Array.from({length:count}, () => normalize(Array.from({length:dimension}, () => gaussian(random))))
}

/** Each projection row calibrates its threshold on this synthetic corpus, not a held-out test set. */
export function liftKeys(raw: Matrix, neurons: number, fraction: number, seed: number): number[][] {
  const random = seededRandom(seed)
  const codes = zeros(raw.length,neurons)
  for (let row = 0; row < neurons; row++) {
    const projection = Array.from({length:raw[0].length}, () => gaussian(random))
    const values = raw.map(v => dot(v,projection))
    const sorted = [...values].sort((a,b) => a-b)
    const threshold = sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor((1-fraction)*sorted.length)-1))]
    values.forEach((value, index) => { codes[index][row] = Math.max(0,value-threshold) })
  }
  return codes.map(normalize)
}

export function capacityCurve(keys: Matrix, classes: number, seed: number): CapacityResult {
  const random = seededRandom(seed)
  const labels = keys.map(() => Math.floor(random()*classes))
  const gram = keys.map(a => keys.map(b => dot(a,b)))
  const scores = zeros(keys.length,classes)
  const curve: CurvePoint[] = []
  for (let prefix = 1; prefix <= keys.length; prefix++) {
    for (let query = 0; query < keys.length; query++) scores[query][labels[prefix-1]] += gram[query][prefix-1]
    let correct = 0
    for (let query = 0; query < prefix; query++) if (targetMargin(scores[query],labels[query]) > 0) correct++
    curve.push({ count:prefix,accuracy:correct/prefix })
  }
  const firstFailure = curve.find(p => p.accuracy < 0.9)
  const cosines = gram.flatMap((row,i) => row.slice(i+1))
  const zeroCodes=keys.filter(k => dot(k,k) === 0).length
  return { curve, capacity:firstFailure ? firstFailure.count-1 : keys.length, maxCosine:Math.max(0,...cosines.map(Math.abs)), meanCosine:cosines.reduce((a,b)=>a+b,0)/Math.max(1,cosines.length), welch:zeroCodes>0?null:welchBound(keys.length,keys[0].length), zeroCodes }
}

export type SweepRequest = { chapter:'dimension'|'lift'; dimension:number; count:number; classes:number; seed:number; orthogonal:boolean; neurons:number; fraction:number }
export function runCapacityExperiment(request: SweepRequest, progress?: (value:number)=>void) {
  const { dimension, count, classes, seed, orthogonal, neurons, fraction } = request
  if (![4,8,16,32].includes(dimension) || count < 1 || count > 128 || classes < 2 || classes > 16 || neurons < 64 || neurons > 4096 || fraction < .01 || fraction > .5) throw new Error('Experiment exceeds documented caps')
  if (request.chapter === 'dimension') {
    const n = orthogonal ? Math.min(count,dimension) : count
    const keys = orthogonal ? Array.from({length:n},(_,i)=>Array.from({length:dimension},(_,j)=>Number(i===j))) : randomKeys(dimension,n,seed)
    const result = capacityCurve(keys,classes,seed+1)
    progress?.(1)
    return { raw:result }
  }
  const rawKeys = randomKeys(16,count,seed)
  const raw = capacityCurve(rawKeys,classes,seed+1); progress?.(1/3)
  const lifted = capacityCurve(liftKeys(rawKeys,neurons,fraction,seed+2),classes,seed+1); progress?.(2/3)
  const dense = capacityCurve(randomKeys(neurons,count,seed+3),classes,seed+1); progress?.(1)
  return { raw,lifted,dense }
}
export type CapacityExperiment = ReturnType<typeof runCapacityExperiment>

export type TimeMode = 'identity'|'rope'|'damping'|'combined'
export function timeExperiment(mode: TimeMode, base: number, gamma: number, slow: boolean, targetLast: boolean, channel: boolean) {
  const n=8, count=7, target=Array<number>(n).fill(0); target[slow ? 6 : 0]=1
  const privateCoordinate = slow ? 0 : 6
  const competitor = target.map((x,i)=>.6*x+(i===privateCoordinate?.8:0))
  const keys = [target,...Array.from({length:count-1},()=>competitor)]
  const labels = [0,...Array<number>(count-1).fill(1)]
  if (targetLast) {keys.reverse();labels.reverse()}
  const useRope = mode==='rope'||mode==='combined', useDamping=mode==='damping'||mode==='combined'
  const gates = Array.from({length:n},(_,i)=>useDamping ? gamma ** (channel ? 1+Math.floor(i/2)/3 : 1) : 1)
  const transformed = keys.map((k,t)=>useRope ? rotatePairwise(k,t,base):k)
  let state: Matrix = zeros(n,3)
  transformed.forEach((key,t)=> {state=state.map((row,i)=>row.map(v=>v*gates[i])); state=addMatrices(state,outer(key,[Number(labels[t]===0),Number(labels[t]===1),0]))})
  const points = Array.from({length:24},(_,distance)=> {
    const t=count+distance
    const query=useRope?rotatePairwise(target,t,base):target
    const aged=state.map((row,i)=>row.map(v=>v*gates[i]**(distance+1)))
    const recurrent=vectorTimesMatrix(query,aged)
    const parallel=Array<number>(3).fill(0)
    transformed.forEach((key,s)=>{ parallel[labels[s]]+=key.reduce((sum,v,i)=>sum+v*query[i]*gates[i]**(t-s),0) })
    return { distance:distance+1,target:recurrent[0],competitor:recurrent[1],parity:Math.max(...parallel.map((v,i)=>Math.abs(v-recurrent[i]))) }
  })
  return {points,parity:Math.max(...points.map(p=>p.parity))}
}

export type MemoryRule = 'additive'|'delta'|'gated'|'channel'
export type WriteScenario = 'revision'|'trip'|'overcapacity'
export function writeExperiment(rule: MemoryRule, scenario: WriteScenario, beta: number, alpha: number, seed: number) {
  const basis = (i:number)=>Array.from({length:4},(_,j)=>Number(i===j))
  const keys = scenario==='overcapacity' ? randomKeys(4,8,seed) : scenario==='trip' ? [basis(0),basis(1),basis(2),basis(1)] : [basis(0),basis(1),basis(0)]
  const values = scenario==='overcapacity' ? keys.map((_,i)=>[Number(i%3===0),Number(i%3===1),Number(i%3===2)]) : scenario==='trip' ? [[1,0,0],[1,0,0],[0,0,1],[0,1,0]] : [[1,0,0],[0,0,1],[0,1,0]]
  const gates = basis(0).map((_,i)=>rule==='gated' ? alpha : rule==='channel' ? alpha**(1+i/3) : 1)
  let state: Matrix = zeros(4,3)
  const transitions: number[][][]=[]; const writes: number[][][]=[];const losses:number[]=[]
  keys.forEach((key,t)=> {
    const prior=state.map((row,i)=>row.map(v=>v*gates[i]))
    const prediction=vectorTimesMatrix(key,prior)
    losses.push(values[t].reduce((sum,v,i)=>sum+(v-prediction[i])**2,0)/2)
    const strength=rule==='additive'?1:beta
    const correction=rule==='additive'?values[t]:values[t].map((v,i)=>v-prediction[i])
    state=addMatrices(prior,outer(key,correction.map(v=>v*strength)))
    transitions.push(key.map((ki,i)=>key.map((kj,j)=>(Number(i===j)-(rule==='additive'?0:beta*ki*kj))*gates[j])))
    writes.push(outer(key,values[t].map(v=>strength*v)))
  })
  // Independent expanded affine product, not the optimized WY/DPLR algorithm.
  let expanded: Matrix=zeros(4,3)
  for(let s=0;s<keys.length;s++) {
    let contribution:Matrix=writes[s]
    for(let t=s+1;t<keys.length;t++) contribution=transitions[t].map(row=>Array.from({length:3},(_,j)=>row.reduce((sum,a,i)=>sum+a*contribution[i][j],0)))
    expanded=addMatrices(expanded,contribution)
  }
  const queries=scenario==='overcapacity'?keys:scenario==='trip'?[basis(0),basis(1),basis(2)]:[basis(0),basis(1)]
  const expected=scenario==='overcapacity'?values:scenario==='trip'?[[1,0,0],[0,1,0],[0,0,1]]:[[0,1,0],[0,0,1]]
  return { state, losses, parity:maxAbsDifference(state,expanded), reads:queries.map((key,i)=>({expected:expected[i],actual:vectorTimesMatrix(key,state)})) }
}

export function tensorAccounting(layers:number, heads:number, neurons:number, values:number, kvLayers:number, kvHeads:number, headDimension:number, length:number, bytes:number) {
  const state=layers*heads*neurons*values*bytes
  const perToken=2*kvLayers*kvHeads*headDimension*bytes
  return {state,kv:perToken*length,crossover:state/perToken}
}
