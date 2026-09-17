import { describe, expect, it } from 'vitest'
import { CONCEPTS, deterministicReview, observationOf, readTrace, sanitizeModelReview } from './tutor'

const trace = { overlap: 70, load: 5, scores: [1, 2.46, 1.64], margin: 1 - 2.46 }

describe('tutor trace validation', () => {
  it('accepts a trace the engine could have produced', () => {
    expect(readTrace({ ...trace, margin: Number(trace.margin.toFixed(3)) })).toHaveProperty('trace')
  })

  it('rejects out-of-range and off-grid controls', () => {
    expect(readTrace({ ...trace, overlap: 71 })).toHaveProperty('error')
    expect(readTrace({ ...trace, overlap: 100 })).toHaveProperty('error')
    expect(readTrace({ ...trace, load: 9 })).toHaveProperty('error')
    expect(readTrace({ ...trace, scores: [1, 2] })).toHaveProperty('error')
    expect(readTrace({ ...trace, scores: [1, 2, 999] })).toHaveProperty('error')
    expect(readTrace(null)).toHaveProperty('error')
  })

  it('rejects a margin that does not follow from the scores', () => {
    expect(readTrace({ ...trace, margin: 5 })).toHaveProperty('error')
  })

  it('never states a trained-model claim in the observation', () => {
    const text = observationOf(trace)
    expect(text).toContain('not a trained BDH or BDH-CQ checkpoint')
    expect(text).toContain('70% shared key direction')
  })
})

describe('deterministic review', () => {
  it('scores an explanation that names all three concepts', () => {
    const review = deterministicReview('Both routes compute the identical output because the recurrent state adds the same pairs, but overlapping keys make recall fail.', trace)
    expect(review.captured).toBe(3)
    expect(review.probe.overlap % 5).toBe(0)
    expect(review.probe.load).toBe(trace.load)
  })

  it('teaches from a weak attempt instead of refusing', () => {
    const review = deterministicReview('no idea', trace)
    expect(review.captured).toBe(0)
    expect(review.concepts).toHaveLength(CONCEPTS.length)
    expect(review.followUp.length).toBeGreaterThan(10)
  })
})

describe('model output sanitising', () => {
  const explanation = 'The recurrent state keeps one matrix, so the answers agree.'
  const fallback = deterministicReview(explanation, trace)

  it('drops a quote the reader never wrote', () => {
    const review = sanitizeModelReview({
      concepts: [{ id: 'same-answer', met: true, quote: 'I said something I never said', note: 'Good.' }],
      followUp: 'What changes at higher overlap?',
      probe: { overlap: 80, load: 4, claim: 'Amber still wins.' },
    }, explanation, fallback)
    expect(review?.concepts[0].quote).toBe('')
  })

  it('keeps a quote copied from the reader', () => {
    const review = sanitizeModelReview({
      concepts: [{ id: 'same-answer', met: true, quote: 'the answers agree', note: 'Yes.' }],
      followUp: 'Why?',
      probe: { overlap: 80, load: 4, claim: 'Amber still wins.' },
    }, explanation, fallback)
    expect(review?.concepts[0].quote).toBe('the answers agree')
  })

  it('replaces an illegal probe with the deterministic one', () => {
    const review = sanitizeModelReview({
      concepts: [],
      followUp: 'Why?',
      probe: { overlap: 400, load: 99, claim: 'Out of range.' },
    }, explanation, fallback)
    expect(review?.probe).toEqual(fallback.probe)
  })

  it('shortens a quote that copies the whole answer', () => {
    const review = sanitizeModelReview({
      concepts: [{ id: 'same-answer', met: true, quote: explanation, note: 'Good.' }],
      followUp: 'Why?',
      probe: { overlap: 80, load: 4, claim: 'Amber still wins.' },
    }, explanation, fallback)
    expect(review?.concepts[0].quote.split(' ').length).toBeLessThanOrEqual(14)
    expect(explanation.toLowerCase()).toContain(review!.concepts[0].quote.toLowerCase())
  })

  it('rejects a probe identical to the trace already on screen', () => {
    const review = sanitizeModelReview({
      concepts: [],
      followUp: 'Why?',
      probe: { overlap: trace.overlap, load: trace.load, claim: 'Nothing changes.' },
    }, explanation, fallback, trace)
    expect(review?.probe).toEqual(fallback.probe)
    expect(review?.probe.overlap).not.toBe(trace.overlap)
  })

  it('refuses a malformed payload so the caller falls back', () => {
    expect(sanitizeModelReview({ nonsense: true }, explanation, fallback)).toBeNull()
    expect(sanitizeModelReview(null, explanation, fallback)).toBeNull()
  })

  it('returns exactly the three known concepts whatever the model sends', () => {
    const review = sanitizeModelReview({
      concepts: [{ id: 'invented-concept', met: true, quote: '', note: 'x' }],
      followUp: 'Why?',
      probe: { overlap: 50, load: 3, claim: 'Amber wins.' },
    }, explanation, fallback)
    expect(review?.concepts.map(c => c.id)).toEqual(CONCEPTS.map(c => c.id))
  })
})
