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
        <span>Both views below are calculated from the same sequence. Change a key and watch them update.</span>
      </div>
      <div className="lab-heading">
        <div>
          <p className="eyebrow">Reading the memory</p>
          <h2 id="microscope-title">Two ways to get the same answer</h2>
        </div>
        <div className="parity-certificate" aria-live="polite">
          <span>max numerical error</span><strong>{outputParity.toExponential(1)}</strong>
          <small>{outputParity < 1e-10 ? 'Parity pass' : 'Parity failed'}</small>
        </div>
      </div>

      <p className="reading-intro">We store a key for A together with the value amber. Later keys store violet or mint. To retrieve A, we compare its key with every stored key and add up the matching values. Similar keys contribute to the answer too.</p>
      <p className="reading-intro">The left view keeps those comparisons separate. The right view adds each key-value pair to one memory matrix as it arrives. Multiplying the query by that matrix gives the same weighted sum. This is linear attention, without softmax normalization.</p>
      <details className="formula-readout"><summary>Why the two calculations agree</summary><p>Let rₛ be the key at step s, after its positional rotation, and vₛ its value. A write adds the outer product rₛᵀvₛ to memory: cell (i, j) increases by rₛ[i] × vₛ[j]. Just before step t, the matrix contains all earlier writes.</p><code>Sₜ₋₁ = Σₛ&lt;ₜ rₛᵀvₛ</code><p>Reading with the current key rₜ distributes over that sum. Each earlier value gets a weight equal to the dot product of its key with the query.</p><code>oₜ = rₜSₜ₋₁ = Σₛ&lt;ₜ (rₜ · rₛ)vₛ</code><p>The left panel computes these weights first, then multiplies by the values. The right panel combines the writes first, then reads. Only earlier steps contribute; the query itself adds nothing to memory. Chunking groups the same terms into batches and carries the accumulated matrix between them.</p></details>
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
            <div><h3>Compare with every earlier key</h3><p>Each row shows how strongly one query matches the keys before it.</p></div>
          </div>
          <CausalMatrix scores={parallel.scores} labels={labels} selected={safeStep} />
          <code className="panel-equation">O = tril(QKᵀ, −1)V</code>
        </article>
        <div className="equivalence-bridge" aria-hidden="true"><span>=</span><small>same output</small></div>
        <article className="computation-panel computation-panel--state">
          <div className="panel-heading">
            <span className="step-index">B</span>
            <div><h3>Read one memory matrix</h3><p>Each stored pair changes this 8 × 3 matrix. Its shape stays the same.</p></div>
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

      <details className="formula-readout"><summary>Predict when amber loses</summary><p>Without positional rotation, A contributes an amber score of 1. Each other key contributes c to its stored color, where c is its overlap with A. The strongest competing color appears m times, so its score is m × c. Amber wins while 1 is greater than m × c; a tie does not count as a successful recall.</p><code>margin = 1 - m c = 1 - {distractorMultiplicity(itemCount)} × {overlap.toFixed(2)} = {fixtureMargin(overlap, itemCount).toFixed(6)}</code><p aria-live="polite">With rotation on, the actual margin is {margin.toFixed(6)}. The difference from the unrotated prediction is {(margin - fixtureMargin(overlap, itemCount)).toExponential(3)}. The formula describes these constructed keys and three color values, not arbitrary memories.</p></details>
      <div className="rotation-controls"><label>RoPE base <select aria-label="RoPE base" value={ropeBase} onChange={e => setRopeBase(Number(e.target.value))}><option value={65536}>2^16 (official)</option><option value={10000}>10^4</option></select></label><p>RoPE rotates keys according to their position in the sequence. Here A uses the slowest-rotating coordinate pair, so the change is small. Both calculations use the same rotation. <Citation id="code" locator="get_freqs, theta=2**16; Attention.forward" /></p><a href={window.location.href}>Permalink to this state</a></div>
      <div className="control-deck control-deck--microscope">
        <div className="control-intro">
          <p className="eyebrow">Try it</p><h3>Make the keys more alike</h3>
          <p>Raise the overlap, or store more pairs. Watch amber compete with the other colors.</p>
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
          <p className="eyebrow">Interference</p>
          <h2 id="boundary-title">When does amber stop winning?</h2>
        </div>
        <p>Similar keys write to overlapping parts of memory. Their contributions add up when we query A. This plot increases that similarity while keeping the number of stored pairs fixed. The two methods still agree, even after they start returning the wrong color.</p>
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
          <p>With {load} stored pairs, this is the first sampled overlap where amber no longer beats both other colors. The plot evaluates our constructed sequence with RoPE on.</p>
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
    <div className="section-heading section-heading--split"><div><p className="eyebrow">Updating a fact</p><h2 id="plasticity-title">What if A changes from amber to violet?</h2></div><p>Adding the new pair leaves both colors in memory. A delta write instead reads the old prediction and corrects its error. Compare the two rules below, with positional rotation switched off. Delta writing comes from DeltaNet, not the public BDH update. <Citation id="delta" locator="Section 2.2, delta recurrence" /></p></div>
    <div className="formula-readout"><label htmlFor="beta-control">Correction strength β: {beta.toFixed(2)}</label><input id="beta-control" type="range" min="0" max="1" step="0.05" value={beta} onChange={e => setBeta(Number(e.target.value))} /><p>β controls how much of the prediction error the delta rule corrects. At 1, it replaces the old answer for this key. At 0, it writes nothing. Try giving the second pair a completely separate key instead.</p><div className="prediction-buttons"><button aria-pressed={!orthogonal} onClick={() => setOrthogonalValue(0)}>Same key</button><button aria-pressed={orthogonal} onClick={() => setOrthogonalValue(1)}>Orthogonal key</button></div><code>{orthogonal ? `read B = β violet = ${beta.toFixed(3)} violet` : `read A = β(1 - β) amber + β violet = ${(beta * (1 - beta)).toFixed(3)} amber + ${beta.toFixed(3)} violet`}</code><p>These expressions follow from two unit-length keys written into initially empty memory. With orthogonal keys, the second write has no old prediction to correct.</p></div>
    <div className="plasticity-grid">{(['additive', 'delta'] as const).map(rule => <article className={`rule-card rule-card--${rule}`} key={rule}><div className="rule-card__heading"><h3>{rule === 'additive' ? 'Add the new pair' : 'Correct the old prediction'}</h3></div><code>{rule === 'additive' ? 'S ← S + kᵀv' : 'S ← S + βkᵀ(v - kS)/‖k‖²'}</code><MatrixHeatmap matrix={comparison[rule].state} title="S" rowLabels={rowLabels} columnLabels={VALUE_LABELS} compact /><OutputBars output={comparison[rule].output} targetIndex={1} /><div className="rule-verdict"><span>Read {orthogonal ? 'B' : 'A'} after both writes</span><strong>[{comparison[rule].output.map(v => v.toFixed(3)).join(', ')}]</strong><small>Mean squared error against violet: {comparison[rule].error.toFixed(6)}</small></div></article>)}</div>
    <p>The earlier matrix calculation applies to additive writes. Delta rules can also run in parallel, but need a different rearrangement because each correction depends on what memory already predicts. <Citation id="delta" locator="Section 3, compact WY" /> <a href="/lab/#writes">Try the other write rules</a>.</p>
    <aside className="negative-control"><div><h3>A correction needs to know which fact changed</h3></div><div><p>Suppose two different facts have exactly the same key, but one should return amber and the other violet. The read is kS in both cases. No write rule can make that one read return two different answers.</p><details><summary>Compare the errors</summary><p>The best compromise is [{conflict.optimalRead.join(', ')}], with mean squared error {conflict.optimalErrors[0].toFixed(6)} against each color. Full-strength delta correction chooses violet: its errors are {conflict.errors[0].toFixed(6)} against amber and {conflict.errors[1].toFixed(6)} against violet. We need distinguishable keys to preserve both facts.</p></details></div><div className="negative-control__math"><code>same k implies same kS</code><span>{conflict.simultaneouslySatisfiable ? 'Both answers are possible' : 'One read, two different targets'}</span></div></aside>
  </section>
}

function BdhBridge() {
  return <section className="bridge-section" id="bridge" aria-labelledby="bridge-title"><div className="section-heading section-heading--split"><div><p className="eyebrow">Dragon Hatchling</p><h2 id="bridge-title">How BDH builds on this memory</h2></div><p>BDH starts from attention and gives its memory a network interpretation: activity on neurons writes to connections between them. Our small matrix lets us inspect the attention calculation; BDH adds learned transformations, normalization and layers around it. <Citation id="explainer" locator="Chapter 2, Steps 3 to 6 and Part 2.2" /></p></div>
    <div className="bridge-grid">
      <article className="paper-equation"><h3>Remembering connections</h3><p>When a key and value are active together, their outer product strengthens the corresponding entries in memory. In BDH's graph view, these entries are synaptic connections. The GPU formulation stores a compressed, rectangular version of that state. <Citation id="bdh" locator="Eq. 8" /><Citation id="explainer" locator="Chapter 2, Steps 4 and 5; Part 2.2" /></p><details><summary>Match our matrix to the paper</summary><code>ρₜ = (ρₜ₋₁ + vₜxₜᵀ)U</code><p>Equation 8 stores a D × N matrix and advances its positional frame with U. We store neurons along rows and rotate keys by absolute position instead. At sequence length T, the frames are related by Sᵀ = ρ U^(-T).</p><p>Our recorded CPU float64 replay against the pinned official attention implementation found a maximum attention error of 2.66e-15 and frame error of 2.40e-14. This checks attention products, not the full trained block.</p><a href="https://github.com/drcocktail/bdh-state-microscope/blob/final-push/research/README.md">Replay code and assumptions</a></details></article>
      <article className="mapping-card"><h3>Giving keys more room</h3><p>Our eight-coordinate keys collide easily. Public BDH uses a much larger space: 8,192 neurons per head in the default configuration. Before positional rotation, keys and queries are sparse, non-negative activations produced by ReLU. <Citation id="code" locator="BDHConfig and BDH.forward" /></p><p>The paper analyzes how weakly correlated activity patterns can store more distinguishable facts. That advantage depends on the patterns and preparation; increasing the number of neurons alone is not a guarantee. <Citation id="bdh" locator="Section 6.1, Claim 7; Appendix C.2, Claim 8" /></p><a href="/lab/#lift">Try a larger sparse code</a></article>
      <article className="mapping-card"><h3>Keeping track of time</h3><p>Positional rotation changes how a new query matches older keys. The paper also describes damping, which weakens older writes. The public implementation uses rotation, but not damping. The lab lets you compare the two and see what happens to an old fact you still need. <Citation id="bdh" locator="Definition 4; section 6.1, natural support for long context" /><Citation id="code" locator="Attention.forward" /></p><a href="/lab/#time">Try rotation and decay</a></article>
      <article className="mapping-card"><h3>Reasoning without writing every step</h3><p>BDH-CQ separates memory of the examples from a workspace that repeatedly computes before decoding an answer. Its exact update rule and dimensions are proprietary, so the public report does not let us inspect those states directly. <Citation id="cq" locator="Sections 3.2 and 3.3" /></p><p>We can still test how answers respond to a new example or more computation. The blog explores what that tells us, and what remains hidden.</p><a href="/blog/">Read the essay and try the experiment</a></article>
    </div><p className="why-now">DeltaNet takes another approach to interference: correcting what memory predicts. Qwen3-Next and Qwen3.5 mix Gated DeltaNet layers with gated attention; Kimi Linear mixes channel-wise delta writing with MLA attention. <Citation id="qwen-next" /><Citation id="qwen35" /><Citation id="kimi" locator="Section 3.1 and Table 1" /> The lab compares these write ideas on small examples. Testing a change inside trained BDH would require a separate, matched training experiment.</p>
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
        <h2 id="challenge-title">Does batching change the answer?</h2>
        <p>Take seven writes and a final query. Process them in batches of <code>[2, 3, 3]</code>, carrying memory from one batch to the next. Will the outputs change? Make a prediction, then check it.</p>
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
            <p>Each batch starts with the memory left by the previous one. Every write is still included once, so the sums agree up to rounding. If similar keys caused a wrong answer before, batching gives the same wrong answer.</p>
          </div>
        )}
      </div>
    </section>
  )
}

const TEACHBACK_CONCEPTS = [
  { id: 'same-answer', label: 'The same answer', pattern: /exact|equiv|identical|parity|same (answer|output|computation|result)/, guidance: 'The full matrix, the recurrent state and the chunked run all add the same contributions.' },
  { id: 'what-memory-stores', label: 'What memory stores', pattern: /state|matrix|recurrent|chunk|parallel|fixed|compress|history/, guidance: 'Each key-value pair is added into a matrix whose shape stays fixed.' },
  { id: 'why-recall-fails', label: 'Why recall can fail', pattern: /overlap|collision|interference|memory|address|wrong|fail|recall|lost|confus|quality/, guidance: 'Similar keys also contribute when we ask for A, and their colors can outweigh amber.' },
] as const

type Concept = { id: string; label: string; met: boolean; quote: string; note: string }
type Probe = { overlap: number; load: number; claim: string }
type Review = { concepts: Concept[]; captured: number; followUp: string; probe: Probe; mode: 'model' | 'fallback' | 'offline'; model: string }

/** Runs when the tutor route is unreachable, so the section still works with no network. */
function offlineReview(explanation: string, overlapPercent: number, itemCount: number): Review {
  const normalized = explanation.toLowerCase()
  const concepts = TEACHBACK_CONCEPTS.map((concept) => ({ id: concept.id, label: concept.label, met: concept.pattern.test(normalized), quote: '', note: concept.guidance }))
  const captured = concepts.filter((concept) => concept.met).length
  const overlap = Math.min(95, Math.max(0, Math.round((overlapPercent + 20) / 5) * 5))
  return {
    concepts,
    captured,
    followUp: 'Which part of the memory is shared between the keys, and why does that change the answer we read back?',
    probe: { overlap, load: itemCount, claim: `At ${overlap}% overlap with ${itemCount} writes, amber still wins.` },
    mode: 'offline',
    model: 'Offline rubric (tutor unreachable)',
  }
}

/** The tutor proposes a configuration; this runs it through the same engine as the rest of the page. */
function ProbeResult({ probe }: { probe: Probe }) {
  const [run, setRun] = useState(false)
  const scenario = useMemo(() => buildAssociationScenario({ overlap: probe.overlap / 100, itemCount: probe.load }), [probe.overlap, probe.load])
  const output = useMemo(() => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' }).outputs[scenario.queryIndex], [scenario])
  const margin = targetMargin(output, scenario.targetIndex)
  return (
    <div className="teachback__probe">
      <p className="eyebrow">Test the claim</p>
      <p><strong>{probe.claim}</strong></p>
      <button type="button" onClick={() => setRun(true)} disabled={run}>Run {probe.load} writes at {probe.overlap}% overlap</button>
      {run && (
        <div className={`teachback__probe-result ${margin > 0 ? 'is-correct' : 'is-incorrect'}`} aria-live="polite">
          <strong>{margin > 0 ? 'Amber still wins.' : 'Amber loses.'}</strong>
          <span>Target margin {margin.toFixed(3)}, computed in your browser by the same engine as the microscope above.</span>
        </div>
      )}
    </div>
  )
}

function TeachBack() {
  const [answer, setAnswer] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const overlapPercent = 70
  const itemCount = 5
  const scenario = useMemo(() => buildAssociationScenario({ overlap: overlapPercent / 100, itemCount }), [])
  const output = useMemo(() => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' }).outputs[scenario.queryIndex], [scenario])
  const margin = targetMargin(output, scenario.targetIndex)
  const hasAttempt = answer.trim().length > 0

  const compare = async () => {
    // Too short for the tutor's minimum: teach from the attempt anyway, with no round trip.
    if (answer.trim().length < 12) { setReview(offlineReview(answer, overlapPercent, itemCount)); return }
    setStatus('loading')
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'teachback',
          explanation: answer.trim().slice(0, 1200),
          trace: { overlap: overlapPercent, load: itemCount, scores: output.map((value) => Number(value.toFixed(3))), margin: Number(margin.toFixed(3)) },
        }),
      })
      const payload = await response.json() as Partial<Review> & { error?: string }
      if (!response.ok || !payload.concepts) throw new Error(payload.error ?? 'The tutor returned nothing usable.')
      setReview(payload as Review)
    } catch {
      setReview(offlineReview(answer, overlapPercent, itemCount))
    }
    setStatus('idle')
  }

  const captured = review?.captured ?? 0
  const feedbackTitle = captured === 3
    ? 'You connected all three parts.'
    : captured === 2
      ? 'One more part to connect.'
      : captured === 1
        ? 'You have a starting point. What happens when the keys overlap?'
        : 'Try explaining what both methods add up.'
  return (
    <section className="teachback" aria-labelledby="teachback-title">
      <div><p className="eyebrow">Your explanation</p><h2 id="teachback-title">Why do both methods make the same mistake?</h2><p>Imagine explaining this to someone who has not seen the matrices. Why do the calculations agree, and why can they still return violet when we stored A as amber?</p></div>
      <div className="teachback__input">
        <label htmlFor="teachback-answer">Your explanation</label>
        <textarea
          id="teachback-answer"
          value={answer}
          onChange={(event) => { setAnswer(event.target.value); setReview(null) }}
          placeholder="Both methods add up the same values, so..."
          rows={4}
          maxLength={1200}
        />
        <button
          type="button"
          className="reveal-button"
          disabled={!hasAttempt || status === 'loading'}
          aria-describedby="teachback-hint"
          onClick={compare}
        >
          {status === 'loading' ? 'Reading your explanation...' : 'Compare with the mechanism'}
        </button>
        <small id="teachback-hint" className="teachback__hint">Write a sentence or two in your own words. A reader model checks which ideas you expressed, quotes them back, and proposes one test you can run here.</small>
        {review && (
          <div className="teachback__feedback" aria-live="polite">
            <div className="teachback__score">
              <strong>{feedbackTitle}</strong>
              <span>{captured}/3 concepts captured</span>
            </div>
            <ul>
              {review.concepts.map((concept) => (
                <li className={concept.met ? 'is-captured' : 'is-missing'} key={concept.id}>
                  <span>{concept.met ? 'Mentioned' : 'Check this'}</span>
                  <div>
                    <strong>{concept.label}</strong>
                    {concept.quote && <q>{concept.quote}</q>}
                    <p>{concept.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            {captured < 3 && (
              <p className="teachback__scaffold">
                <strong>A place to start:</strong> "Both methods add up the same values, weighted by... A wrong color can win when..."
              </p>
            )}
            <p className="teachback__followup"><strong>Next question:</strong> {review.followUp}</p>
            <ProbeResult probe={review.probe} />
            <p className="teachback__provenance">{review.mode === 'model' ? review.model : review.model}. The model reads your words and this trace; every number here is computed by the engine in your browser.</p>
          </div>
        )}
      </div>
    </section>
  )
}

const TRACE_LENSES = [
  { id: 'falsify', label: 'Try to falsify it', note: 'Ask for the next discriminating test.' },
  { id: 'connect', label: 'Connect to BDH-CQ', note: 'Separate analogy from evidence.' },
  { id: 'teach', label: 'Teach the distinction', note: 'Turn the trace into a check question.' },
] as const

type TraceLens = (typeof TRACE_LENSES)[number]['id']

function CommentaryPoints({ commentary }: { commentary: string }) {
  const points = commentary
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-•]\s*/, '').replaceAll('**', ''))
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(Observation|Inference|Next test|Check question)\s*[:\u2014-]?\s*(.*)$/i)
      return match ? { label: match[1], text: match[2] } : { label: 'Co-review', text: line }
    })
  return (
    <ol className="interlocutor-commentary" aria-live="polite">
      {points.map((point, index) => <li key={`${point.label}-${index}`}><strong>{point.label}</strong><span>{point.text}</span></li>)}
    </ol>
  )
}

function ResearchInterlocutor() {
  const [lens, setLens] = useState<TraceLens>('falsify')
  const [overlapPercent, setOverlapPercent] = useUrlNumber('askOverlap', 70, 0, 95)
  const [itemCount, setItemCount] = useUrlNumber('askLoad', 5, 1, 7)
  const [commentary, setCommentary] = useState('')
  const [modelName, setModelName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const overlap = Math.round(overlapPercent / 5) * 5
  const load = Math.round(itemCount)
  const scenario = useMemo(() => buildAssociationScenario({ overlap: overlap / 100, itemCount: load }), [overlap, load])
  const output = useMemo(() => runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' }).outputs[scenario.queryIndex], [scenario])
  const prediction = argMax(output)
  const margin = targetMargin(output, scenario.targetIndex)
  const invalidate = () => { setCommentary(''); setModelName(''); setStatus('idle') }

  const ask = async () => {
    setStatus('loading')
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'trace', lens, trace: { overlap, load, scores: output.map((value) => Number(value.toFixed(3))), margin: Number(margin.toFixed(3)) } }),
      })
      const payload = await response.json() as { commentary?: string; model?: string; error?: string }
      if (!response.ok || !payload.commentary) throw new Error(payload.error ?? 'No commentary returned.')
      setCommentary(payload.commentary)
      setModelName(payload.model ?? 'Co-review')
      setStatus('ready')
    } catch (error) {
      setCommentary(`The co-review endpoint is unavailable: ${error instanceof Error ? error.message : 'unknown error'}. The experiment above is unaffected; it runs entirely in your browser.`)
      setModelName('Endpoint unavailable')
      setStatus('ready')
    }
  }

  return (
    <section className="interlocutor-section" id="interrogate" aria-labelledby="interlocutor-title">
      <div className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">Ask about a live trace</p>
          <h2 id="interlocutor-title">What would a reviewer ask next?</h2>
        </div>
        <div className="interlocutor-intro">
          <p>Choose a configuration and ask a model to challenge it, connect it to BDH-CQ, or turn it into a check question. It receives only the numbers computed below, and its reply is interpretation, not measurement.</p>
          <a href="/blog/">Read the essay this connects to</a>
        </div>
      </div>
      <div className="interlocutor-grid">
        <article className="interlocutor-controls">
          <span className="interlocutor-label">1 · Choose the question</span>
          <div className="interlocutor-lenses" role="group" aria-label="Analysis lens">
            {TRACE_LENSES.map((option) => (
              <button type="button" aria-pressed={lens === option.id} onClick={() => { setLens(option.id); invalidate() }} key={option.id}>
                <strong>{option.label}</strong><small>{option.note}</small>
              </button>
            ))}
          </div>
          <label className="interlocutor-slider" htmlFor="ask-overlap">
            <span><strong>Shared key direction</strong><output>{overlap}%</output></span>
            <input id="ask-overlap" type="range" min="0" max="95" step="5" value={overlap} onChange={(event) => { setOverlapPercent(Number(event.target.value)); invalidate() }} />
          </label>
          <label className="interlocutor-slider" htmlFor="ask-load">
            <span><strong>Associations written</strong><output>{load}</output></span>
            <input id="ask-load" type="range" min="1" max="7" step="1" value={load} onChange={(event) => { setItemCount(Number(event.target.value)); invalidate() }} />
          </label>
        </article>
        <article className="interlocutor-observation">
          <span className="interlocutor-label">2 · Computed in your browser</span>
          <div className={`interlocutor-verdict ${prediction === scenario.targetIndex ? 'is-pass' : 'is-fail'}`}>
            <span>target A → amber</span>
            <strong>argmax → {VALUE_LABELS[prediction]}</strong>
            <small>target margin {margin > 0 ? '+' : ''}{margin.toFixed(3)}</small>
          </div>
          <OutputBars output={output} targetIndex={scenario.targetIndex} />
          <p>Computed locally with RoPE on. These numbers are the only evidence the model receives.</p>
        </article>
        <article className="interlocutor-response">
          <div className="interlocutor-response__heading">
            <span className="interlocutor-label">3 · The reply</span>
            <small>{modelName || 'Groq, GPT-OSS 120B'}</small>
          </div>
          {status === 'idle' && <p className="interlocutor-placeholder">The reply is bounded to three points and is never used to calculate or check the experiment.</p>}
          {status === 'loading' && <p className="interlocutor-placeholder" aria-live="polite">Reading the trace...</p>}
          {status === 'ready' && <CommentaryPoints commentary={commentary} />}
          <button type="button" onClick={ask} disabled={status === 'loading'}>
            {status === 'loading' ? 'Asking...' : status === 'ready' ? 'Ask again' : 'Ask about this result'}
          </button>
          <small className="interlocutor-boundary">Only bounded, re-checked trace summaries are sent. If the endpoint is unavailable, the page keeps working and says so.</small>
        </article>
      </div>
      <div className="interlocutor-sources">
        <span>Primary sources</span>
        <SourceLink href={SOURCES.bdhCq}>BDH-CQ</SourceLink>
        <SourceLink href={SOURCES.coconut}>Coconut</SourceLink>
        <SourceLink href={SOURCES.recurrentDepth}>Recurrent depth</SourceLink>
      </div>
    </section>
  )
}

function MethodsNotes() {
  return (
    <section className="evidence-section" id="evidence" aria-labelledby="evidence-title">
      <div className="section-heading section-heading--split">
        <div><h2 id="evidence-title">How to check the experiment</h2></div>
        <p>The calculations run in your browser. The source includes separate implementations, tests and a replay against official BDH attention.</p>
      </div>
      <details className="methods-notes"><summary>Methods, assumptions and source records</summary><p>Parallel attention computes the causal score matrix directly. The recurrent implementation accumulates key-value outer products; the chunked implementation combines earlier memory with each batch's local writes. Tests compare their outputs and states with a tolerance of 1e-10, including both positional bases and randomized sequences.</p><p>The color experiments use constructed keys and one-hot values. They explain how overlap affects this memory, rather than measuring a trained model. Delta writing is a comparison from the DeltaNet literature. Improving trained BDH with it would need matched training, held-out evaluation and ablations.</p><a href="https://github.com/drcocktail/bdh-state-microscope/blob/final-push/research/README.md">Official attention replay</a><a href="/blog/claims.json">Detailed source records</a></details>
      <div className="source-row"><a href="/blog/">Reasoning without a transcript</a>
        <SourceLink href={SOURCES.bdh}>BDH paper</SourceLink>
        <SourceLink href={SOURCES.implementation}>BDH code</SourceLink>
        <SourceLink href={SOURCES.parallelDeltaNet}>DeltaNet</SourceLink>
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
        <nav aria-label="Primary navigation"><a href="#microscope">Microscope</a><a href="#boundary">Interference</a><a href="#plasticity">Updates</a><a href="/lab/">Lab</a><a href="/blog/">Blog</a><a href="#evidence">Methods</a></nav>
        <span className="header-note">An interactive guide to memory</span>
      </header>
      <main id="main">
        <section className="hero" id="top">
          <div>
            <p className="eyebrow">BDH state microscope</p>
            <h1>What does attention remember?</h1>
            <p className="hero__lede">Linear attention can combine a whole sequence of key-value pairs into one fixed-size matrix. We can read that matrix exactly and still retrieve the wrong value. Let's see how.</p>
            <div className="hero__audience"><span>Start here</span><strong>Compare the two views, then make the keys more alike.</strong></div>
          </div>
          <aside className="claim-card">
            <span className="claim-card__label">A small memory experiment</span>
            <blockquote>Store A as amber. Add a few similar keys. Ask for A again. Why does the answer turn violet?</blockquote>
            <a href="#microscope"><span>Try the experiment</span></a>
          </aside>
        </section>
        <section className="audience-strip"><p>You will need dot products and matrix multiplication. We explain the memory update and positional rotation as we go; no prior knowledge of BDH is required.</p></section>
        <StateMicroscope />
        <BoundaryPlot />
        <PlasticityLab />
        <BdhBridge />
        <OneMinuteCheck />
        <JudgeChallenge />
        <ResearchInterlocutor />
        <TeachBack />
        <MethodsNotes /><section className="lab-invitation"><h2>What would you change in this memory?</h2><p>Try more dimensions, sparser codes, decay or a different write rule. Each lab experiment changes one part of the design.</p><a href="/lab/">Open the lab</a><a href="/blog/">Reasoning without a transcript</a></section><References />
      </main>
      <ArtifactFooter />
    </>
  )
}
