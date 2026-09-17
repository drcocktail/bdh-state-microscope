import { sources, type SourceId } from '../content/sources'

// Authored conceptual relations, not a lineage inferred from model internals.
export function SynthesisMap() {
  const nodes=[
    {x:10,y:34,label:'Coconut',detail:'Continuous hidden thought'},
    {x:280,y:34,label:'Superposition',detail:'Formal reachability construction'},
    {x:550,y:34,label:'BDH-CQ',detail:'Recurrent memory + workspace'},
    {x:820,y:34,label:'Table 3',detail:'Context intervention evidence'},
    {x:10,y:174,label:'Recurrent depth',detail:'An inference compute axis'},
    {x:280,y:174,label:'CQ Table 5',detail:'Paper-reported effort outcomes'},
    {x:10,y:314,label:'Public BDH',detail:'Interpretable synaptic state'},
    {x:280,y:314,label:'Mechanism evidence',detail:'Inspectable state in principle'},
    {x:550,y:314,label:'Proprietary CQ',detail:'Exact internals not public'},
    {x:820,y:314,label:'Interface evidence',detail:'Outside intervention tests'},
  ]
  const edges:{from:number;to:number;relation:string;ids:SourceId[]}[]=[
    {from:0,to:1,relation:'Formal frontier account',ids:['coconut','superposition']},
    {from:1,to:2,relation:'Conceptual comparison',ids:['superposition','cq']},
    {from:2,to:3,relation:'Tests context coverage',ids:['cq']},
    {from:4,to:5,relation:'Tests compute effort',ids:['depth','cq']},
    {from:6,to:7,relation:'Enables state inspection',ids:['bdh']},
    {from:8,to:9,relation:'Limits outside access',ids:['cq']},
  ]
  return <figure className="synthesis-map"><div className="table-scroll"><svg viewBox="0 0 1050 420" aria-labelledby="synthesis-map-title synthesis-map-description">
    <title id="synthesis-map-title">Our synthesis: latent reasoning, compute and observability</title>
    <desc id="synthesis-map-description">Directed conceptual relations with source markers. These are not claims of implementation ancestry. The six relations are described in the reading notes below.</desc>
    <defs><marker id="synthesis-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#546876"/></marker></defs>
    {edges.map(({from,to,relation,ids})=>{const a=nodes[from],b=nodes[to],mid=(a.x+220+b.x)/2;return <g key={`${from}-${to}`}><path d={`M${a.x+220} ${a.y+40}H${b.x-5}`} fill="none" stroke="#546876" strokeWidth="2" markerEnd="url(#synthesis-arrow)"/><text x={mid} y={a.y-13} textAnchor="middle" className="map-relation">{relation}</text><text x={mid} y={a.y+4} textAnchor="middle" className="map-relation">{ids.map(id=>`[I${sources.findIndex(s=>s.id===id)+1}]`).join(' ')}</text></g>})}
    {nodes.map(({x,y,label,detail})=><g key={label}><rect x={x} y={y+12} width="220" height="76" rx="3" fill="white" stroke="#70828c"/><text x={x+14} y={y+43} className="map-node">{label}</text><text x={x+14} y={y+65} className="map-detail">{detail}</text></g>)}
  </svg></div><figcaption>Our synthesis, not model ancestry or a causal mechanism claim. Each edge names a relation and its instrument-source markers. Scroll the diagram on small screens; the reading notes below carry the same relations and keyboard-focusable citations.</figcaption></figure>
}
