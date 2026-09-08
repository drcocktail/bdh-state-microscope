export const KEY_DIMENSION = 8
export const VALUE_DIMENSION = 3

export const VALUE_LABELS = ['amber', 'violet', 'mint'] as const
export type ValueLabel = (typeof VALUE_LABELS)[number]

export type Vector = number[]
export type Matrix = number[][]

export type ScenarioConfig = {
  overlap: number
  itemCount: number
  retention: number
}

export type MemoryItem = {
  id: string
  key: Vector
  value: Vector
  valueIndex: number
  isTarget: boolean
}

export type ScenarioResult = {
  config: ScenarioConfig
  items: MemoryItem[]
  state: Matrix
  snapshots: Matrix[]
  scores: Vector
  proportions: Vector
  predictionIndex: number
  targetIndex: number
  passes: boolean
  targetScore: number
  competitorScore: number
  squaredError: number
  memoryScalars: number
  kvScalars: number
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

export const zeroMatrix = (rows: number, columns: number): Matrix =>
  Array.from({ length: rows }, () => Array(columns).fill(0) as number[])

export const dot = (a: Vector, b: Vector): number => {
  if (a.length !== b.length) throw new Error('dot: dimensions must match')
  return a.reduce((total, value, index) => total + value * b[index], 0)
}

export const outer = (value: Vector, key: Vector): Matrix =>
  value.map((valueEntry) => key.map((keyEntry) => valueEntry * keyEntry))

export const addMatrices = (a: Matrix, b: Matrix): Matrix => {
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) {
    throw new Error('addMatrices: dimensions must match')
  }
  return a.map((row, rowIndex) =>
    row.map((entry, columnIndex) => entry + b[rowIndex][columnIndex]),
  )
}

export const scaleMatrix = (matrix: Matrix, scale: number): Matrix =>
  matrix.map((row) => row.map((entry) => entry * scale))

export const matrixVector = (matrix: Matrix, vector: Vector): Vector => {
  if (matrix.some((row) => row.length !== vector.length)) {
    throw new Error('matrixVector: dimensions must match')
  }
  return matrix.map((row) => dot(row, vector))
}

export const oneHot = (index: number, dimension = VALUE_DIMENSION): Vector =>
  Array.from({ length: dimension }, (_, itemIndex) => (itemIndex === index ? 1 : 0))

export const makeScenarioItems = ({
  overlap,
  itemCount,
}: Pick<ScenarioConfig, 'overlap' | 'itemCount'>): MemoryItem[] => {
  const safeOverlap = clamp(overlap, 0, 0.96)
  const safeCount = Math.round(clamp(itemCount, 1, KEY_DIMENSION))
  const targetKey = Array(KEY_DIMENSION).fill(0) as Vector
  targetKey[0] = 1

  const items: MemoryItem[] = [
    {
      id: 'A',
      key: targetKey,
      value: oneHot(0),
      valueIndex: 0,
      isTarget: true,
    },
  ]

  for (let index = 1; index < safeCount; index += 1) {
    const key = Array(KEY_DIMENSION).fill(0) as Vector
    key[0] = safeOverlap
    key[index] = Math.sqrt(1 - safeOverlap ** 2)
    const valueIndex = index % 2 === 1 ? 1 : 2
    items.push({
      id: String.fromCharCode(65 + index),
      key,
      value: oneHot(valueIndex),
      valueIndex,
      isTarget: false,
    })
  }

  return items
}

export const writeMemory = (
  items: MemoryItem[],
  retention: number,
): { state: Matrix; snapshots: Matrix[] } => {
  const safeRetention = clamp(retention, 0, 1)
  let state = zeroMatrix(VALUE_DIMENSION, KEY_DIMENSION)
  const snapshots: Matrix[] = []

  for (const item of items) {
    state = addMatrices(scaleMatrix(state, safeRetention), outer(item.value, item.key))
    snapshots.push(state)
  }

  return { state, snapshots }
}

const positiveProportions = (scores: Vector): Vector => {
  const positive = scores.map((score) => Math.max(0, score))
  const total = positive.reduce((sum, score) => sum + score, 0)
  if (total === 0) return positive.map(() => 0)
  return positive.map((score) => score / total)
}

export const simulateScenario = (config: ScenarioConfig): ScenarioResult => {
  const normalizedConfig = {
    overlap: clamp(config.overlap, 0, 0.96),
    itemCount: Math.round(clamp(config.itemCount, 1, KEY_DIMENSION)),
    retention: clamp(config.retention, 0, 1),
  }
  const items = makeScenarioItems(normalizedConfig)
  const { state, snapshots } = writeMemory(items, normalizedConfig.retention)
  const scores = matrixVector(state, items[0].key)
  const proportions = positiveProportions(scores)
  const predictionIndex = scores.reduce(
    (bestIndex, score, index) => (score > scores[bestIndex] ? index : bestIndex),
    0,
  )
  const target = items[0].value
  const squaredError =
    scores.reduce((sum, score, index) => sum + (score - target[index]) ** 2, 0) /
    scores.length
  const competitorScore = Math.max(...scores.filter((_, index) => index !== 0))

  return {
    config: normalizedConfig,
    items,
    state,
    snapshots,
    scores,
    proportions,
    predictionIndex,
    targetIndex: 0,
    passes: predictionIndex === 0,
    targetScore: scores[0],
    competitorScore,
    squaredError,
    memoryScalars: KEY_DIMENSION * VALUE_DIMENSION,
    kvScalars: normalizedConfig.itemCount * (KEY_DIMENSION + VALUE_DIMENSION),
  }
}

export const similarityAngle = (overlap: number): number =>
  (Math.acos(clamp(overlap, -1, 1)) * 180) / Math.PI
