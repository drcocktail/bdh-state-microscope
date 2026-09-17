import { seededRandom } from '../engine/random'

export type Edge = readonly [number,number]
export type Fault = 'coverage'|'compute'|'binding'
export type Action = 'compute'|'demonstrate'|'separate'|'control'
export type LatentControls = {seed:number;facts:number;neurons:number;active:number;distributed:boolean;shared:number;steps:number;coverage:boolean}
export const worldEdges:Edge[]=[[0,1],[1,2],[2,3],[8,9]]
export function bfs(edges:readonly Edge[],start:number,target:number):{reachable:boolean;distance:number|null} {
  const distances=new Map<number,number>([[start,0]]),queue=[start]
  for(let index=0;index<queue.length;index++) for(const [a,b] of edges) if(a===queue[index]&&!distances.has(b)){distances.set(b,distances.get(a)!+1);queue.push(b)}
  return {reachable:distances.has(target),distance:distances.get(target)??null}
}
export function latentSystem(controls:LatentControls) {
  const {seed,facts,steps,coverage,distributed}=controls
  if(facts<12||facts>32||steps<0||steps>12||controls.neurons<16||controls.neurons>128||controls.active<1||controls.active>8)throw new Error('Latent experiment exceeds caps')
  const neurons=distributed?controls.neurons:facts,active=distributed?controls.active:1
  const random=seededRandom(seed),indices=Array.from({length:neurons},(_,i)=>i)
  for(let i=indices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]]}
  const codes=Array.from({length:facts},(_,fact)=>Array.from({length:active},(_,j)=>indices[(fact*active+j)%neurons]))
  if(distributed){const shared=Math.min(active,Math.max(0,Math.round(controls.shared)));codes[6]=[...codes[3].slice(0,shared),...codes[6].filter(n=>!codes[3].includes(n)).slice(0,active-shared)];if(codes[6].length<active)for(const n of indices)if(!codes[6].includes(n)&&codes[6].length<active)codes[6].push(n)}
  const background:Edge[]=[[0,1],[8,9]],demonstrations:Edge[]=coverage?[[1,2],[2,3]]:[[2,3]]
  const visible=[...background,...demonstrations]
  const matrix=Array.from({length:neurons},()=>Array<number>(neurons).fill(0))
  const synapses=Array.from({length:neurons},()=>Array<number>(neurons).fill(0))
  for(const [a,b] of visible)for(const i of codes[a])for(const j of codes[b])matrix[i][j]+=1/active
  for(const [a,b] of demonstrations)for(const i of codes[a])for(const j of codes[b])synapses[i][j]+=1/active
  let state=Array.from({length:neurons},(_,i)=>Number(codes[0].includes(i)))
  const decode=(x:readonly number[])=>codes.map((code,fact)=>({fact,on:code.filter(n=>x[n]>=1).length/active>=.8})).filter(v=>v.on).map(v=>v.fact)
  const history=[{state:[...state],frontier:decode(state)}]
  for(let step=0;step<steps;step++){const activation=Array.from({length:neurons},(_,j)=>state.reduce((sum,x,i)=>sum+x*matrix[i][j],0));state=state.map((x,i)=>Math.min(1,x+Number(activation[i]>=.6)));history.push({state:[...state],frontier:decode(state)})}
  const answer=(target:number)=>decode(state).includes(target)
  return {codes,history,synapses,visible,world:worldEdges,output:answer(3),controlOutput:answer(6),truth:bfs(worldEdges,0,3),visibleTruth:bfs(visible,0,3),controlTruth:bfs(worldEdges,0,6),answer}
}
export function faultControls(fault:Fault,seed:number):LatentControls {return {seed,facts:12,neurons:96,active:4,distributed:true,shared:fault==='binding'?4:0,steps:fault==='compute'?1:6,coverage:fault!=='coverage'}}
export function applyAction(controls:LatentControls,action:Action):LatentControls {return {...controls,...(action==='compute'?{steps:Math.min(12,controls.steps+2)}:action==='demonstrate'?{coverage:true}:action==='separate'?{neurons:128,shared:0}:{})}}
export function outputTrace(fault:Fault,seed:number,sequence:readonly Action[],restricted=false) {
  let controls=faultControls(fault,seed)
  const observe=()=>{const s=latentSystem(controls);return restricted?[s.answer(11)]:[s.output,s.controlOutput]}
  const trace=[observe()]
  for(const action of sequence){controls=applyAction(controls,action);trace.push(observe())}
  return JSON.stringify(trace)
}
export function interventionSequences(menu:readonly Action[],budget:number):Action[][] {
  if(budget<0||budget>5)throw new Error('Budget cap is five')
  const sequences:Action[][]=[[]]
  let level:Action[][]=[[]]
  for(let depth=1;depth<=budget;depth++){level=level.flatMap(prefix=>menu.map(action=>[...prefix,action]));sequences.push(...level)}
  return sequences
}
export function identifiability(seed:number,menu:readonly Action[],budget:number,restricted=false) {
  const faults:Fault[]=['coverage','compute','binding'],sequences=interventionSequences(menu,budget)
  // Repeated actions often reach the same exact controlled state. Cache only its
  // deterministic observation, not the sequence: every permitted trace is still
  // enumerated and compared, including its initial observation and order.
  const observations=new Map<string,boolean[]>()
  const observe=(controls:LatentControls)=>{
    const key=JSON.stringify(controls)
    let output=observations.get(key)
    if(!output){const s=latentSystem(controls);output=restricted?[s.answer(11)]:[s.output,s.controlOutput];observations.set(key,output)}
    return output
  }
  const signatures=faults.map(f=>sequences.map(sequence=>{
    let controls=faultControls(f,seed)
    const trace=[observe(controls)]
    for(const action of sequence){controls=applyAction(controls,action);trace.push(observe(controls))}
    return JSON.stringify(trace)
  }).join('|'))
  const indistinguishable:Fault[][]=[]
  for(let i=0;i<faults.length;i++)for(let j=i+1;j<faults.length;j++)if(signatures[i]===signatures[j])indistinguishable.push([faults[i],faults[j]])
  return {identifiable:indistinguishable.length===0,indistinguishable,sequences:sequences.length}
}
