import { useState } from 'react'
import type { latentSystem } from '../latent/system'

type Result = ReturnType<typeof latentSystem>
const hasEdge = (edges: Result['visible'], a: number, b: number) => edges.some(([x, y]) => x === a && y === b)
// Facts on the rule chain plus the unreachable control, in reading order.
const chain = [0, 1, 2, 3, 6]
const factRole: Record<number, string> = { 0: 'start', 3: 'target', 6: 'control' }

export function RuleGraph({ result, step }: { result: Result; step: number }) {
  const reached = result.history[step].frontier
  const positions: Record<number, [number, number]> = {0:[55,75],1:[180,75],2:[305,75],3:[430,75],6:[430,185],8:[55,185],9:[180,185]}
  return <figure className="rule-graph"><svg viewBox="0 0 490 235" role="img" aria-label={`Stored rule graph at step ${step}. Reached facts: ${reached.join(', ')}. ${hasEdge(result.visible,1,2)?'Rule 1 to 2 is stored.':'Rule 1 to 2 is missing.'} Fact 6 has no incoming world rule.`}>
    {result.world.map(([a,b]) => {const [x,y]=positions[a],[xx,yy]=positions[b],stored=hasEdge(result.visible,a,b);return <g key={`${a}-${b}`}><line x1={x+27} y1={y} x2={xx-31} y2={yy} stroke={stored?'#d7f35f':'#ff9a82'} strokeWidth="2" strokeDasharray={stored?undefined:'5 5'}/><path d={`M ${xx-37} ${yy-5} L ${xx-30} ${yy} L ${xx-37} ${yy+5}`} fill="none" stroke={stored?'#d7f35f':'#ff9a82'} strokeWidth="2"/><text x={(x+xx)/2} y={y-22} textAnchor="middle">{stored?(a===0||a===8?'background G':'demonstration σ'):'missing'}</text></g>})}
    {Object.entries(positions).map(([id,[x,y]])=>{const fact=Number(id),on=reached.includes(fact);return <g key={id}><circle cx={x} cy={y} r="26" fill={on?(fact===6?'#ff9a82':'#d7f35f'):'#24324c'} stroke={fact===6?'#ff9a82':'#73819a'} strokeWidth="1.5"/><text className={`graph-fact ${on?'is-on':''}`} x={x} y={y+7} textAnchor="middle">{id}</text><text x={x} y={y+44} textAnchor="middle">{factRole[fact] ?? (on?'reached':'not reached')}</text></g>})}
  </svg><figcaption>Solid links are stored rules; a dashed link is missing. Fact 6 is a control with no path from fact 0, so it turns coral if activity reaches it.</figcaption></figure>
}

/** Steps as rows, neurons regrouped by fact code as columns: propagation reads as a staircase. */
function ActivityRaster({ result, step, setStep }: { result: Result; step: number; setStep: (s: number) => void }) {
  const owners = (n: number) => chain.filter(f => result.codes[f].includes(n)).length
  return <figure className="activity-raster">
    <div className="raster-row raster-row--head" aria-hidden="true"><span>Step</span>{chain.map(f => <span key={f} className="raster-group"><b>{f}</b><small>{factRole[f] ?? 'fact'}</small></span>)}<span>Decoded</span></div>
    {result.history.map((h, i) => <button key={i} className="raster-row" aria-pressed={step === i} aria-label={`Step ${i}: facts ${h.frontier.join(', ') || 'none'}`} onClick={() => setStep(i)}>
      <span className="raster-step">{i}</span>
      {chain.map(f => <span key={f} className={`raster-group ${h.frontier.includes(f) ? 'is-reached' : ''} ${f === 6 ? 'is-control' : ''}`}>{result.codes[f].map((n, j) => <i key={j} className={`${h.state[n] ? 'on' : ''} ${owners(n) > 1 ? 'shared' : ''}`} title={`Neuron ${n}: ${h.state[n]}`} />)}</span>)}
      <span className="raster-frontier">{h.frontier.join(', ') || 'none'}</span>
    </button>)}
    <figcaption>Each column group is one fact's code of {result.codes[0].length} neurons. Lit cells are active. A fact counts as reached (outlined) once 80% of its code is on. Cells marked with a dot belong to more than one fact's code.</figcaption>
  </figure>
}

/** Demonstration memory σ restricted to the chain codes, arranged in fact-by-fact blocks. */
function BlockMatrix({ result, rule }: { result: Result; rule: [number, number] }) {
  const k = result.codes[0].length, size = 360, cell = size / (chain.length * k), pad = 44
  const at = (f: number) => chain.indexOf(f) * k * cell
  const missing = !hasEdge(result.visible, 1, 2)
  const nonzero = chain.flatMap(a => chain.flatMap(b => result.codes[a].flatMap(i => result.codes[b].map(j => result.synapses[i][j])))).filter(Boolean).length
  return <figure className="matrix-overview"><svg viewBox={`0 0 ${size + pad + 8} ${size + pad + 8}`} role="img" aria-label={`Demonstration memory restricted to facts ${chain.join(', ')}. ${nonzero} nonzero cells in this view. Rule 1 to 2 ${missing ? 'is missing, so its block is zero' : 'is written'}.`}>
    <rect x={pad} y={pad} width={size} height={size} fill="#111b30" />
    {chain.map(f => <g key={f}><text x={pad + at(f) + k * cell / 2} y={pad - 12} textAnchor="middle">{f}</text><text x={pad - 12} y={pad + at(f) + k * cell / 2 + 4} textAnchor="end">{f}</text></g>)}
    <text x={pad + size / 2} y="14" textAnchor="middle" className="axis-title">To fact code</text>
    <text transform={`translate(12 ${pad + size / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">From fact code</text>
    {chain.flatMap(a => chain.flatMap(b => result.codes[a].flatMap((i, r) => result.codes[b].map((j, c) => { const w = result.synapses[i][j]; return w ? <rect key={`${a}-${b}-${r}-${c}`} x={pad + at(b) + c * cell + .5} y={pad + at(a) + r * cell + .5} width={cell - 1} height={cell - 1} fill="#d7f35f" opacity={Math.min(1, .35 + w * k * .65)}><title>Neuron {i} to {j}: {Number(w.toFixed(3))}</title></rect> : null }))))}
    {[[0, 1]].map(([a, b]) => <g key="g"><rect x={pad + at(b) + 1} y={pad + at(a) + 1} width={k * cell - 2} height={k * cell - 2} fill="none" stroke="#9aa6bd" strokeDasharray="2 3" /><text x={pad + at(b) + k * cell / 2} y={pad + at(a) + k * cell / 2 + 4} textAnchor="middle" className="block-note">G</text></g>)}
    {missing && <g><rect x={pad + at(2) + 1} y={pad + at(1) + 1} width={k * cell - 2} height={k * cell - 2} fill="none" stroke="#ff9a82" strokeWidth="1.5" strokeDasharray="5 4" /><text x={pad + at(2) + k * cell / 2} y={pad + at(1) + k * cell / 2 + 4} textAnchor="middle" className="block-note block-note--missing">0</text></g>}
    <rect x={pad + at(rule[1])} y={pad + at(rule[0])} width={k * cell} height={k * cell} fill="none" stroke="#b9acff" strokeWidth="2.5" />
    {chain.slice(1).map(f => <g key={f}><line x1={pad + at(f)} x2={pad + at(f)} y1={pad} y2={pad + size} stroke="#34435f" /><line y1={pad + at(f)} y2={pad + at(f)} x1={pad} x2={pad + size} stroke="#34435f" /></g>)}
  </svg><figcaption>Rows and columns are regrouped by fact code, so each written rule appears as one lit block. The dotted block marks background rule G (not part of σ). {missing ? 'The coral block is where the missing demonstration 1 to 2 would write; it is exactly zero. ' : ''}Shared neurons make a write light up in more than one block. The violet frame is the magnified rule.</figcaption></figure>
}

export function LatentWorkspace({ result }: { result: Result }) {
  const [requestedStep,setStep]=useState(result.history.length-1),[requestedFact,setFact]=useState(3),[rule,setRule]=useState('1,2')
  const step=Math.min(requestedStep,result.history.length-1),fact=Math.min(requestedFact,result.codes.length-1)
  const state=result.history[step].state,code=result.codes[fact],active=code.filter(n=>state[n]===1).length
  const [from,to]=rule.split(',').map(Number),sourceCode=result.codes[from],targetCode=result.codes[to]
  const n=result.synapses.length
  const entries=result.synapses.flatMap((row,i)=>row.flatMap((weight,j)=>weight?[{i,j,weight}]:[]))
  const isDemonstration=from===2||from===1&&hasEdge(result.visible,1,2)
  return <div className="unsealed-mechanism state-workspace">
    <div className="workspace-heading"><div><p className="workspace-kicker">Inside the example</p><h3>Decoded frontier by step</h3></div><p>Every view below reads the same recorded run. Choose a step to follow activity; choose a fact to find its neurons.</p></div>
    <div className="step-selector"><span className="step-label">Inspect computation step <output>{step} / {result.history.length-1}</output></span><div className="step-buttons" aria-label="Recorded computation steps">{result.history.map((h,i)=><button key={i} aria-label={`Inspect step ${i}`} aria-pressed={step===i} onClick={()=>setStep(i)}><span>{i}</span><small>{h.frontier.join(', ')}</small></button>)}</div></div>
    <div className="state-view-grid">
      <section className="graph-view"><p className="view-index">A</p><h4>Which facts did activity reach?</h4><RuleGraph result={result} step={step}/><p className="frontier-readout" aria-live="polite">Step {step}: facts {result.history[step].frontier.join(', ') || 'none'}</p></section>
      <section className="raster-view"><p className="view-index">B</p><h4>How did activity spread?</h4><ActivityRaster result={result} step={step} setStep={setStep}/></section>
    </div>
    <div className="state-view-grid">
      <section className="neuron-view"><p className="view-index">C</p><div className="view-heading"><h4>The neuron field</h4><label>Inspect fact<select aria-label="Inspect fact" value={fact} onChange={e=>setFact(Number(e.target.value))}>{result.codes.map((_,i)=><option value={i} key={i}>Fact {i}{i===3?' (target)':i===6?' (control)':''}</option>)}</select></label></div><div className="neuron-field" role="img" aria-label={`Step ${step}: ${state.filter(Boolean).length} active neurons of ${n}. Fact ${fact} uses neurons ${code.join(', ')}; ${active} of ${code.length} active.`}>{state.map((value,i)=><span key={i} className={`${value?'neuron-on':''} ${code.includes(i)?'neuron-code':''}`} title={`Neuron ${i}: ${value}${code.includes(i)?`, in fact ${fact}`:''}`}>{i}</span>)}</div><div className="field-legend"><span><i className="legend-on"/>Active</span><span><i/>Inactive</span><span><i className="legend-code"/>Selected fact</span></div><p className="code-readout" data-testid="selected-code">Fact {fact}: neurons [{code.join(', ')}]. {active}/{code.length} active at step {step}.</p></section>
      <section className="synaptic-view"><p className="view-index">D</p><div className="view-heading"><h4>Where did the demonstrations write?</h4><label>Magnify a rule<select aria-label="Magnify a rule" value={rule} onChange={e=>setRule(e.target.value)}><option value="1,2">Fact 1 to fact 2</option><option value="2,3">Fact 2 to fact 3</option></select></label></div><BlockMatrix result={result} rule={[from,to]}/></section>
    </div>
    <div className="synapse-magnifier"><div><p className="workspace-kicker">Magnified: fact {from} to fact {to}</p><h5>{isDemonstration?'The stored write':'No demonstration was written'}</h5><p>A rule adds 1/k to every synapse from its source code to its target code. This view contains demonstration memory σ only; background connections G appear as stored rules in the graph.</p></div><div className="table-scroll"><table><caption>Exact weights between the two fact codes</caption><thead><tr><th>From / to</th>{targetCode.map(j=><th key={j}>{j}</th>)}</tr></thead><tbody>{sourceCode.map(i=><tr key={i}><th>{i}</th>{targetCode.map(j=><td key={j} data-weight={result.synapses[i][j]} className={result.synapses[i][j]?'weight-nonzero':''}>{Number(result.synapses[i][j].toFixed(3))}</td>)}</tr>)}</tbody></table></div></div>
    <details className="workspace-records"><summary>Demonstration synapses and fact codes (numeric)</summary><p>{result.codes.map((c,i)=>`Fact ${i}: [${c.join(',')}]`).join('; ')}</p><p>All {n} × {n} nonzero demonstration synapses: {entries.map(({i,j,weight})=>`${i} to ${j}: ${weight}`).join('; ')||'none'}.</p><ol>{result.history.map((h,i)=><li key={i}>Step {i}: facts {h.frontier.join(', ')}. Neuron state [{h.state.join(', ')}].</li>)}</ol></details>
  </div>
}
