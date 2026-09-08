import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  argMax,
  maxAbsDifference,
  runChunked,
  runParallel,
  runRecurrent,
  targetMargin,
  type Matrix,
  type Vector,
} from './engine/microscope'
import {
  KEY_DIMENSION,
  VALUE_LABELS,
  buildAssociationScenario,
  comparePlasticityRules,
  identicalKeyConflict,
  runOverlapSweep,
} from './engine/scenarios'

const SOURCES = {
  bdh: 'https://arxiv.org/abs/2509.26507',
  bdhCq: 'https://arxiv.org/abs/2608.09888',
  coconut: 'https://arxiv.org/abs/2412.06769',
  recurrentDepth: 'https://arxiv.org/abs/2502.05171',
  implementation: 'https://github.com/pathwaycom/bdh',
  deltaNet: 'https://arxiv.org/abs/2102.11174',
  parallelDeltaNet: 'https://arxiv.org/abs/2406.06484',
  gatedDeltaNet: 'https://arxiv.org/abs/2412.06464',
  zoology: 'https://arxiv.org/abs/2312.04927',
}

const ESSAY_LENSES = [
  { id: 'falsify', label: 'Try to falsify it', note: 'Demand the next discriminating test.' },
  { id: 'connect', label: 'Connect to BDH-CQ', note: 'Separate analogy from evidence.' },
  { id: 'teach', label: 'Teach the distinction', note: 'Turn the trace into a check question.' },
] as const

type EssayLens = (typeof ESSAY_LENSES)[number]['id']

const PRESETS = [
  { name: 'Separated', note: 'Distinct directions; recall holds.', overlap: 0.08, itemCount: 6 },
  { name: 'Collision', note: 'Same state shape; recall breaks.', overlap: 0.82, itemCount: 6 },
  { name: 'High load', note: 'Seven writes into 8 × 3 state.', overlap: 0.58, itemCount: 7 },
] as const

const valueColor = (index: number) =>
  ['var(--amber)', 'var(--violet)', 'var(--mint)'][index] ?? 'var(--acid)'

const formatNumber = (value: number, digits = 3) =>
  Math.abs(value) < 0.0005 ? '0' : value.toFixed(digits)

function EvidenceTag({
  children,
  tone = 'live',
}: {
  children: ReactNode
  tone?: 'live' | 'paper' | 'limit' | 'formal'
}) {
  return <span className={`evidence-tag evidence-tag--${tone}`}>{children}</span>
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="source-link">
      {children}<span aria-hidden="true"> ↗</span>
    </a>
  )
}

function VectorStrip({ values, label }: { values: Vector; label: string }) {
  const largest = Math.max(1e-12, ...values.map(Math.abs))
  return (
    <div
      className="vector-strip"
      role="img"
      aria-label={`${label}: ${values.map((value) => value.toFixed(3)).join(', ')}`}
    >
      {values.map((value, index) => {
        const strength = Math.abs(value) / largest
        return (
          <span
            key={`${label}-${index}`}
            title={`${index + 1}: ${value.toFixed(4)}`}
            style={{
              background: value >= 0
                ? `rgb(215 243 95 / ${0.12 + strength * 0.88})`
                : `rgb(217 88 66 / ${0.12 + strength * 0.88})`,
            }}
          />
        )
      })}
    </div>
  )
}

function MatrixHeatmap({
  matrix,
  title,
  rowLabels,
  columnLabels,
  compact = false,
}: {
  matrix: Matrix
  title: string
  rowLabels: readonly string[]
  columnLabels: readonly string[]
  compact?: boolean
}) {
  const largest = Math.max(1e-12, ...matrix.flat().map(Math.abs))
  return (
    <div
      className={`heatmap ${compact ? 'heatmap--compact' : ''}`}
      style={{ '--heatmap-columns': columnLabels.length } as CSSProperties}
      role="img"
      aria-label={`${title}. ${matrix.map((row) => row.map((value) => value.toFixed(3)).join(', ')).join('; ')}`}
    >
      <span className="heatmap__corner">{title}</span>
      {columnLabels.map((label) => <span className="heatmap__axis" key={`column-${label}`}>{label}</span>)}
      {matrix.map((row, rowIndex) => (
        <div className="heatmap__row" key={`${rowLabels[rowIndex]}-${rowIndex}`}>
          <span className="heatmap__row-label">{rowLabels[rowIndex]}</span>
          {row.map((value, columnIndex) => {
            const strength = Math.abs(value) / largest
            return (
              <span
                className="heatmap__cell"
                key={`${rowIndex}-${columnIndex}`}
                title={`${rowLabels[rowIndex]} × ${columnLabels[columnIndex]}: ${value.toFixed(6)}`}
                style={{
                  background: value >= 0
                    ? `rgb(54 185 155 / ${0.07 + strength * 0.82})`
                    : `rgb(217 88 66 / ${0.07 + strength * 0.82})`,
                }}
              >
                {formatNumber(value, compact ? 2 : 3)}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function OutputBars({ output, targetIndex }: { output: Vector; targetIndex?: number }) {
  const positive = output.map((value) => Math.max(0, value))
  const largest = Math.max(1e-12, ...positive)
  return (
    <div className="output-bars">
      {VALUE_LABELS.map((label, index) => (
        <div className="output-bar" key={label}>
          <div className="output-bar__label">
            <span><i style={{ background: valueColor(index) }} />{label}{index === targetIndex && <small> expected</small>}</span>
            <strong>{formatNumber(output[index])}</strong>
          </div>
          <div className="output-bar__track">
            <span style={{ width: `${(positive[index] / largest) * 100}%`, background: valueColor(index) }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CausalMatrix({
  scores,
  labels,
  selected,
}: {
  scores: Matrix
  labels: readonly string[]
  selected: number
}) {
  const largest = Math.max(1e-12, ...scores.flat().map(Math.abs))
  return (
    <div
      className="causal-matrix"
      style={{ '--causal-columns': labels.length } as CSSProperties}
      role="img"
      aria-label={`Strictly causal score matrix. Selected row ${selected + 1}. Diagonal and future cells are zero.`}
    >
      <span />
      {labels.map((label) => <span className="causal-matrix__axis" key={`top-${label}`}>{label}</span>)}
      {scores.map((row, rowIndex) => (
        <div className={`causal-matrix__row ${rowIndex === selected ? 'is-selected' : ''}`} key={`row-${labels[rowIndex]}`}>
          <span className="causal-matrix__axis">{labels[rowIndex]}</span>
          {row.map((value, columnIndex) => {
            const isMasked = columnIndex >= rowIndex
            const strength = Math.abs(value) / largest
            return (
              <span
                className={`causal-matrix__cell ${isMasked ? 'is-masked' : ''}`}
                style={isMasked ? undefined : {
                  background: value >= 0
                    ? `rgb(215 243 95 / ${0.13 + strength * 0.87})`
                    : `rgb(255 143 121 / ${0.13 + strength * 0.87})`,
                }}
                title={`${labels[rowIndex]} attends to ${labels[columnIndex]}: ${value.toFixed(6)}`}
                key={`${rowIndex}-${columnIndex}`}
              >
                {isMasked ? '·' : formatNumber(value, 2)}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function makeChunkSchedule(length: number): number[] {
  if (length <= 2) return Array(length).fill(1) as number[]
  return [2, length - 3, 1].filter((size) => size > 0)
}

function StateMicroscope() {
  const [overlap, setOverlap] = useState<number>(PRESETS[1].overlap)
  const [itemCount, setItemCount] = useState<number>(PRESETS[1].itemCount)
  const scenario = useMemo(() => buildAssociationScenario({ overlap, itemCount }), [overlap, itemCount])
  const [selectedStep, setSelectedStep] = useState<number>(scenario.queryIndex)
  const safeStep = Math.min(selectedStep, scenario.queryIndex)
  const parallel = useMemo(() => runParallel(scenario.tokens, { rotation: 'rope' }), [scenario])
  const recurrent = useMemo(
    () => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' }),
    [scenario],
  )
  const chunked = useMemo(
    () => runChunked(scenario.tokens, makeChunkSchedule(scenario.tokens.length), { rotation: 'rope' }),
    [scenario],
  )
  const outputParity = maxAbsDifference(parallel.outputs, recurrent.outputs)
  const stateParity = maxAbsDifference(parallel.finalState, recurrent.finalState)
  const chunkParity = maxAbsDifference(parallel.outputs, chunked.outputs)
  const selectedToken = scenario.tokens[safeStep]
  const selectedRecord = recurrent.steps[safeStep]
  const queryOutput = recurrent.outputs[scenario.queryIndex]
  const prediction = argMax(queryOutput)
  const passes = prediction === scenario.targetIndex
  const margin = targetMargin(queryOutput, scenario.targetIndex)
  const labels = scenario.tokens.map((token) => token.id)

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setOverlap(preset.overlap)
    setItemCount(preset.itemCount)
    setSelectedStep(preset.itemCount)
  }

  return (
    <section className="lab-shell" id="microscope" aria-labelledby="microscope-title">
      <div className="section-kicker">
        <EvidenceTag>REPRODUCED LOCALLY</EvidenceTag>
        <span>One typed engine drives the oracle, recurrence, tests, and every cell below.</span>
      </div>
      <div className="lab-heading">
        <div>
          <p className="eyebrow">Exact equivalence microscope</p>
          <h2 id="microscope-title">One computation. Two forms.</h2>
        </div>
        <div className="parity-certificate" aria-live="polite">
          <span>max numerical error</span><strong>{outputParity.toExponential(1)}</strong>
          <small>{outputParity < 1e-10 ? 'PARITY PASS' : 'PARITY FAILED'}</small>
        </div>
      </div>

      <div className="preset-row" aria-label="Microscope presets">
        {PRESETS.map((preset) => {
          const selected = preset.overlap === overlap && preset.itemCount === itemCount
          return (
            <button
              type="button"
              className="preset-button"
              aria-pressed={selected}
              onClick={() => applyPreset(preset)}
              key={preset.name}
            >
              <span>{preset.name}</span><small>{preset.note}</small>
            </button>
          )
        })}
      </div>

      <div className="microscope-stage">
        <article className="computation-panel computation-panel--history">
          <div className="panel-heading">
            <span className="step-index">A</span>
            <div><h3>Parallel causal oracle</h3><p>Materialize every permitted query–key score, then multiply by values.</p></div>
          </div>
          <CausalMatrix scores={parallel.scores} labels={labels} selected={safeStep} />
          <code className="panel-equation">O = tril(QKᵀ, −1)V</code>
        </article>
        <div className="equivalence-bridge" aria-hidden="true"><span>=</span><small>same output</small></div>
        <article className="computation-panel computation-panel--state">
          <div className="panel-heading">
            <span className="step-index">B</span>
            <div><h3>Fixed recurrent state</h3><p>Read one 8 × 3 matrix, then update it with one outer product.</p></div>
          </div>
          <MatrixHeatmap
            matrix={selectedRecord.stateBefore}
            title={`S${safeStep}`}
            rowLabels={Array.from({ length: KEY_DIMENSION }, (_, index) => `k${index + 1}`)}
            columnLabels={VALUE_LABELS}
          />
          <code className="panel-equation">oₜ = rₜSₜ₋₁ · Sₜ = Sₜ₋₁ + rₜᵀvₜ</code>
        </article>
      </div>

      <div className="step-console">
        <div className="step-console__control">
          <label htmlFor="token-step"><span>Inspect causal step</span><strong>{safeStep + 1}/{scenario.tokens.length} · {selectedToken.label}</strong></label>
          <input
            id="token-step"
            type="range"
            min="0"
            max={scenario.queryIndex}
            step="1"
            value={safeStep}
            onChange={(event) => setSelectedStep(Number(event.target.value))}
          />
          <div className="token-sequence" aria-label="Sequence tokens">
            {scenario.tokens.map((token, index) => (
              <button
                type="button"
                className={index === safeStep ? 'is-selected' : ''}
                aria-label={`Inspect ${token.label}`}
                onClick={() => setSelectedStep(index)}
                key={token.id}
              >{token.id}</button>
            ))}
          </div>
        </div>
        <div className="write-inspector">
          <div><span>rotated key rₜ</span><VectorStrip values={selectedRecord.rotatedKey} label="Rotated key" /></div>
          <div><span>value vₜ</span><VectorStrip values={selectedToken.value} label="Value" /></div>
          <div className="write-inspector__result"><span>output before write</span><strong>[{selectedRecord.output.map((value) => formatNumber(value, 2)).join(', ')}]</strong></div>
        </div>
      </div>

      <div className="result-ribbon">
        <div className={`verdict ${passes ? 'verdict--pass' : 'verdict--fail'}`}>
          <span>{passes ? 'recall holds' : 'recall breaks'}</span>
          <strong>A → {VALUE_LABELS[prediction]}</strong>
          <small>target margin {margin > 0 ? '+' : ''}{margin.toFixed(3)}</small>
        </div>
        <OutputBars output={queryOutput} targetIndex={scenario.targetIndex} />
        <div className="compression-ledger">
          <div><span>causal score map</span><strong>{scenario.tokens.length ** 2}</strong><small>T² displayed scalars</small></div>
          <div><span>recurrent state</span><strong>{KEY_DIMENSION * VALUE_LABELS.length}</strong><small>N × D scalars, fixed</small></div>
        </div>
      </div>

      <div className="control-deck control-deck--microscope">
        <div className="control-intro">
          <p className="eyebrow">Change the substrate</p><h3>Make the fixed state collide.</h3>
          <p>RoPE stays on. Only address overlap and write load change.</p>
        </div>
        <label className="control" htmlFor="overlap-control">
          <span><strong>Shared key direction</strong><output>{Math.round(overlap * 100)}%</output></span>
          <input
            id="overlap-control"
            type="range"
            min="0"
            max="0.95"
            step="0.01"
            value={overlap}
            onChange={(event) => { setOverlap(Number(event.target.value)); setSelectedStep(itemCount) }}
          />
          <small>Cosine overlap between target A and each distractor before RoPE.</small>
        </label>
        <label className="control" htmlFor="load-control">
          <span><strong>Associations written</strong><output>{itemCount}</output></span>
          <input
            id="load-control"
            type="range"
            min="1"
            max="7"
            step="1"
            value={itemCount}
            onChange={(event) => { const next = Number(event.target.value); setItemCount(next); setSelectedStep(next) }}
          />
          <small>Sequence grows; recurrent state remains exactly 8 × 3.</small>
        </label>
        <div className="parity-ledger" aria-label="Equivalence checks">
          <span>full ↔ recurrent <strong>{outputParity.toExponential(1)}</strong></span>
          <span>full ↔ chunks <strong>{chunkParity.toExponential(1)}</strong></span>
          <span>final state <strong>{stateParity.toExponential(1)}</strong></span>
        </div>
      </div>
    </section>
  )
}

function BoundaryPlot() {
  const [load, setLoad] = useState(6)
  const sweep = useMemo(() => runOverlapSweep(load, 38), [load])
  const width = 660
  const height = 250
  const padding = { left: 52, right: 24, top: 20, bottom: 42 }
  const minimum = Math.min(0, ...sweep.map((point) => point.margin))
  const maximum = Math.max(0, ...sweep.map((point) => point.margin))
  const spread = Math.max(0.01, maximum - minimum)
  const x = (overlap: number) => padding.left + (overlap / 0.95) * (width - padding.left - padding.right)
  const y = (margin: number) => padding.top + ((maximum - margin) / spread) * (height - padding.top - padding.bottom)
  const points = sweep.map((point) => `${x(point.overlap)},${y(point.margin)}`).join(' ')
  const boundary = sweep.find((point) => !point.passes)

  return (
    <section className="boundary-section" id="boundary" aria-labelledby="boundary-title">
      <div className="section-heading section-heading--split">
        <div>
          <EvidenceTag>CONTROLLED SYNTHETIC RESULT</EvidenceTag>
          <p className="eyebrow">Failure boundary</p>
          <h2 id="boundary-title">Equivalence can be exact while recall is wrong.</h2>
        </div>
        <p>The two algorithms still agree at every point. What changes is the information mixed into the fixed state. This sweep is computed locally, with RoPE on and one controlled overlap variable.</p>
      </div>
      <div className="boundary-card">
        <div className="boundary-controls">
          <span>association load</span>
          {[3, 5, 6, 7].map((count) => (
            <button type="button" aria-pressed={load === count} onClick={() => setLoad(count)} key={count}>{count}</button>
          ))}
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="plot-title plot-desc">
            <title id="plot-title">Recall margin versus key overlap</title>
            <desc id="plot-desc">Recall margin falls as target and distractor keys overlap. A negative margin means the competitor wins.</desc>
            <line className="plot-zero" x1={padding.left} x2={width - padding.right} y1={y(0)} y2={y(0)} />
            <polyline className="plot-line" points={points} />
            {sweep.map((point) => (
              <circle
                className={point.passes ? 'plot-point plot-point--pass' : 'plot-point plot-point--fail'}
                cx={x(point.overlap)} cy={y(point.margin)} r="3.8" key={point.overlap}
              />
            ))}
            <text x={padding.left} y={height - 10}>0% overlap</text>
            <text textAnchor="end" x={width - padding.right} y={height - 10}>95% overlap</text>
            <text className="plot-label" x={padding.left + 6} y={Math.max(14, y(0) - 8)}>zero margin</text>
          </svg>
        </div>
        <div className="boundary-readout" aria-live="polite">
          <span>first sampled failure</span>
          <strong>{boundary ? `${Math.round(boundary.overlap * 100)}% overlap` : 'not reached'}</strong>
          <p>At load {load}, the amber score first stops exceeding both competitors at this sampled point. It is a mechanism probe, not a trained-model benchmark.</p>
        </div>
      </div>
    </section>
  )
}

function PlasticityLab() {
  const comparison = useMemo(() => comparePlasticityRules(), [])
  const conflict = useMemo(() => identicalKeyConflict(), [])
  const rowLabels = Array.from({ length: KEY_DIMENSION }, (_, index) => `k${index + 1}`)
  return (
    <section className="plasticity-section" id="plasticity" aria-labelledby="plasticity-title">
      <div className="section-heading section-heading--split">
        <div>
          <EvidenceTag tone="formal">BOUNDED ARCHITECTURE PROBE</EvidenceTag>
          <p className="eyebrow">Plasticity, isolated</p>
          <h2 id="plasticity-title">Can the state revise, not merely accumulate?</h2>
        </div>
        <p>We pin positional rotation to <code>U = I</code>, keep the same 8 × 3 state, and change only the write rule. The stream says A → amber, then corrects A → violet.</p>
      </div>
      <div className="plasticity-grid">
        <article className="rule-card rule-card--additive">
          <div className="rule-card__heading"><div><span>baseline</span><h3>Additive Hebbian write</h3></div><EvidenceTag>REPRODUCED</EvidenceTag></div>
          <code>S ← S + kᵀv</code>
          <MatrixHeatmap matrix={comparison.additive.state} title="S" rowLabels={rowLabels} columnLabels={VALUE_LABELS} compact />
          <OutputBars output={comparison.additive.output} targetIndex={1} />
          <div className="rule-verdict rule-verdict--fail"><span>read A</span><strong>[1, 1, 0] · old and new tie</strong><small>MSE to correction: {comparison.additive.error.toFixed(3)}</small></div>
        </article>
        <article className="rule-card rule-card--delta">
          <div className="rule-card__heading"><div><span>controlled intervention</span><h3>Normalized delta write</h3></div><EvidenceTag>REPRODUCED</EvidenceTag></div>
          <code>S ← S + βkᵀ(v − kS)/(‖k‖² + ε)</code>
          <MatrixHeatmap matrix={comparison.delta.state} title="S" rowLabels={rowLabels} columnLabels={VALUE_LABELS} compact />
          <OutputBars output={comparison.delta.output} targetIndex={1} />
          <div className="rule-verdict rule-verdict--pass"><span>read A</span><strong>[0, 1, 0] · correction replaces trace</strong><small>MSE to correction: {comparison.delta.error.toExponential(1)}</small></div>
        </article>
      </div>
      <aside className="negative-control">
        <div><EvidenceTag tone="limit">NEGATIVE CONTROL</EvidenceTag><h3>One identical address cannot answer two incompatible questions.</h3></div>
        <p>If the same key must simultaneously return amber and violet with no context bit, any deterministic state read produces the same output for both. The delta rule chooses the latest correction; it does not defeat missing information.</p>
        <div className="negative-control__math"><code>same k → same kS</code><span>{conflict.simultaneouslySatisfiable ? 'satisfiable' : 'not simultaneously satisfiable'}</span></div>
      </aside>
    </section>
  )
}

function BdhBridge() {
  return (
    <section className="bridge-section" id="bridge" aria-labelledby="bridge-title">
      <div className="section-heading section-heading--split">
        <div><EvidenceTag tone="paper">PAPER-SUPPORTED CONTEXT</EvidenceTag><p className="eyebrow">The bridge to BDH</p><h2 id="bridge-title">Small enough to see. Exact enough to matter.</h2></div>
        <p>BDH’s sparse hidden activations supply keys and projected activations supply values. Its causal linear attention admits this recurrent state view. The microscope transposes the paper’s state orientation so key dimensions are rows and value channels are columns.</p>
      </div>
      <div className="bridge-grid">
        <article className="paper-equation">
          <span>BDH paper · recurrent state update</span>
          <code>ρₜ,ₗ = (ρₜ₋₁,ₗ + LN(Eyₜ,ₗ₋₁)xₜ,ₗᵀ)U</code>
          <p>State plus an outer-product write, followed by the positional rotation operator.</p>
          <SourceLink href={SOURCES.bdh}>Read the BDH paper</SourceLink>
        </article>
        <article className="mapping-card">
          <span>microscope mapping</span>
          <dl>
            <div><dt>BDH sparse activity x</dt><dd>key / address rₜ</dd></div>
            <div><dt>projected activity LN(Ey)</dt><dd>value vₜ</dd></div>
            <div><dt>attention history</dt><dd>fixed state S</dd></div>
            <div><dt>causal mask</dt><dd>read before current write</dd></div>
          </dl>
          <SourceLink href={SOURCES.implementation}>Inspect the official implementation</SourceLink>
        </article>
        <article className="boundary-card-small">
          <span>evidence boundary</span><h3>This is not a trained BDH checkpoint.</h3>
          <p>It executes the attention-state mechanism and controlled synthetic probes. Whether a delta-style write improves a full trained BDH requires matched training, language benchmarks, compute, and ablations.</p>
        </article>
      </div>
    </section>
  )
}

function JudgeChallenge() {
  const [prediction, setPrediction] = useState<'same' | 'different' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const scenario = useMemo(() => buildAssociationScenario({ overlap: 0.71, itemCount: 7 }), [])
  const oracle = useMemo(() => runParallel(scenario.tokens), [scenario])
  const chunks = useMemo(() => runChunked(scenario.tokens, [2, 3, 3]), [scenario])
  const error = maxAbsDifference(oracle.outputs, chunks.outputs)
  const correct = prediction === 'same'
  return (
    <section className="challenge-section" id="test" aria-labelledby="challenge-title">
      <div className="challenge-copy">
        <EvidenceTag tone="formal">60-SECOND JUDGE TEST</EvidenceTag>
        <h2 id="challenge-title">Seven writes. Three chunks. One carried state.</h2>
        <p>Will splitting the exact same sequence into chunks <code>[2, 3, 3]</code> change the final token outputs? Commit before revealing the computed result.</p>
      </div>
      <div className="challenge-action">
        <div className="prediction-buttons" role="group" aria-label="Your prediction">
          <button type="button" aria-pressed={prediction === 'same'} onClick={() => { setPrediction('same'); setRevealed(false) }}>Outputs stay the same</button>
          <button type="button" aria-pressed={prediction === 'different'} onClick={() => { setPrediction('different'); setRevealed(false) }}>Chunking changes them</button>
        </div>
        <button type="button" className="reveal-button" disabled={!prediction} onClick={() => setRevealed(true)}>Reveal computed result</button>
        {revealed && (
          <div className={`challenge-result ${correct ? 'is-correct' : 'is-incorrect'}`} aria-live="polite">
            <strong>{correct ? 'Correct.' : 'The computed result disagrees.'}</strong>
            <span>Maximum full-vs-chunk error: {error.toExponential(1)}.</span>
            <p>Chunking is a scheduling choice when the incoming state is carried exactly. It does not repair the collision: compression behavior remains identical too.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function ResearchInterlocutor() {
  const [lens, setLens] = useState<EssayLens>('falsify')
  const [overlapPercent, setOverlapPercent] = useState(80)
  const [itemCount, setItemCount] = useState(6)
  const [commentary, setCommentary] = useState('')
  const [modelName, setModelName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const scenario = useMemo(
    () => buildAssociationScenario({ overlap: overlapPercent / 100, itemCount }),
    [overlapPercent, itemCount],
  )
  const recurrent = useMemo(
    () => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' }),
    [scenario],
  )
  const output = recurrent.outputs[scenario.queryIndex]
  const prediction = argMax(output)
  const margin = targetMargin(output, scenario.targetIndex)

  const invalidateCommentary = () => {
    setCommentary('')
    setModelName('')
    setStatus('idle')
  }

  const askModel = async () => {
    setStatus('loading')
    setCommentary('')
    try {
      const query = new URLSearchParams({
        lens,
        overlap: String(overlapPercent),
        load: String(itemCount),
        scores: output.map((value) => value.toFixed(3)).join(','),
        margin: margin.toFixed(3),
      })
      const response = await fetch(`/api/explain?${query}`)
      const payload = await response.json() as { commentary?: string; error?: string; model?: string }
      if (!response.ok || !payload.commentary) throw new Error(payload.error ?? 'No commentary returned.')
      setCommentary(payload.commentary)
      setModelName(payload.model ?? 'API research co-review')
      setStatus('ready')
    } catch (error) {
      setCommentary(error instanceof Error ? error.message : 'The model endpoint is unavailable.')
      setStatus('error')
    }
  }

  return (
    <section className="interlocutor-section" id="interrogate" aria-labelledby="interlocutor-title">
      <div className="section-heading section-heading--split">
        <div>
          <EvidenceTag tone="limit">MODEL COMMENTARY · NOT EVIDENCE</EvidenceTag>
          <p className="eyebrow">Interactive companion to the required essay</p>
          <h2 id="interlocutor-title">Interrogate the silent state.</h2>
        </div>
        <div className="interlocutor-intro">
          <p>The blog argues that latent reasoning becomes testable through controlled interventions. Pick a live trace and ask the research endpoint to challenge, connect, or teach it. Groq runs a bounded GPT-OSS 120B co-review; a trace-aware deterministic response keeps the exhibit functional if the model route is unavailable. Neither path receives your text, source code, or secrets.</p>
          <a href="/dataforge-latent-reasoning-blog.pdf" target="_blank" rel="noreferrer">Open the required 600–800-word blog PDF ↗</a>
        </div>
      </div>

      <div className="interlocutor-grid">
        <article className="interlocutor-controls">
          <span className="interlocutor-label">1 · Choose the scientific lens</span>
          <div className="lens-buttons" role="group" aria-label="Research interlocutor lens">
            {ESSAY_LENSES.map((option) => (
              <button
                type="button"
                aria-pressed={lens === option.id}
                onClick={() => { setLens(option.id); invalidateCommentary() }}
                key={option.id}
              >
                <strong>{option.label}</strong><small>{option.note}</small>
              </button>
            ))}
          </div>
          <label className="interlocutor-slider" htmlFor="essay-overlap">
            <span><strong>Shared key direction</strong><output>{overlapPercent}%</output></span>
            <input
              id="essay-overlap"
              type="range"
              min="0"
              max="95"
              step="5"
              value={overlapPercent}
              onChange={(event) => { setOverlapPercent(Number(event.target.value)); invalidateCommentary() }}
            />
          </label>
          <label className="interlocutor-slider" htmlFor="essay-load">
            <span><strong>Associations written</strong><output>{itemCount}</output></span>
            <input
              id="essay-load"
              type="range"
              min="1"
              max="7"
              step="1"
              value={itemCount}
              onChange={(event) => { setItemCount(Number(event.target.value)); invalidateCommentary() }}
            />
          </label>
        </article>

        <article className="interlocutor-observation">
          <span className="interlocutor-label">2 · Deterministic observation</span>
          <div className={`interlocutor-verdict ${prediction === scenario.targetIndex ? 'is-pass' : 'is-fail'}`}>
            <span>target A → amber</span>
            <strong>argmax → {VALUE_LABELS[prediction]}</strong>
            <small>target margin {margin > 0 ? '+' : ''}{margin.toFixed(3)}</small>
          </div>
          <OutputBars output={output} targetIndex={scenario.targetIndex} />
          <p>Computed locally with RoPE on. This trace is the evidence supplied to the co-review endpoint.</p>
        </article>

        <article className="interlocutor-response">
          <div className="interlocutor-response__heading">
            <span className="interlocutor-label">3 · Interpretive co-review</span>
            <small>{modelName || 'API co-review · Groq + GPT-OSS 120B'}</small>
          </div>
          {status === 'idle' && <p className="interlocutor-placeholder">Generate a bounded critique of this exact trace. The response is interpretation—not a measurement, oracle, or citation.</p>}
          {status === 'loading' && <p className="interlocutor-placeholder" aria-live="polite">Interrogating the trace…</p>}
          {(status === 'ready' || status === 'error') && (
            <div className={`interlocutor-commentary ${status === 'error' ? 'is-error' : ''}`} aria-live="polite">{commentary}</div>
          )}
          <button type="button" onClick={askModel} disabled={status === 'loading'}>
            {status === 'loading' ? 'Interrogating…' : status === 'ready' ? 'Run another co-review' : 'Interrogate this result'}
          </button>
          <small className="interlocutor-boundary">Only bounded, internally checked trace summaries are accepted; responses are cached. Model text is never used to calculate or validate the experiment.</small>
        </article>
      </div>

      <div className="interlocutor-sources">
        <span>Essay primary sources</span>
        <SourceLink href={SOURCES.bdhCq}>BDH-CQ</SourceLink>
        <SourceLink href={SOURCES.coconut}>Coconut</SourceLink>
        <SourceLink href={SOURCES.recurrentDepth}>Recurrent depth</SourceLink>
      </div>
    </section>
  )
}

function TeachBack() {
  const [answer, setAnswer] = useState('')
  const [compared, setCompared] = useState(false)
  const normalized = answer.toLowerCase()
  const substantive = answer.trim().length >= 36
  const mentionsState = /state|matrix|fixed|compress/.test(normalized)
  const mentionsDistinction = /overlap|collision|interference|distin|same|history|equiv/.test(normalized)
  return (
    <section className="teachback" aria-labelledby="teachback-title">
      <div><p className="eyebrow">Teach it back</p><h2 id="teachback-title">What is exact—and what can still fail?</h2><p>Explain the distinction in your own words. A strong answer separates computational equivalence from memory quality.</p></div>
      <div className="teachback__input">
        <label htmlFor="teachback-answer">Your explanation</label>
        <textarea
          id="teachback-answer"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setCompared(false) }}
          placeholder="The full attention matrix and recurrent state…"
          rows={4}
        />
        <button type="button" disabled={!substantive} onClick={() => setCompared(true)}>Compare with the mechanism</button>
        {compared && (
          <div className="teachback__feedback" aria-live="polite">
            <strong>{mentionsState && mentionsDistinction ? 'Mechanism captured.' : 'One distinction is still missing.'}</strong>
            <p>{mentionsState && mentionsDistinction
              ? 'You separated the exact state-form computation from the interference caused when different associations share state directions.'
              : 'Name both the exact equivalence of the two computations and the information collision that can make both computations return the same wrong recall.'}</p>
          </div>
        )}
      </div>
    </section>
  )
}

function EvidenceLedger() {
  return (
    <section className="evidence-section" id="evidence" aria-labelledby="evidence-title">
      <div className="section-heading section-heading--split">
        <div><p className="eyebrow">Evidence ledger</p><h2 id="evidence-title">Every claim has a type.</h2></div>
        <p>The point is not to make every statement sound equally certain. It is to make the boundary inspectable.</p>
      </div>
      <div className="evidence-grid">
        <article><EvidenceTag tone="formal">FORMAL IDENTITY</EvidenceTag><h3>Parallel, recurrent, and chunk forms</h3><p>Displayed algebra; checked across deterministic fixtures to tolerance 1e−10.</p></article>
        <article><EvidenceTag>REPRODUCED LOCALLY</EvidenceTag><h3>Collision and rewrite probes</h3><p>Computed in this repository from typed scenarios. No downloaded result table.</p></article>
        <article><EvidenceTag tone="paper">PAPER-SUPPORTED</EvidenceTag><h3>BDH mechanism context</h3><p>Equation and implementation mapping are attributed to the paper and official code.</p></article>
        <article><EvidenceTag tone="limit">HYPOTHESIS</EvidenceTag><h3>Full-model improvement</h3><p>Delta-style plasticity is a candidate intervention, not a claimed BDH benchmark win.</p></article>
      </div>
      <div className="source-row">
        <SourceLink href={SOURCES.bdh}>BDH paper</SourceLink>
        <SourceLink href={SOURCES.implementation}>BDH code</SourceLink>
        <SourceLink href={SOURCES.deltaNet}>DeltaNet</SourceLink>
        <SourceLink href={SOURCES.parallelDeltaNet}>Parallel DeltaNet</SourceLink>
        <SourceLink href={SOURCES.gatedDeltaNet}>Gated DeltaNet</SourceLink>
        <SourceLink href={SOURCES.zoology}>Zoology / MQAR</SourceLink>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to the microscope</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BDH State Microscope home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>STATE MICROSCOPE</a>
        <nav aria-label="Primary navigation"><a href="#microscope">Microscope</a><a href="#boundary">Boundary</a><a href="#plasticity">Plasticity</a><a href="#interrogate">Essay lab</a><a href="#evidence">Evidence</a></nav>
        <span className="header-note">Executable BDH mechanism</span>
      </header>
      <main id="main">
        <section className="hero" id="top">
          <div>
            <p className="eyebrow">BDH state microscope · formal identity + controlled probes</p>
            <h1>Fold the attention matrix.</h1>
            <p className="hero__lede">Watch a growing causal history collapse into one fixed-shape recurrent state—without changing the answer. Then push that state until the answer fails.</p>
            <div className="hero__audience"><span>Built to prove</span><strong>equivalence, compression, interference, and one bounded architectural intervention</strong></div>
          </div>
          <aside className="claim-card">
            <span className="claim-card__label">the invariant</span>
            <blockquote><code>tril(QKᵀ, −1)V</code><em> is the same computation as </em><code>oₜ = rₜSₜ₋₁</code></blockquote>
            <a href="#microscope"><span>Open the state</span><span aria-hidden="true">↓</span></a>
          </aside>
        </section>
        <StateMicroscope />
        <BoundaryPlot />
        <PlasticityLab />
        <BdhBridge />
        <ResearchInterlocutor />
        <JudgeChallenge />
        <TeachBack />
        <EvidenceLedger />
      </main>
      <footer className="site-footer"><span>BDH State Microscope</span><p>Mechanism before metaphor. Results before claims. Negative controls included.</p><a href="#top">Back to top ↑</a></footer>
    </>
  )
}
