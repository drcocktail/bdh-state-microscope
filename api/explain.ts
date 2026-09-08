const MODEL = 'openai/gpt-oss-120b'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const VALUE_LABELS = ['amber', 'violet', 'mint'] as const

const LENSES = {
  falsify: 'Propose the single strongest next falsification test and name the main confound in the current fixture.',
  connect: 'Explain exactly what this result can illuminate about BDH-style recurrent state and what it cannot establish about BDH-CQ.',
  teach: 'Teach the computation-versus-memory distinction in plain ML language, then end with one short check question.',
} as const

type Lens = keyof typeof LENSES

type GroqResponse = {
  model?: string
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function groqApiKey() {
  return (globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.GROQ_API_KEY
}

function json(body: unknown, status = 200, cache = false) {
  return Response.json(body, {
    status,
    headers: cache
      ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
      : { 'Cache-Control': 'no-store' },
  })
}

function fallbackCommentary(lens: Lens, prediction: number, margin: number) {
  const verdict = prediction === 0 ? 'holds' : 'breaks'
  const common = `Observation — Recall ${verdict}: the target margin is ${margin.toFixed(3)}, while all three execution routes retain numerical parity.`

  if (lens === 'connect') {
    return [
      `• ${common}`,
      '• Inference — The trace isolates a limitation of the fixed associative state used by this BDH-style attention mechanism; it does not identify a failure inside a trained BDH or BDH-CQ model.',
      '• Next test — Train matched additive- and delta-write checkpoints, then compare language loss and held-out associative recall under identical data, compute, precision, and tokenization.',
    ].join('\n')
  }
  if (lens === 'teach') {
    return [
      `• ${common}`,
      '• Inference — “Parallel equals recurrent” describes how the same computation is scheduled. It does not promise that the shared state kept enough distinct addressing information to recall the target.',
      '• Check question — If chunk size changes but the carried state is exact, should the output or the interference boundary move?',
    ].join('\n')
  }
  return [
    `• ${common}`,
    '• Inference — This constructed trace shows sufficiency, not universality: overlap plus load can create interference here, but the fixture does not estimate failure rates in learned representations.',
    '• Next test — Randomize key bases and distractor values across preregistered seeds at matched overlap/load; falsify the mechanism claim if margin behavior is not stable while parity remains below 1e-10.',
  ].join('\n')
}

export async function GET(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)

  // Vercel's Web Request adapter can expose a relative URL in Node functions.
  const url = new URL(request.url, 'https://bdh-state-microscope.vercel.app')
  const lens = url.searchParams.get('lens') as Lens | null
  const overlapPercent = Number(url.searchParams.get('overlap'))
  const itemCount = Number(url.searchParams.get('load'))
  const scoresText = url.searchParams.get('scores') ?? ''
  const suppliedMargin = Number(url.searchParams.get('margin'))

  if (!lens || !(lens in LENSES)) return json({ error: 'Unknown analysis lens.' }, 400)
  if (!Number.isInteger(overlapPercent) || overlapPercent < 0 || overlapPercent > 95 || overlapPercent % 5 !== 0) {
    return json({ error: 'Overlap must be a 5-point increment from 0 to 95.' }, 400)
  }
  if (!Number.isInteger(itemCount) || itemCount < 1 || itemCount > 7) {
    return json({ error: 'Load must be an integer from 1 to 7.' }, 400)
  }
  if (!/^-?\d{1,2}\.\d{3},-?\d{1,2}\.\d{3},-?\d{1,2}\.\d{3}$/.test(scoresText)) {
    return json({ error: 'Scores must contain exactly three bounded, three-decimal values.' }, 400)
  }

  const output = scoresText.split(',').map(Number)
  if (output.some((value) => !Number.isFinite(value) || Math.abs(value) > 20)) {
    return json({ error: 'A score is outside the accepted range.' }, 400)
  }
  const prediction = output.indexOf(Math.max(...output))
  const margin = output[0] - Math.max(output[1], output[2])
  if (!Number.isFinite(suppliedMargin) || Math.abs(suppliedMargin - margin) > 0.006) {
    return json({ error: 'The supplied margin is inconsistent with the rounded scores.' }, 400)
  }

  const observation = [
    `Synthetic fixture: ${itemCount} association writes, ${overlapPercent}% shared key direction, RoPE enabled.`,
    `Declared target: A -> ${VALUE_LABELS[0]}.`,
    `Computed output: [${output.map((value) => value.toFixed(3)).join(', ')}].`,
    `Argmax: ${VALUE_LABELS[prediction]}; target margin: ${margin.toFixed(3)}.`,
    'Independent full, recurrent, and state-carrying chunk evaluators are tested for numerical parity.',
    'This is not a trained BDH or BDH-CQ checkpoint and is not a language benchmark.',
  ].join('\n')

  try {
    const apiKey = groqApiKey()
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured')

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: [
              'You are a skeptical scientific co-reviewer inside an interactive ML exhibit.',
              'Use only the supplied observation. Do not invent paper results or imply trained-model evidence.',
              'Return at most three compact bullet points and 150 words.',
              'Explicitly label statements as Observation, Inference, or Next test.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `${observation}\n\nRequested lens: ${LENSES[lens]}`,
          },
        ],
        temperature: 0.2,
        reasoning_effort: 'low',
        max_completion_tokens: 384,
      }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) throw new Error(`Groq returned HTTP ${response.status}`)

    const result = (await response.json()) as GroqResponse
    const commentary = result.choices?.[0]?.message?.content?.trim()
    if (!commentary) throw new Error('Groq returned no visible commentary')

    return json({
      commentary,
      model: `Groq · ${result.model ?? MODEL}`,
      mode: 'model',
      lens,
      observation,
    }, 200, true)
  } catch (error) {
    console.warn(
      'Groq route unavailable; serving deterministic co-review',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return json({
      commentary: fallbackCommentary(lens, prediction, margin),
      model: 'Deterministic API co-review · Groq unavailable',
      mode: 'fallback',
      lens,
      observation,
    }, 200, true)
  }
}
