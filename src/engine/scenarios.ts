import {
  argMax,
  meanSquaredError,
  runParallel,
  runRecurrent,
  targetMargin,
  type AttentionToken,
  type Matrix,
  type Vector,
} from './microscope'

export const KEY_DIMENSION = 8
export const VALUE_DIMENSION = 3
export const VALUE_LABELS = ['amber', 'violet', 'mint'] as const
export type ValueLabel = (typeof VALUE_LABELS)[number]

export type AssociationControls = {
  overlap: number
  itemCount: number
}

export type AssociationScenario = {
  id: string
  title: string
  description: string
  controls: AssociationControls
  tokens: readonly AttentionToken[]
  queryIndex: number
  targetIndex: number
}

export type SweepPoint = {
  overlap: number
  margin: number
  predictionIndex: number
  passes: boolean
}

export type PlasticityComparison = {
  tokens: readonly AttentionToken[]
  additive: {
    output: Vector
    state: Matrix
    predictionIndex: number
    error: number
  }
  delta: {
    output: Vector
    state: Matrix
    predictionIndex: number
    error: number
  }
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

export const oneHot = (index: number): number[] =>
  Array.from({ length: VALUE_DIMENSION }, (_, valueIndex) => (valueIndex === index ? 1 : 0))

const zeroValue = (): number[] => Array<number>(VALUE_DIMENSION).fill(0)

export const buildAssociationScenario = ({
  overlap,
  itemCount,
}: AssociationControls): AssociationScenario => {
  const safeOverlap = clamp(overlap, 0, 0.97)
  const safeCount = Math.round(clamp(itemCount, 1, 7))
  const targetKey = Array<number>(KEY_DIMENSION).fill(0)
  // The slowest RoPE pair keeps the semantic probe legible while still
  // exercising the same positional transform as the full evaluator.
  targetKey[6] = 1

  const tokens: AttentionToken[] = [
    {
      id: 'A',
      label: 'A → amber',
      key: targetKey,
      value: oneHot(0),
      role: 'association',
    },
  ]

  for (let index = 1; index < safeCount; index += 1) {
    const key = Array<number>(KEY_DIMENSION).fill(0)
    key[6] = safeOverlap
    key[index - 1] = Math.sqrt(1 - safeOverlap ** 2)
    const valueIndex = index % 2 === 1 ? 1 : 2
    const id = String.fromCharCode(65 + index)
    tokens.push({
      id,
      label: `${id} → ${VALUE_LABELS[valueIndex]}`,
      key,
      value: oneHot(valueIndex),
      role: 'association',
    })
  }

  tokens.push({
    id: 'Q(A)',
    label: 'query A',
    key: targetKey,
    value: zeroValue(),
    role: 'query',
    expected: oneHot(0),
  })

  return {
    id: safeOverlap >= 0.72 ? 'collision' : 'clean',
    title: safeOverlap >= 0.72 ? 'Overlapping addresses' : 'Separated addresses',
    description:
      safeOverlap >= 0.72
        ? 'Distractor keys share the target direction; their values accumulate in the same read.'
        : 'The target direction remains distinct enough for the fixed state to recall amber.',
    controls: { overlap: safeOverlap, itemCount: safeCount },
    tokens,
    queryIndex: tokens.length - 1,
    targetIndex: 0,
  }
}

export const runOverlapSweep = (itemCount: number, steps = 20): SweepPoint[] =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const overlap = (0.95 * index) / steps
    const scenario = buildAssociationScenario({ overlap, itemCount })
    const result = runParallel(scenario.tokens, { rotation: 'rope' })
    const output = result.outputs[scenario.queryIndex]
    return {
      overlap,
      margin: targetMargin(output, scenario.targetIndex),
      predictionIndex: argMax(output),
      passes: argMax(output) === scenario.targetIndex,
    }
  })

export const buildRewriteScenario = (): readonly AttentionToken[] => {
  const key = [1, 0, 0, 0, 0, 0, 0, 0]
  return [
    {
      id: 'A₁',
      label: 'A → amber',
      key,
      value: oneHot(0),
      role: 'association',
    },
    {
      id: 'A₂',
      label: 'A → violet',
      key,
      value: oneHot(1),
      role: 'association',
    },
    {
      id: 'Q(A)',
      label: 'query A',
      key,
      value: zeroValue(),
      role: 'query',
      expected: oneHot(1),
    },
  ]
}

export const comparePlasticityRules = (): PlasticityComparison => {
  const tokens = buildRewriteScenario()
  const expected = oneHot(1)
  const additiveResult = runRecurrent(tokens, {
    rotation: 'identity',
    writeRule: 'additive',
  })
  const deltaResult = runRecurrent(tokens, {
    rotation: 'identity',
    writeRule: 'delta',
    beta: 1,
  })
  const queryIndex = tokens.length - 1
  const additiveOutput = additiveResult.outputs[queryIndex]
  const deltaOutput = deltaResult.outputs[queryIndex]

  return {
    tokens,
    additive: {
      output: additiveOutput,
      state: additiveResult.steps[queryIndex].stateBefore,
      predictionIndex: argMax(additiveOutput),
      error: meanSquaredError(additiveOutput, expected),
    },
    delta: {
      output: deltaOutput,
      state: deltaResult.steps[queryIndex].stateBefore,
      predictionIndex: argMax(deltaOutput),
      error: meanSquaredError(deltaOutput, expected),
    },
  }
}

export const identicalKeyConflict = () => {
  const comparison = comparePlasticityRules()
  const requested = [oneHot(0), oneHot(1)] as const
  return {
    key: comparison.tokens[0].key,
    output: comparison.delta.output,
    requested,
    errors: requested.map((expected) => meanSquaredError(comparison.delta.output, expected)),
    simultaneouslySatisfiable: false,
  }
}
