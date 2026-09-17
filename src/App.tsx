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
  predictedBoundary, fixtureMargin, distractorMultiplicity,
} from './engine/scenarios'

import { Citation, References, ArtifactFooter } from './components/Evidence'
import { OneMinuteCheck } from './components/OneMinuteCheck'
import { useUrlNumber } from './components/controls'

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

const PRESETS = [
  { name: 'Separated', note: 'Distinct directions; recall holds.', overlap: 0.08, itemCount: 6 },
  { name: 'Collision', note: 'Same state shape; recall breaks.', overlap: 0.82, itemCount: 6 },
  { name: 'Seven writes, 58% overlap', note: 'Interference, not a full state.', overlap: 0.58, itemCount: 7 },
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
      {children}
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
      aria-label={`Strictly causal score matrix. Selected row ${selected + 1}: ${scores[selected].map(v => v.toFixed(4)).join(', ')}. Diagonal and future cells are zero.`}
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
                {isMasked ? ';' : formatNumber(value, 2)}
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
  const [overlap, setOverlap] = useUrlNumber('overlap', PRESETS[1].overlap, 0, 0.95)
  const [itemCount, setItemCount] = useUrlNumber('load', PRESETS[1].itemCount, 1, 7)
  const [ropeBase, setRopeBase] = useUrlNumber('base', 2 ** 16, 10000, 65536)
  const scenario = useMemo(() => buildAssociationScenario({ overlap, itemCount }), [overlap, itemCount])
  const [selectedStep, setSelectedStep] = useUrlNumber('step', scenario.queryIndex, 0, 7)
  const safeStep = Math.min(selectedStep, scenario.queryIndex)
  const parallel = useMemo(() => runParallel(scenario.tokens, { rotation: 'rope', ropeBase }), [scenario, ropeBase])
  const recurrent = useMemo(
    () => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive', ropeBase }),
    [scenario, ropeBase],
  )
  const chunked = useMemo(
    () => runChunked(scenario.tokens, makeChunkSchedule(scenario.tokens.length), { rotation: 'rope', ropeBase }),
    [scenario, ropeBase],
  )
  const outputParity = maxAbsDifference(parallel.outputs, recurrent.outputs)
  const stateParity = maxAbsDifference(parallel.finalState, recurrent.finalState)
  const chunkParity = maxAbsDifference(parallel.outputs, chunked.outputs)
  const selectedToken = scenario.tokens[safeStep]
  const selectedRecord = recurrent.steps[safeStep]
  const queryOutput = recurrent.outputs[scenario.queryIndex]
  const prediction = argMax(queryOutput)
  const passes = targetMargin(queryOutput, scenario.targetIndex) > 0
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
        <EvidenceTag>Live computation</EvidenceTag>
        <span>One typed engine drives the oracle, recurrence, tests, and every cell below.</span>
      </div>
      <div className="lab-heading">
        <div>
          <p className="eyebrow">Exact equivalence microscope</p>
          <h2 id="microscope-title">One computation. Two forms.</h2>
        </div>
        <div className="parity-certificate" aria-live="polite">
          <span>max numerical error</span><strong>{outputParity.toExponential(1)}</strong>
          <small>{outputParity < 1e-10 ? 'Parity pass' : 'Parity failed'}</small>
        </div>
      </div>

      <details className="formula-readout"><summary>Derive one row of the identity</summary><p>Expand the carried state Sₜ₋₁ = Σₛ&lt;ₜ rₛᵀvₛ. Then oₜ = rₜSₜ₋₁ = Σₛ&lt;ₜ (rₜ · rₛ)vₛ. This is exactly row t of the strictly lower-triangular score matrix times V. Each write is an outer product: its cell (i,j) changes by rₜ[i]vₜ[j]. Query-only tokens do not write.</p><p>Chunking splits the sum into prior-chunk state and within-chunk masked products. It changes scheduling, not the sum, when the carried state is exact.</p></details>
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
            <div><h3>Parallel causal oracle</h3><p>Materialize every permitted query-key score, then multiply by values.</p></div>
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
          <code className="panel-equation">oₜ = rₜSₜ₋₁ ; Sₜ = Sₜ₋₁ + rₜᵀvₜ</code>
        </article>
      </div>

      <div className="step-console">
        <div className="step-console__control">
          <label htmlFor="token-step"><span>Inspect causal step</span><strong>{safeStep + 1}/{scenario.tokens.length} ; {selectedToken.label}</strong></label>
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

      <div className="formula-readout" aria-live="polite"><code>margin(U = I) = 1 - m c = 1 - {distractorMultiplicity(itemCount)} × {overlap.toFixed(2)} = {fixtureMargin(overlap, itemCount).toFixed(6)}</code><p>Computed margin {margin.toFixed(6)}. RoPE correction {(margin - fixtureMargin(overlap, itemCount)).toExponential(3)}. This formula is exact only for this one-hot-value fixture with U = I; ties are not strict recall.</p><label>RoPE base <select aria-label="RoPE base" value={ropeBase} onChange={e => setRopeBase(Number(e.target.value))}><option value={65536}>2^16 (official)</option><option value={10000}>10^4</option></select></label><p>The target is in the slowest-rotating pair. Parity does not depend on the base. <Citation id="code" locator="get_freqs, theta=2**16; Attention.forward" /></p><a href={window.location.href}>Permalink to this state</a></div>
      <div className="control-deck control-deck--microscope">
        <div className="control-intro">
          <p className="eyebrow">Change the substrate</p><h3>Make the fixed state collide.</h3>
          <p>RoPE stays on. Keys, write load and base are learner-controlled.</p>
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
  const [load, setLoad] = useUrlNumber('sweepLoad', 6, 1, 7)
  const prediction = predictedBoundary(load)
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
          <EvidenceTag>Live computation</EvidenceTag>
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
            <desc id="plot-desc">{sweep.map(p => `${(p.overlap * 100).toFixed(1)} percent: margin ${p.margin.toFixed(4)}`).join('; ')}. Nonpositive margin is not strict recall.</desc>
            <line className="plot-zero" x1={padding.left} x2={width - padding.right} y1={y(0)} y2={y(0)} />
            {prediction !== null && <><line stroke="var(--ink)" strokeDasharray="5 5" x1={x(prediction)} x2={x(prediction)} y1={padding.top} y2={height - padding.bottom} /><text x={x(prediction) + 5} y={34}>Predicted {(prediction * 100).toFixed(1)}%</text></>}
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
          <span>Prediction beside measurement</span>
          <strong>Predicted {prediction === null ? 'outside slider' : `${(prediction * 100).toFixed(1)}%`}, first sampled failure {boundary ? `${Math.round(boundary.overlap * 100)}%` : 'not reached'}</strong>
          <p>At load {load}, the amber score first stops exceeding both competitors at this sampled point. It is a mechanism probe, not a trained-model benchmark.</p>
        </div>
      </div>
    </section>
  )
}

function PlasticityLab() {
  const [beta, setBeta] = useUrlNumber('beta', 1, 0, 1)
  const [orthogonalValue, setOrthogonalValue] = useUrlNumber('orthogonal', 0, 0, 1)
  const orthogonal = orthogonalValue === 1
  const comparison = useMemo(() => comparePlasticityRules(beta, orthogonal), [beta, orthogonal])
  const conflict = useMemo(() => identicalKeyConflict(), [])
  const rowLabels = Array.from({ length: KEY_DIMENSION }, (_, i) => `k${i + 1}`)
  return <section className="plasticity-section" id="plasticity" aria-labelledby="plasticity-title">
    <div className="section-heading section-heading--split"><div><EvidenceTag>Live computation</EvidenceTag><p className="eyebrow">Plasticity, isolated</p><h2 id="plasticity-title">Can the state revise, not merely accumulate?</h2></div><p>With U = I, change the write rule, not the state shape. These comparison rules are not BDH's public additive update. <Citation id="delta" locator="Section 2.2, delta recurrence" /></p></div>
    <div className="formula-readout"><label htmlFor="beta-control">Correction strength β: {beta.toFixed(2)}</label><input id="beta-control" type="range" min="0" max="1" step="0.05" value={beta} onChange={e => setBeta(Number(e.target.value))} /><div className="prediction-buttons"><button aria-pressed={!orthogonal} onClick={() => setOrthogonalValue(0)}>Same key</button><button aria-pressed={orthogonal} onClick={() => setOrthogonalValue(1)}>Orthogonal key</button></div><code>{orthogonal ? `read B = β violet = ${beta.toFixed(3)} violet` : `read A = β(1 - β) amber + β violet = ${(beta * (1 - beta)).toFixed(3)} amber + ${beta.toFixed(3)} violet`}</code><p>Unit keys, two writes, zero initial state. Orthogonal keys make the delta write a β-scaled additive write.</p></div>
    <div className="plasticity-grid">{(['additive', 'delta'] as const).map(rule => <article className={`rule-card rule-card--${rule}`} key={rule}><div className="rule-card__heading"><h3>{rule === 'additive' ? 'Additive Hebbian write' : 'Normalized delta write'}</h3><EvidenceTag>Live computation</EvidenceTag></div><code>{rule === 'additive' ? 'S ← S + kᵀv' : 'S ← S + βkᵀ(v - kS)/‖k‖²'}</code><MatrixHeatmap matrix={comparison[rule].state} title="S" rowLabels={rowLabels} columnLabels={VALUE_LABELS} compact /><OutputBars output={comparison[rule].output} targetIndex={1} /><div className="rule-verdict"><span>Computed read {orthogonal ? 'B' : 'A'}</span><strong>[{comparison[rule].output.map(v => v.toFixed(3)).join(', ')}]</strong><small>MSE to violet {comparison[rule].error.toFixed(6)}</small></div></article>)}</div>
    <p>The masked-matrix identity above covers additive writes. Delta variants have different exact parallel forms, not that same masked matrix. <Citation id="delta" locator="Section 3, compact WY" /> <a href="/lab/#writes">Compare write rules in the lab</a>.</p>
    <aside className="negative-control"><div><EvidenceTag tone="formal">Formal identity</EvidenceTag><h3>One identical address cannot answer two incompatible questions.</h3></div><p>The optimal common read is [{conflict.optimalRead.join(', ')}], with MSE {conflict.optimalErrors[0].toFixed(6)} to each one-hot target. The β = 1 delta read has MSE {conflict.errors[0].toFixed(6)} to amber and {conflict.errors[1].toFixed(6)} to violet. It chooses a correction, not missing information.</p><div className="negative-control__math"><code>same k implies same kS</code><span>{conflict.simultaneouslySatisfiable ? 'satisfiable' : 'not simultaneously satisfiable'}</span></div></aside>
  </section>
}

function BdhBridge() {
  return <section className="bridge-section" id="bridge" aria-labelledby="bridge-title"><div className="section-heading section-heading--split"><div><EvidenceTag tone="paper">Paper-reported</EvidenceTag><p className="eyebrow">The bridge to BDH</p><h2 id="bridge-title">Small enough to inspect. Linked to the real architecture.</h2></div><p>The microscope isolates attention products. It excludes LayerNorm, learned encoders, training and the full BDH block.</p></div>
    <div className="bridge-grid">
      <article className="paper-equation"><h3>Two frames, one attention product</h3><code>ρₜ = (ρₜ₋₁ + vₜxₜᵀ)U</code><p>Paper Eq. 8 uses D × N. Our S has neurons as rows and value channels as columns, and rotates keys by absolute position. The frame relation is Sᵀ = ρ U^(-T). <Citation id="bdh" locator="Eq. 8" /></p><p><EvidenceTag tone="formal">Precomputed replay</EvidenceTag> The CPU conformance replay against pinned official attention passed: maximum attention error 2.66e-15; frame error 2.40e-14.</p><a href="https://github.com/drcocktail/bdh-state-microscope/blob/final-push/research/README.md">Conformance script and scope</a></article>
      <article className="mapping-card"><h3>Why the neuron space is large</h3><p>Before RoPE, public keys and queries are the same sparse non-negative ReLU vector. The default configuration gives 8,192 neurons per head, 256 value channels and 4 heads: 8,388,608 state scalars per layer, independent of T. Here: 24. <Citation id="code" locator="BDHConfig and BDH.forward" /></p><p>Claim 7 gives order-n distinguishable facts with weak-correlation assumptions, order-√n without. Preparation and nonadversarial conditions matter. <Citation id="bdh" locator="Section 6.1, Claim 7; Appendix C.2, Claim 8" /></p><a href="/lab/#lift">Test a random lift, not a learned BDH encoder</a></article>
      <article className="mapping-card"><h3>U changes the treatment of time</h3><p>Rotation blocks supply RoPE; diagonal damping supplies ALiBi-like decay. The paper describes damping stale context and possible selective forgetting. The public code implements RoPE only. <Citation id="bdh" locator="Definition 4; section 6.1, natural support for long context" /><Citation id="explainer" locator="Chapter 2, Step 6" /><Citation id="code" locator="Attention.forward" /></p><a href="/lab/#time">Measure the recency trade-off</a></article>
      <article className="mapping-card"><h3>BDH-CQ is not this toy</h3><p>The report writes Sₜ = Uθ(Sₜ₋₁, Dₜ), avoiding a growing explicit KV cache, and names additive linear attention as a special case. Exact update and dimensions are proprietary. <Citation id="cq" locator="Sections 3.2 and 3.3" /></p><p>Its color-binding probe reports 96 correct outputs, 24/24 at each tested binding level. That does not reveal state capacity. <Citation id="cq" locator="Section 6.3" /></p><a href="/blog/">Explore what interface tests can establish</a></article>
    </div><aside className="negative-control"><h3>This is not a trained checkpoint.</h3><p>A full-model improvement would require matched training, held-out benchmarks and ablations. No training or benchmark win is claimed.</p></aside>
    <p className="why-now">Why now: Qwen3-Next and Qwen3.5 use a 3:1 Gated DeltaNet to gated-attention layout; Qwen3.5 reports 397B total parameters. Kimi Linear mixes channel-gated KDA with MLA at 3:1. <Citation id="qwen-next" /><Citation id="qwen35" /><Citation id="kimi" locator="Section 3.1 and Table 1" /> This probe illustrates interference, not a causal diagnosis of those models.</p>
  </section>
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
    <section className="challenge-section" id="chunk-check" aria-labelledby="challenge-title">
      <div className="challenge-copy">
        <EvidenceTag tone="formal">Formal identity</EvidenceTag>
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

function TeachBack() {
  const [answer, setAnswer] = useState('')
  const [compared, setCompared] = useState(false)
  const normalized = answer.toLowerCase()
  const hasAttempt = answer.trim().length > 0
  const criteria = [
    {
      label: 'Exact computation',
      met: /exact|equiv|identical|parity|same (answer|output|computation|result)/.test(normalized),
      guidance: 'Say that the full, recurrent, and chunked routes compute the same causal result.',
    },
    {
      label: 'Fixed-state mechanism',
      met: /state|matrix|recurrent|chunk|parallel|fixed|compress|history/.test(normalized),
      guidance: 'Name the carried fixed-shape state that folds the growing attention history.',
    },
    {
      label: 'Memory failure boundary',
      met: /overlap|collision|interference|memory|address|wrong|fail|recall|lost|confus|quality/.test(normalized),
      guidance: 'Explain that overlapping addresses can make every exact route return the same wrong recall.',
    },
  ]
  const captured = criteria.filter((criterion) => criterion.met).length
  const feedbackTitle = captured === 3
    ? 'Mechanism captured.'
    : captured === 2
      ? 'Almost there, one boundary is missing.'
      : captured === 1
        ? 'You have one piece. Connect the computation to the failure.'
        : 'Start with the invariant, then name the failure.'
  return (
    <section className="teachback" aria-labelledby="teachback-title">
      <div><p className="eyebrow">Teach it back</p><h2 id="teachback-title">What is exact, and what can still fail?</h2><p>Explain the distinction in your own words. A strong answer separates computational equivalence from memory quality.</p></div>
      <div className="teachback__input">
        <label htmlFor="teachback-answer">Your explanation</label>
        <textarea
          id="teachback-answer"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setCompared(false) }}
          placeholder="The full attention matrix and recurrent state…"
          rows={4}
        />
        <button
          type="button"
          disabled={!hasAttempt}
          aria-describedby="teachback-hint"
          onClick={() => setCompared(true)}
        >
          Compare with the mechanism
        </button>
        <small id="teachback-hint" className="teachback__hint">Any honest attempt works, even one sentence. Feedback is a keyword-based concept check, not semantic grading.</small>
        {compared && (
          <div className="teachback__feedback" aria-live="polite">
            <div className="teachback__score">
              <strong>{feedbackTitle}</strong>
              <span>{captured}/3 concepts captured</span>
            </div>
            <ul>
              {criteria.map((criterion) => (
                <li className={criterion.met ? 'is-captured' : 'is-missing'} key={criterion.label}>
                  <span>{criterion.met ? 'Captured' : 'Missing'}</span>
                  <strong>{criterion.label}</strong>
                  <p>{criterion.guidance}</p>
                </li>
              ))}
            </ul>
            {captured < 3 && (
              <p className="teachback__scaffold">
                <strong>Try this scaffold:</strong> “The full, recurrent, and chunked forms are exactly equivalent because… Yet recall can still fail when…”
              </p>
            )}
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
        <article><EvidenceTag tone="formal">Formal identity</EvidenceTag><h3>Parallel, recurrent, and chunk forms</h3><p>Displayed algebra; checked across deterministic fixtures to tolerance 1e−10.</p></article>
        <article><EvidenceTag>Live computation</EvidenceTag><h3>Collision and rewrite probes</h3><p>Computed in this repository from typed scenarios. No downloaded result table.</p></article>
        <article><EvidenceTag tone="paper">Paper-reported</EvidenceTag><h3>BDH mechanism context</h3><p>Equation and implementation mapping are attributed to the paper and official code.</p></article>
        <article><EvidenceTag tone="limit">Hypothesis</EvidenceTag><h3>Full-model improvement</h3><p>Delta-style plasticity is a candidate intervention, not a claimed BDH benchmark win.</p></article>
      </div>
      <div className="source-row"><a href="/blog/">Read the separate observability essay</a><a href="/dataforge-latent-reasoning-blog.pdf">Submitted blog v1 PDF</a>
        <SourceLink href={SOURCES.bdh}>BDH paper</SourceLink>
        <SourceLink href={SOURCES.implementation}>BDH code</SourceLink>
        <SourceLink href={SOURCES.parallelDeltaNet}>DeltaNet 2024</SourceLink>
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
        <a className="brand" href="#top" aria-label="BDH State Microscope home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>State microscope</a>
        <nav aria-label="Primary navigation"><a href="#microscope">Microscope</a><a href="#boundary">Boundary</a><a href="#plasticity">Plasticity</a><a href="/lab/">Lab</a><a href="/blog/">Blog</a><a href="#evidence">Evidence</a></nav>
        <span className="header-note">Executable BDH mechanism</span>
      </header>
      <main id="main">
        <section className="hero" id="top">
          <div>
            <p className="eyebrow">BDH state microscope, formal identity and controlled probes</p>
            <h1>Fold the attention matrix.</h1>
            <p className="hero__lede">A fixed N × D state reproduces strictly causal linear attention exactly. In this fixture, strict recall fails when the target's overlap stops exceeding the summed overlap for every wrong value.</p>
            <div className="hero__audience"><span>One falsifiable claim</span><strong>Exact computation does not guarantee correct recall.</strong></div>
          </div>
          <aside className="claim-card">
            <span className="claim-card__label">the scope</span>
            <blockquote>For this fixture with U = I, the boundary is <code>c* = 1/m</code>, where m counts distractors carrying the most common wrong value. RoPE's correction is displayed, not hidden.</blockquote>
            <a href="#microscope"><span>Open the state</span></a>
          </aside>
        </section>
        <section className="audience-strip"><p><strong>For</strong> ML engineers and students who know dot products, matrix products and causal masking. BDH, RoPE and fast weights are not prerequisites.</p><p><strong>You will learn to</strong> derive the recurrence, predict the fixture's failure boundary, explain the large neuron space and distinguish revision from missing information.</p></section>
        <StateMicroscope />
        <BoundaryPlot />
        <PlasticityLab />
        <BdhBridge />
        <OneMinuteCheck />
        <JudgeChallenge />
        <TeachBack />
        <EvidenceLedger /><section className="lab-invitation"><h2>Take the microscope further.</h2><p>Test dimensions, random lifts, time and write rules with reproducible controls.</p><a href="/lab/">Open the lab</a><a href="/blog/">Read the separate observability essay</a></section><References />
      </main>
      <ArtifactFooter />
    </>
  )
}
