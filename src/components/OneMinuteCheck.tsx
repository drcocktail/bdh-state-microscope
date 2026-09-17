import { useEffect, useMemo, useState } from 'react'
import { buildAssociationScenario, fixtureMargin, runOverlapSweep } from '../engine/scenarios'
import { runRecurrent, targetMargin } from '../engine/microscope'
import { EvidenceBadge } from './Evidence'

export function OneMinuteCheck() {
  const [prediction, setPrediction] = useState<number | null>(null)
  const [committed, setCommitted] = useState(false)
  const [overlap, setOverlap] = useState(0)
  const [running, setRunning] = useState(false)
  const sweep = useMemo(() => runOverlapSweep(5, 95), [])
  const crossing = sweep.find(p => !p.passes)
  const scenario = buildAssociationScenario({ overlap, itemCount: 5 })
  const margin = targetMargin(runRecurrent(scenario.tokens).outputs[scenario.queryIndex], 0)
  useEffect(() => {
    if (!running) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setOverlap(0.95); setRunning(false); return
    }
    const id = window.setInterval(() => setOverlap(current => Math.min(0.95, current + 0.05)), 75)
    return () => window.clearInterval(id)
  }, [running])
  useEffect(() => { if (overlap >= 0.95) setRunning(false) }, [overlap])
  return <section className="challenge-section" id="one-minute-check" aria-labelledby="prediction-title">
    <div className="challenge-copy"><EvidenceBadge type="Live computation" /><p className="eyebrow">One-minute check</p><h2 id="prediction-title">Load 5. Where does recall of A first break?</h2><p>Predict the shared-key overlap before running the real fixture. m = 2. Ignore the small RoPE correction for your prediction.</p></div>
    <div className="challenge-action"><div className="prediction-buttons" role="group" aria-label="Boundary prediction">{[30,40,50,60].map(value => <button key={value} disabled={committed} aria-pressed={prediction === value} onClick={() => setPrediction(value)}>{value}%</button>)}</div><button className="reveal-button" disabled={prediction === null || committed} onClick={() => { setCommitted(true); setOverlap(0); setRunning(true) }}>Commit and run the sweep</button>
      {committed && <div className="challenge-result" aria-live="polite"><strong>{prediction === 50 ? 'Prediction matches the fixture.' : 'Compare your prediction with 1/m = 50%.'}</strong><label htmlFor="check-overlap">Live shared-key overlap {(overlap * 100).toFixed(0)}%</label><input id="check-overlap" type="range" min="0" max="0.95" step="0.01" value={overlap} onChange={e => { setRunning(false); setOverlap(Number(e.target.value)) }} /><p>Computed margin {margin.toFixed(6)}, formula {fixtureMargin(overlap,5).toFixed(6)}. {margin > 0 ? 'Strict recall holds.' : 'Strict recall fails.'}</p><p>First sampled failure {(100 * (crossing?.overlap ?? 0)).toFixed(0)}%, with a 1% sampling grid and RoPE on.</p><button onClick={() => { setPrediction(null); setCommitted(false); setRunning(false) }}>Try again</button></div>}
    </div>
  </section>
}
