import { describe, expect, it } from 'vitest'
import { runParallel, runRecurrent, runChunked, maxAbsDifference, targetMargin, type AttentionToken } from './microscope'
import { buildAssociationScenario, predictedBoundary, comparePlasticityRules, identicalKeyConflict } from './scenarios'
import { seededRandom } from './random'
import { runCapacityExperiment, timeExperiment, writeExperiment, tensorAccounting, capacityCurve, normalize } from './lab'
import { latentSystem, faultControls, applyAction, identifiability, outputTrace, interventionSequences, type Fault } from '../latent/system'

describe('final-push numerical contract',()=>{
  it('checks 240 seeded sequences, two bases and random chunk schedules against independent evaluations',()=>{
    for(let seed=0;seed<240;seed++) {
      const random=seededRandom(seed),n=1+Math.floor(random()*12),d=2+Math.floor(random()*6),t=1+Math.floor(random()*24)
      const tokens:AttentionToken[]=Array.from({length:t},(_,i)=>({id:String(i),label:String(i),key:Array.from({length:n},()=>2*random()-1),value:Array.from({length:d},()=>2*random()-1),role:random()<.15?'query':'association'}))
      const chunks:number[]=[];let remaining=t
      while(remaining>0){const size=1+Math.floor(random()*Math.min(5,remaining));chunks.push(size);remaining-=size}
      for(const ropeBase of [10000,65536]) {
        const full=runParallel(tokens,{ropeBase}),recurrent=runRecurrent(tokens,{ropeBase}),chunked=runChunked(tokens,chunks,{ropeBase})
        expect(maxAbsDifference(full.outputs,recurrent.outputs)).toBeLessThan(1e-10)
        expect(maxAbsDifference(full.outputs,chunked.outputs)).toBeLessThan(1e-10)
        expect(maxAbsDifference(full.finalState,recurrent.finalState)).toBeLessThan(1e-10)
        expect(maxAbsDifference(full.finalState,chunked.finalState)).toBeLessThan(1e-10)
      }
    }
  })
  it.each([4,5,6,7])('changes margin sign near the identity-frame prediction at load %i',load=>{
    const boundary=predictedBoundary(load)!
    const margin=(c:number)=>{const s=buildAssociationScenario({overlap:c,itemCount:load});return targetMargin(runRecurrent(s.tokens).outputs[s.queryIndex],0)}
    expect(margin(boundary-.001)).toBeGreaterThan(0)
    expect(margin(boundary+.001)).toBeLessThan(0)
  })
  it.each([1,2,3])('has no failure through 95%% overlap at load %i',load=>{
    expect(predictedBoundary(load)).toBeNull()
    for(let i=0;i<=95;i++){const s=buildAssociationScenario({overlap:i/100,itemCount:load});expect(targetMargin(runRecurrent(s.tokens).outputs[s.queryIndex],0)).toBeGreaterThan(0)}
  })
  it('matches the beta closed form and orthogonal-key reduction',()=>{
    for(let i=0;i<=20;i++){
      const beta=i/20,same=comparePlasticityRules(beta),orthogonal=comparePlasticityRules(beta,true)
      expect(same.delta.output[0]).toBeCloseTo(beta*(1-beta),12)
      expect(same.delta.output[1]).toBeCloseTo(beta,12)
      expect(orthogonal.delta.output).toEqual([0,beta,0])
    }
  })
  it('computes the incompatible-address optimum rather than a hardcoded verdict',()=>{
    const conflict=identicalKeyConflict()
    expect(conflict.optimalErrors[0]).toBeCloseTo(1/6,12)
    expect(conflict.errors).toEqual([2/3,0])
    expect(conflict.simultaneouslySatisfiable).toBe(false)
  })
  it('recalls orthogonal keys and rejects oversize worker requests',()=>{
    const keys=Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>Number(i===j)))
    expect(capacityCurve(keys,8,17).curve.every(p=>p.accuracy===1)).toBe(true)
    expect(()=>runCapacityExperiment({chapter:'lift',dimension:16,count:129,classes:8,seed:17,neurons:1024,fraction:.05,orthogonal:false})).toThrow()
  })
  it('reproduces a seed-specific lift comparison, without assuming universal capacities',()=>{
    const r=runCapacityExperiment({chapter:'lift',dimension:16,count:128,classes:8,seed:17,neurons:1024,fraction:.05,orthogonal:false})
    expect(r.lifted!.capacity).toBeGreaterThan(r.raw.capacity)
    expect(r.dense!.zeroCodes).toBe(0)
    expect(r.raw.maxCosine).toBeGreaterThanOrEqual(r.raw.welch!-1e-12)
  })
  it('keeps time parity across 128 combinations',()=>{
    for(const mode of ['identity','rope','damping','combined'] as const)for(const base of [10000,65536])for(const gamma of [.8,1])for(const slow of [false,true])for(const last of [false,true])for(const channel of [false,true])expect(timeExperiment(mode,base,gamma,slow,last,channel).parity).toBeLessThan(1e-10)
  })
  it('matches expanded affine products for every write-rule scenario',()=>{
    for(const rule of ['additive','delta','gated','channel'] as const)for(const scenario of ['revision','trip','overcapacity'] as const)for(const beta of [0,.35,1])expect(writeExperiment(rule,scenario,beta,.8,17).parity).toBeLessThan(1e-10)
  })
  it('accounts for tensor shapes only',()=>{
    expect(tensorAccounting(6,4,8192,256,12,12,64,32768,2)).toEqual({state:100663296,kv:1207959552,crossover:8192/3})
  })
  it('counts a genuinely positive near-tie as strict class recall',()=>{
    const result=capacityCurve([[1,0],normalize([1,4e-7])],2,1)
    expect(1-result.maxCosine).toBeGreaterThan(0)
    expect(1-result.maxCosine).toBeLessThan(1e-12)
    expect(result.curve.at(-1)!.accuracy).toBe(1)
  })
})
describe('sealed teaching system',()=>{
  it.each(['coverage','compute','binding'] as const)('plants and repairs the %s construction',fault=>{
    const controls=faultControls(fault,17),initial=latentSystem(controls)
    expect(initial.truth.reachable).toBe(true)
    if(fault==='binding'){expect(initial.controlOutput).toBe(true);expect(latentSystem(applyAction(controls,'separate')).controlOutput).toBe(false)}
    else{expect(initial.output).toBe(false);expect(latentSystem(applyAction(controls,fault==='coverage'?'demonstrate':'compute')).output).toBe(true)}
  })
  it('agrees with an independent pairwise brute-force identifiability check',()=>{
    const faults:Fault[]=['coverage','compute','binding']
    for(const seed of [17,18])for(const budget of [0,1,3,5])for(const restricted of [false,true]){
      const menu=restricted?['control'] as const:['compute','demonstrate','separate'] as const
      const sequences=interventionSequences(menu,budget),indistinguishable:Fault[][]=[]
      faults.forEach((a,i)=>faults.slice(i+1).forEach(b=>{
        if(!sequences.some(s=>outputTrace(a,seed,s,restricted)!==outputTrace(b,seed,s,restricted)))indistinguishable.push([a,b])
      }))
      expect(identifiability(seed,menu,budget,restricted)).toEqual({identifiable:indistinguishable.length===0,indistinguishable,sequences:sequences.length})
    }
  })
})
