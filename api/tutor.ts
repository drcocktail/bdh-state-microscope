const MODEL = 'openai/gpt-oss-120b'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const VALUE_LABELS = ['amber', 'violet', 'mint'] as const
const EXPLANATION_CAP = 1200

export const CONCEPTS = [
  { id: 'same-answer', label: 'The same answer', guidance: 'The full matrix, the recurrent state and the chunked run all add the same contributions.', pattern: /exact|equiv|identical|parity|same (answer|output|computation|result)/ },
  { id: 'what-memory-stores', label: 'What memory stores', guidance: 'Each key-value pair is added into a matrix whose shape stays fixed.', pattern: /state|matrix|recurrent|chunk|parallel|fixed|compress|history/ },
  { id: 'why-recall-fails', label: 'Why recall can fail', guidance: 'Similar keys also contribute when we ask for A, and their colors can outweigh amber.', pattern: /overlap|collision|interference|memory|address|wrong|fail|recall|lost|confus|quality/ },
] as const

const LENSES = {
  falsify: 'Propose the single strongest next falsification test and name the main confound in the current fixture.',
  connect: 'Explain exactly what this result can illuminate about BDH-style recurrent state and what it cannot establish about BDH-CQ.',
  teach: 'Teach the computation-versus-memory distinction in plain ML language, then end with one short check question.',
} as const

type Lens = keyof typeof LENSES
type Trace = { overlap: number; load: number; scores: number[]; margin: number }

function groqApiKey() {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.GROQ_API_KEY
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Reject anything the engine could not have produced, so the model only ever sees real trace values. */
export function readTrace(raw: unknown): { trace: Trace } | { error: string } {
  const value = raw as Partial<Record<keyof Trace, unknown>> | null
  if (!value || typeof value !== 'object') return { error: 'A trace is required.' }
  const overlap = Number(value.overlap), load = Number(value.load), margin = Number(value.margin)
  const scores = Array.isArray(value.scores) ? value.scores.map(Number) : []
  if (!Number.isInteger(overlap) || overlap < 0 || overlap > 95 || overlap % 5 !== 0) return { error: 'Overlap must be a 5-point increment from 0 to 95.' }
  if (!Number.isInteger(load) || load < 1 || load > 7) return { error: 'Load must be an integer from 1 to 7.' }
  if (scores.length !== 3 || scores.some(s => !Number.isFinite(s) || Math.abs(s) > 20)) return { error: 'Scores must be three bounded values.' }
  const expected = scores[0] - Math.max(scores[1], scores[2])
  if (!Number.isFinite(margin) || Math.abs(margin - expected) > 0.006) return { error: 'The supplied margin is inconsistent with the scores.' }
  return { trace: { overlap, load, scores, margin } }
}

export function observationOf(trace: Trace) {
  const prediction = trace.scores.indexOf(Math.max(...trace.scores))
  return [
    `Synthetic fixture: ${trace.load} association writes, ${trace.overlap}% shared key direction, RoPE enabled.`,
    `Declared target: A -> ${VALUE_LABELS[0]}.`,
    `Computed output: [${trace.scores.map(v => v.toFixed(3)).join(', ')}].`,
    `Argmax: ${VALUE_LABELS[prediction]}; target margin: ${trace.margin.toFixed(3)}.`,
    'Full, recurrent and chunked evaluators are independently tested for numerical parity.',
    'This is not a trained BDH or BDH-CQ checkpoint and is not a language benchmark.',
  ].join('\n')
}

/** Keyword rubric: the offline path, and the floor the model result is merged onto. */
export function deterministicReview(explanation: string, trace: Trace) {
  const normalized = explanation.toLowerCase()
  const concepts: { id: string; label: string; met: boolean; quote: string; note: string }[] =
    CONCEPTS.map(c => ({ id: c.id, label: c.label, met: c.pattern.test(normalized), quote: '', note: c.guidance }))
  const captured = concepts.filter(c => c.met).length
  const probeOverlap = Math.min(95, Math.max(0, Math.round((trace.overlap + 20) / 5) * 5))
  return {
    concepts,
    captured,
    followUp: captured === 3
      ? 'You covered all three. If the two calculations always agree, what would have to change for recall to succeed at this overlap?'
      : 'Which part of the memory is shared between the keys, and why does that change the answer we read back?',
    probe: { overlap: probeOverlap, load: trace.load, claim: `At ${probeOverlap}% overlap with ${trace.load} writes, amber still wins.` },
  }
}

type ModelReview = ReturnType<typeof deterministicReview>

/** Keep whole sentences: a line cut mid-clause reads like a broken page, not a short answer. */
export function tidySentence(raw: string, maxWords: number): string {
  const text = raw.replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/\s+/g, ' ').trim()
  const first = text.match(/^[^.!?]*[.!?]/)?.[0]?.trim() ?? text
  const words = first.split(' ')
  if (words.length <= maxWords) return first
  return words.slice(0, maxWords).join(' ').replace(/[,;:]+$/, '') + '.'
}

/** Trust nothing in the model's JSON: ids, quotes and probe ranges are all re-checked here. */
export function sanitizeModelReview(raw: unknown, explanation: string, fallback: ModelReview, trace?: Trace): ModelReview | null {
  const value = raw as { concepts?: unknown; followUp?: unknown; probe?: unknown } | null
  if (!value || typeof value !== 'object' || !Array.isArray(value.concepts)) return null
  const haystack = explanation.toLowerCase()
  const concepts = CONCEPTS.map((concept, index) => {
    const entry = (value.concepts as Array<Record<string, unknown>>).find(c => String(c?.id) === concept.id) ?? {}
    // Models like to quote the whole answer back: keep a short phrase that is still the reader's own.
    const quote = typeof entry.quote === 'string' ? entry.quote.trim().split(/\s+/).slice(0, 14).join(' ').slice(0, 120) : ''
    const note = typeof entry.note === 'string' && entry.note.trim() ? entry.note.trim().replace(/[\u2013\u2014]/g, ', ').slice(0, 240) : concept.guidance
    return {
      id: concept.id,
      label: concept.label,
      met: typeof entry.met === 'boolean' ? entry.met : fallback.concepts[index].met,
      quote: quote && haystack.includes(quote.toLowerCase()) ? quote : '',
      note,
    }
  })
  const followUp = typeof value.followUp === 'string' && value.followUp.trim() ? tidySentence(value.followUp, 32) : fallback.followUp
  const probeRaw = value.probe as Record<string, unknown> | undefined
  const overlap = Math.round(Number(probeRaw?.overlap) / 5) * 5
  const load = Math.round(Number(probeRaw?.load))
  const claim = typeof probeRaw?.claim === 'string' && probeRaw.claim.trim().length > 8 ? tidySentence(probeRaw.claim, 26) : ''
  // A probe identical to the trace on screen tests nothing, so fall back to one that moves.
  const sameAsTrace = trace ? overlap === trace.overlap && load === trace.load : false
  const probe = Number.isFinite(overlap) && overlap >= 0 && overlap <= 95 && Number.isInteger(load) && load >= 1 && load <= 7 && claim && !sameAsTrace
    ? { overlap, load, claim }
    : fallback.probe
  return { concepts, captured: concepts.filter(c => c.met).length, followUp, probe }
}

async function callGroq(body: unknown, timeoutMs = 12_000) {
  const apiKey = groqApiKey()
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured')
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`Groq returned HTTP ${response.status}`)
  const result = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string } }> }
  const content = result.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Groq returned no content')
  return { content, model: `Groq · ${result.model ?? MODEL}` }
}

function fallbackCommentary(lens: Lens, trace: Trace) {
  const verdict = trace.scores[0] === Math.max(...trace.scores) ? 'holds' : 'breaks'
  const common = `Observation: recall ${verdict}. The target margin is ${trace.margin.toFixed(3)} while all three execution routes keep numerical parity.`
  if (lens === 'connect') return [common, 'Inference: the trace isolates a limit of the fixed associative state in this BDH-style attention, not a failure inside a trained BDH or BDH-CQ model.', 'Next test: train matched additive and delta checkpoints, then compare held-out associative recall under identical data, compute and tokenization.'].join('\n')
  if (lens === 'teach') return [common, 'Inference: "parallel equals recurrent" describes how the same computation is scheduled. It does not promise the shared state kept enough addressing information to recall the target.', 'Check question: if the chunk size changes but the carried state stays exact, should the output move, or the interference boundary?'].join('\n')
  return [common, 'Inference: this fixture shows sufficiency, not universality. Overlap plus load creates interference here; it does not estimate failure rates in learned representations.', 'Next test: randomize key bases and distractor values across preregistered seeds at matched overlap and load; falsify the claim if margin behavior is unstable while parity stays below 1e-10.'].join('\n')
}

async function teachback(explanation: string, trace: Trace) {
  const observation = observationOf(trace)
  const offline = deterministicReview(explanation, trace)
  try {
    const { content, model } = await callGroq({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      reasoning_effort: 'low',
      max_completion_tokens: 700,
      messages: [
        { role: 'system', content: [
          'You coach a reader who just explained a linear-attention memory experiment in their own words.',
          'Judge only whether they expressed each concept in their own wording; never require specific keywords.',
          'Use only the supplied observation for numbers. Never invent measurements or cite papers.',
          'Reply with JSON: {"concepts":[{"id":"same-answer","met":bool,"quote":"","note":""},{"id":"what-memory-stores",...},{"id":"why-recall-fails",...}],"followUp":"","probe":{"overlap":int,"load":int,"claim":""}}.',
          'Each quote must be copied verbatim from the reader when met is true, else empty. Each note is one sentence of feedback addressed to the reader.',
          'Each quote is at most 12 words: the shortest phrase from the reader that shows the concept, not their whole answer.',
          'followUp is one question that targets their weakest part.',
          'probe is a NEW experiment, different from the trace shown: probe.overlap is a multiple of 5 from 0 to 95 and probe.load an integer 1 to 7, and it must differ from the trace. claim is ONE complete sentence of at most 22 words, addressed to the reader, stating what their explanation predicts will happen there.',
        ].join(' ') },
        { role: 'user', content: `Concepts:\n${CONCEPTS.map(c => `${c.id}: ${c.guidance}`).join('\n')}\n\nLive trace:\n${observation}\n\nReader's explanation:\n"""${explanation}"""` },
      ],
    })
    const review = sanitizeModelReview(JSON.parse(content), explanation, offline, trace)
    if (!review) throw new Error('Groq returned an unusable review')
    return { ...review, mode: 'model' as const, model, observation }
  } catch (error) {
    console.warn('Tutor falling back to the deterministic rubric:', error instanceof Error ? error.message : 'Unknown error')
    return { ...offline, mode: 'fallback' as const, model: 'Deterministic rubric (no model call)', observation }
  }
}

async function coReview(lens: Lens, trace: Trace) {
  const observation = observationOf(trace)
  try {
    const { content, model } = await callGroq({
      model: MODEL,
      temperature: 0.2,
      reasoning_effort: 'low',
      max_completion_tokens: 384,
      messages: [
        { role: 'system', content: 'You are a skeptical scientific co-reviewer inside an interactive ML exhibit. Use only the supplied observation. Do not invent paper results or imply trained-model evidence. Return at most three compact bullet points and 150 words. Label each statement Observation, Inference or Next test.' },
        { role: 'user', content: `${observation}\n\nRequested lens: ${LENSES[lens]}` },
      ],
    })
    return { commentary: content, mode: 'model' as const, model, lens, observation }
  } catch (error) {
    console.warn('Co-review falling back to deterministic commentary:', error instanceof Error ? error.message : 'Unknown error')
    return { commentary: fallbackCommentary(lens, trace), mode: 'fallback' as const, model: 'Deterministic co-review (no model call)', lens, observation }
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await request.json() as Record<string, unknown>
  } catch {
    return json({ error: 'Send a JSON body.' }, 400)
  }
  const read = readTrace(payload.trace)
  if ('error' in read) return json({ error: read.error }, 400)

  if (payload.mode === 'teachback') {
    const explanation = typeof payload.explanation === 'string' ? payload.explanation.replace(/[ -]+/g, ' ').trim().slice(0, EXPLANATION_CAP) : ''
    if (explanation.length < 12) return json({ error: 'Write a sentence or two first.' }, 400)
    return json(await teachback(explanation, read.trace))
  }
  if (payload.mode === 'trace') {
    const lens = payload.lens as Lens
    if (!lens || !(lens in LENSES)) return json({ error: 'Unknown analysis lens.' }, 400)
    return json(await coReview(lens, read.trace))
  }
  return json({ error: 'Unknown tutor mode.' }, 400)
}
