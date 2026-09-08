export type Vector = readonly number[]
export type Matrix = readonly (readonly number[])[]

export type TokenRole = 'association' | 'query'

export type AttentionToken = {
  id: string
  label: string
  key: Vector
  value: Vector
  role: TokenRole
  expected?: Vector
}

export type RotationMode = 'rope' | 'identity'
export type WriteRule = 'additive' | 'delta'

export type EvaluationOptions = {
  rotation?: RotationMode
  writeRule?: WriteRule
  beta?: number
  epsilon?: number
}

export type ParallelResult = {
  rotatedKeys: Matrix
  scores: Matrix
  outputs: Matrix
  finalState: Matrix
}

export type RecurrentStep = {
  position: number
  token: AttentionToken
  rotatedKey: Vector
  stateBefore: Matrix
  output: Vector
  predictionError: Vector
  write: Matrix
  stateAfter: Matrix
}

export type RecurrentResult = {
  outputs: Matrix
  steps: readonly RecurrentStep[]
  finalState: Matrix
}

export type ChunkTrace = {
  start: number
  end: number
  stateIn: Matrix
  stateOut: Matrix
}

export type ChunkedResult = {
  outputs: Matrix
  chunks: readonly ChunkTrace[]
  finalState: Matrix
}

const assertPositiveInteger = (value: number, name: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name}: expected a positive integer`)
  }
}

const assertRectangular = (matrix: Matrix, name: string) => {
  if (matrix.length === 0 || matrix[0].length === 0) {
    throw new Error(`${name}: matrix cannot be empty`)
  }
  const columns = matrix[0].length
  if (matrix.some((row) => row.length !== columns)) {
    throw new Error(`${name}: matrix must be rectangular`)
  }
}

const assertSequence = (tokens: readonly AttentionToken[]) => {
  if (tokens.length === 0) throw new Error('sequence cannot be empty')
  const keyDimension = tokens[0].key.length
  const valueDimension = tokens[0].value.length
  assertPositiveInteger(keyDimension, 'key dimension')
  assertPositiveInteger(valueDimension, 'value dimension')
  if (tokens.some((token) => token.key.length !== keyDimension)) {
    throw new Error('all token keys must have the same dimension')
  }
  if (tokens.some((token) => token.value.length !== valueDimension)) {
    throw new Error('all token values must have the same dimension')
  }
}

export const zeros = (rows: number, columns: number): number[][] => {
  assertPositiveInteger(rows, 'rows')
  assertPositiveInteger(columns, 'columns')
  return Array.from({ length: rows }, () => Array<number>(columns).fill(0))
}

export const dot = (left: Vector, right: Vector): number => {
  if (left.length !== right.length) throw new Error('dot: dimensions must match')
  return left.reduce((sum, value, index) => sum + value * right[index], 0)
}

export const vectorTimesMatrix = (vector: Vector, matrix: Matrix): number[] => {
  assertRectangular(matrix, 'vectorTimesMatrix')
  if (vector.length !== matrix.length) {
    throw new Error('vectorTimesMatrix: dimensions must match')
  }
  return Array.from({ length: matrix[0].length }, (_, column) =>
    vector.reduce((sum, value, row) => sum + value * matrix[row][column], 0),
  )
}

export const outer = (left: Vector, right: Vector): number[][] =>
  left.map((leftValue) => right.map((rightValue) => leftValue * rightValue))

export const addMatrices = (left: Matrix, right: Matrix): number[][] => {
  assertRectangular(left, 'addMatrices left')
  assertRectangular(right, 'addMatrices right')
  if (left.length !== right.length || left[0].length !== right[0].length) {
    throw new Error('addMatrices: dimensions must match')
  }
  return left.map((row, rowIndex) =>
    row.map((value, columnIndex) => value + right[rowIndex][columnIndex]),
  )
}

export const subtractVectors = (left: Vector, right: Vector): number[] => {
  if (left.length !== right.length) {
    throw new Error('subtractVectors: dimensions must match')
  }
  return left.map((value, index) => value - right[index])
}

export const scaleMatrix = (matrix: Matrix, scale: number): number[][] =>
  matrix.map((row) => row.map((value) => value * scale))

export const cloneMatrix = (matrix: Matrix): number[][] =>
  matrix.map((row) => [...row])

/**
 * Applies conventional pairwise rotary position encoding. Odd trailing
 * dimensions (when present) are deliberately left unchanged.
 */
export const rotatePairwise = (
  vector: Vector,
  position: number,
  base = 10_000,
): number[] => {
  const rotated = [...vector]
  for (let index = 0; index + 1 < vector.length; index += 2) {
    const frequency = base ** (-index / vector.length)
    const angle = position * frequency
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    rotated[index] = vector[index] * cosine - vector[index + 1] * sine
    rotated[index + 1] = vector[index] * sine + vector[index + 1] * cosine
  }
  return rotated
}

export const transformKey = (
  key: Vector,
  position: number,
  rotation: RotationMode,
): number[] => (rotation === 'rope' ? rotatePairwise(key, position) : [...key])

const resolveOptions = (options: EvaluationOptions) => ({
  rotation: options.rotation ?? ('rope' as RotationMode),
  writeRule: options.writeRule ?? ('additive' as WriteRule),
  beta: options.beta ?? 1,
  epsilon: options.epsilon ?? 1e-12,
})

const additiveWrite = (key: Vector, value: Vector): number[][] => outer(key, value)

const deltaWrite = (
  key: Vector,
  value: Vector,
  state: Matrix,
  beta: number,
  epsilon: number,
): { error: number[]; write: number[][] } => {
  const prediction = vectorTimesMatrix(key, state)
  const error = subtractVectors(value, prediction)
  const normalizer = dot(key, key) + epsilon
  return {
    error,
    write: scaleMatrix(outer(key, error), beta / normalizer),
  }
}

/** Complete strictly-causal matrix evaluation: tril(QK^T, -1)V. */
export const runParallel = (
  tokens: readonly AttentionToken[],
  options: EvaluationOptions = {},
): ParallelResult => {
  assertSequence(tokens)
  const { rotation, writeRule } = resolveOptions(options)
  if (writeRule !== 'additive') {
    throw new Error('runParallel: the closed-form oracle is defined for additive writes')
  }

  const rotatedKeys = tokens.map((token, position) =>
    transformKey(token.key, position, rotation),
  )
  const scores = tokens.map((_, queryIndex) =>
    tokens.map((__, keyIndex) =>
      keyIndex < queryIndex ? dot(rotatedKeys[queryIndex], rotatedKeys[keyIndex]) : 0,
    ),
  )
  const valueDimension = tokens[0].value.length
  const outputs = scores.map((row) =>
    Array.from({ length: valueDimension }, (_, valueIndex) =>
      row.reduce(
        (sum, score, tokenIndex) => sum + score * tokens[tokenIndex].value[valueIndex],
        0,
      ),
    ),
  )
  let finalState: Matrix = zeros(rotatedKeys[0].length, valueDimension)
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].role === 'query') continue
    finalState = addMatrices(finalState, additiveWrite(rotatedKeys[index], tokens[index].value))
  }

  return { rotatedKeys, scores, outputs, finalState }
}

/** Token-by-token evaluation: output from S_(t-1), then write S_t. */
export const runRecurrent = (
  tokens: readonly AttentionToken[],
  options: EvaluationOptions = {},
): RecurrentResult => {
  assertSequence(tokens)
  const { rotation, writeRule, beta, epsilon } = resolveOptions(options)
  const keyDimension = tokens[0].key.length
  const valueDimension = tokens[0].value.length
  let state: Matrix = zeros(keyDimension, valueDimension)
  const steps: RecurrentStep[] = []

  tokens.forEach((token, position) => {
    const rotatedKey = transformKey(token.key, position, rotation)
    const stateBefore = cloneMatrix(state)
    const output = vectorTimesMatrix(rotatedKey, stateBefore)
    const delta = token.role === 'query'
      ? {
          error: token.expected
            ? subtractVectors(token.expected, output)
            : Array<number>(valueDimension).fill(0),
          write: zeros(keyDimension, valueDimension),
        }
      : writeRule === 'delta'
        ? deltaWrite(rotatedKey, token.value, stateBefore, beta, epsilon)
        : {
            error: subtractVectors(token.value, output),
            write: additiveWrite(rotatedKey, token.value),
          }
    state = addMatrices(stateBefore, delta.write)
    steps.push({
      position,
      token,
      rotatedKey,
      stateBefore,
      output,
      predictionError: delta.error,
      write: delta.write,
      stateAfter: cloneMatrix(state),
    })
  })

  return {
    outputs: steps.map((step) => step.output),
    steps,
    finalState: cloneMatrix(state),
  }
}

/**
 * Independent chunk equation. A chunk reads its incoming state in one term and
 * its own strict-lower-triangle history in another.
 */
export const runChunked = (
  tokens: readonly AttentionToken[],
  chunkSizes: readonly number[],
  options: Pick<EvaluationOptions, 'rotation'> = {},
): ChunkedResult => {
  assertSequence(tokens)
  if (chunkSizes.length === 0 || chunkSizes.some((size) => !Number.isInteger(size) || size <= 0)) {
    throw new Error('runChunked: chunk sizes must be positive integers')
  }
  if (chunkSizes.reduce((sum, size) => sum + size, 0) !== tokens.length) {
    throw new Error('runChunked: chunk sizes must cover the sequence exactly')
  }

  const rotation = options.rotation ?? 'rope'
  const keys = tokens.map((token, position) => transformKey(token.key, position, rotation))
  const valueDimension = tokens[0].value.length
  let state: Matrix = zeros(keys[0].length, valueDimension)
  const outputs: number[][] = []
  const chunks: ChunkTrace[] = []
  let start = 0

  for (const chunkSize of chunkSizes) {
    const end = start + chunkSize
    const stateIn = cloneMatrix(state)
    for (let queryIndex = start; queryIndex < end; queryIndex += 1) {
      const fromPriorChunks = vectorTimesMatrix(keys[queryIndex], stateIn)
      const fromThisChunk = Array<number>(valueDimension).fill(0)
      for (let keyIndex = start; keyIndex < queryIndex; keyIndex += 1) {
        const score = dot(keys[queryIndex], keys[keyIndex])
        for (let valueIndex = 0; valueIndex < valueDimension; valueIndex += 1) {
          fromThisChunk[valueIndex] += score * tokens[keyIndex].value[valueIndex]
        }
      }
      outputs.push(
        fromPriorChunks.map((value, valueIndex) => value + fromThisChunk[valueIndex]),
      )
    }
    for (let index = start; index < end; index += 1) {
      if (tokens[index].role === 'query') continue
      state = addMatrices(state, additiveWrite(keys[index], tokens[index].value))
    }
    chunks.push({ start, end, stateIn, stateOut: cloneMatrix(state) })
    start = end
  }

  return { outputs, chunks, finalState: cloneMatrix(state) }
}

export const maxAbsDifference = (left: Matrix, right: Matrix): number => {
  assertRectangular(left, 'maxAbsDifference left')
  assertRectangular(right, 'maxAbsDifference right')
  if (left.length !== right.length || left[0].length !== right[0].length) {
    throw new Error('maxAbsDifference: dimensions must match')
  }
  return left.reduce(
    (maximum, row, rowIndex) =>
      Math.max(
        maximum,
        ...row.map((value, columnIndex) => Math.abs(value - right[rowIndex][columnIndex])),
      ),
    0,
  )
}

export const argMax = (values: Vector): number => {
  if (values.length === 0) throw new Error('argMax: vector cannot be empty')
  return values.reduce(
    (bestIndex, value, index) => (value > values[bestIndex] ? index : bestIndex),
    0,
  )
}

export const targetMargin = (values: Vector, targetIndex: number): number => {
  if (targetIndex < 0 || targetIndex >= values.length) {
    throw new Error('targetMargin: target index is outside the vector')
  }
  const competitor = Math.max(...values.filter((_, index) => index !== targetIndex))
  return values[targetIndex] - competitor
}

export const meanSquaredError = (actual: Vector, expected: Vector): number => {
  if (actual.length !== expected.length) {
    throw new Error('meanSquaredError: dimensions must match')
  }
  return (
    actual.reduce((sum, value, index) => sum + (value - expected[index]) ** 2, 0) /
    actual.length
  )
}
