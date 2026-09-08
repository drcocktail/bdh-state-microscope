import { describe, expect, it } from 'vitest'
import {
  maxAbsDifference,
  runChunked,
  runParallel,
  runRecurrent,
} from './microscope'
import {
  KEY_DIMENSION,
  VALUE_DIMENSION,
  buildAssociationScenario,
  comparePlasticityRules,
  identicalKeyConflict,
  runOverlapSweep,
} from './scenarios'

describe('BDH state microscope engine', () => {
  const scenario = buildAssociationScenario({ overlap: 0.63, itemCount: 6 })

  it('holds parity across a 35-scenario overlap-by-load grid', () => {
    const overlaps = [0, 0.19, 0.47, 0.81, 0.95]
    for (let itemCount = 1; itemCount <= 7; itemCount += 1) {
      for (const overlap of overlaps) {
        const fixture = buildAssociationScenario({ overlap, itemCount })
        const parallel = runParallel(fixture.tokens, { rotation: 'rope' })
        const recurrent = runRecurrent(fixture.tokens, { rotation: 'rope' })
        expect(maxAbsDifference(parallel.outputs, recurrent.outputs)).toBeLessThan(1e-10)
        expect(maxAbsDifference(parallel.finalState, recurrent.finalState)).toBeLessThan(1e-10)
      }
    }
  })

  it('matches the complete causal oracle with token-by-token recurrence', () => {
    const parallel = runParallel(scenario.tokens, { rotation: 'rope' })
    const recurrent = runRecurrent(scenario.tokens, { rotation: 'rope' })

    expect(maxAbsDifference(parallel.outputs, recurrent.outputs)).toBeLessThan(1e-10)
    expect(maxAbsDifference(parallel.finalState, recurrent.finalState)).toBeLessThan(1e-10)
  })

  it('matches the oracle under whole, token, and irregular chunk schedules', () => {
    const parallel = runParallel(scenario.tokens, { rotation: 'rope' })
    const whole = runChunked(scenario.tokens, [scenario.tokens.length], { rotation: 'rope' })
    const tokenwise = runChunked(
      scenario.tokens,
      scenario.tokens.map(() => 1),
      { rotation: 'rope' },
    )
    const irregular = runChunked(scenario.tokens, [2, 1, scenario.tokens.length - 3], {
      rotation: 'rope',
    })

    for (const result of [whole, tokenwise, irregular]) {
      expect(maxAbsDifference(parallel.outputs, result.outputs)).toBeLessThan(1e-10)
      expect(maxAbsDifference(parallel.finalState, result.finalState)).toBeLessThan(1e-10)
    }
  })

  it('strictly excludes the current token from its own output', () => {
    const result = runParallel(scenario.tokens, { rotation: 'rope' })

    result.scores.forEach((row, index) => {
      expect(row[index]).toBe(0)
      expect(row.slice(index)).toEqual(Array(row.length - index).fill(0))
    })
    expect(result.outputs[0]).toEqual([0, 0, 0])
  })

  it('keeps the recurrent state shape fixed as the stream grows', () => {
    const short = runRecurrent(
      buildAssociationScenario({ overlap: 0.4, itemCount: 2 }).tokens,
    )
    const long = runRecurrent(
      buildAssociationScenario({ overlap: 0.4, itemCount: 7 }).tokens,
    )

    for (const result of [short, long]) {
      expect(result.finalState).toHaveLength(KEY_DIMENSION)
      expect(result.finalState[0]).toHaveLength(VALUE_DIMENSION)
    }
  })

  it('recalls a clean target and crosses a controlled overlap boundary', () => {
    const clean = buildAssociationScenario({ overlap: 0.1, itemCount: 6 })
    const collision = buildAssociationScenario({ overlap: 0.9, itemCount: 6 })
    const cleanOutput = runParallel(clean.tokens).outputs[clean.queryIndex]
    const collisionOutput = runParallel(collision.tokens).outputs[collision.queryIndex]

    expect(cleanOutput[0]).toBeGreaterThan(Math.max(cleanOutput[1], cleanOutput[2]))
    expect(collisionOutput[0]).toBeLessThan(Math.max(collisionOutput[1], collisionOutput[2]))
  })

  it('makes interference increase across the deterministic overlap sweep', () => {
    const sweep = runOverlapSweep(6)

    expect(sweep[0].passes).toBe(true)
    expect(sweep.at(-1)?.passes).toBe(false)
    expect(sweep[0].margin).toBeGreaterThan(sweep.at(-1)?.margin ?? Infinity)
  })

  it('replaces a same-key association with a normalized delta write', () => {
    const comparison = comparePlasticityRules()

    expect(comparison.additive.output).toEqual([1, 1, 0])
    expect(comparison.additive.predictionIndex).toBe(0)
    expect(comparison.delta.output[0]).toBeCloseTo(0, 10)
    expect(comparison.delta.output[1]).toBeCloseTo(1, 10)
    expect(comparison.delta.predictionIndex).toBe(1)
    expect(comparison.delta.error).toBeLessThan(comparison.additive.error)
    expect(comparison.delta.state[0][1]).toBeCloseTo(1, 10)
  })

  it('retains the identical-key incompatibility as a negative control', () => {
    const conflict = identicalKeyConflict()

    expect(conflict.simultaneouslySatisfiable).toBe(false)
    expect(conflict.errors[0]).toBeGreaterThan(0)
    expect(conflict.errors[1]).toBeLessThan(1e-20)
  })

  it('rejects a chunk schedule that does not cover the sequence', () => {
    expect(() => runChunked(scenario.tokens, [2, 2])).toThrow(/cover the sequence/)
  })
})
