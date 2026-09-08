import { describe, expect, it } from 'vitest'
import {
  KEY_DIMENSION,
  VALUE_DIMENSION,
  dot,
  makeScenarioItems,
  simulateScenario,
} from './memory'

describe('fast-weight memory substrate', () => {
  it('keeps the state shape fixed as the stream grows', () => {
    const short = simulateScenario({ overlap: 0.4, itemCount: 2, retention: 1 })
    const long = simulateScenario({ overlap: 0.4, itemCount: 8, retention: 1 })

    expect(short.state).toHaveLength(VALUE_DIMENSION)
    expect(long.state).toHaveLength(VALUE_DIMENSION)
    expect(short.state[0]).toHaveLength(KEY_DIMENSION)
    expect(long.state[0]).toHaveLength(KEY_DIMENSION)
    expect(short.memoryScalars).toBe(long.memoryScalars)
    expect(short.kvScalars).toBeLessThan(long.kvScalars)
  })

  it('recalls the target exactly when keys are orthogonal and retention is one', () => {
    const result = simulateScenario({ overlap: 0, itemCount: 8, retention: 1 })

    expect(result.scores).toEqual([1, 0, 0])
    expect(result.passes).toBe(true)
    expect(result.squaredError).toBe(0)
  })

  it('exposes interference as key similarity grows', () => {
    const clean = simulateScenario({ overlap: 0.1, itemCount: 6, retention: 1 })
    const collision = simulateScenario({ overlap: 0.9, itemCount: 6, retention: 1 })

    expect(clean.competitorScore).toBeLessThan(collision.competitorScore)
    expect(clean.passes).toBe(true)
    expect(collision.passes).toBe(false)
  })

  it('makes older memories fade when retention is below one', () => {
    const stable = simulateScenario({ overlap: 0.3, itemCount: 6, retention: 1 })
    const fading = simulateScenario({ overlap: 0.3, itemCount: 6, retention: 0.85 })

    expect(fading.targetScore).toBeLessThan(stable.targetScore)
  })

  it('constructs keys with the requested cosine similarity to the target', () => {
    const items = makeScenarioItems({ overlap: 0.64, itemCount: 5 })

    for (const distractor of items.slice(1)) {
      expect(dot(items[0].key, distractor.key)).toBeCloseTo(0.64, 8)
    }
  })
})
