import { generateText } from 'ai'
import { argMax, runRecurrent, targetMargin } from '../src/engine/microscope'
import { VALUE_LABELS, buildAssociationScenario } from '../src/engine/scenarios'

const MODEL = 'spacexai/grok-4.1-fast-non-reasoning'

const LENSES = {
  falsify: 'Propose the single strongest next falsification test and name the main confound in the current fixture.',
  connect: 'Explain exactly what this result can illuminate about BDH-style recurrent state and what it cannot establish about BDH-CQ.',
  teach: 'Teach the computation-versus-memory distinction in plain ML language, then end with one short check question.',
} as const

type Lens = keyof typeof LENSES

function json(body: unknown, status = 200, cache = false) {
  return Response.json(body, {
    status,
    headers: cache
      ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
      : { 'Cache-Control': 'no-store' },
  })
}

export default async function handler(request: Request) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405)

  const url = new URL(request.url)
  const lens = url.searchParams.get('lens') as Lens | null
  const overlapPercent = Number(url.searchParams.get('overlap'))
  const itemCount = Number(url.searchParams.get('load'))

  if (!lens || !(lens in LENSES)) return json({ error: 'Unknown analysis lens.' }, 400)
  if (!Number.isInteger(overlapPercent) || overlapPercent < 0 || overlapPercent > 95 || overlapPercent % 5 !== 0) {
    return json({ error: 'Overlap must be a 5-point increment from 0 to 95.' }, 400)
  }
  if (!Number.isInteger(itemCount) || itemCount < 1 || itemCount > 7) {
    return json({ error: 'Load must be an integer from 1 to 7.' }, 400)
  }

  const overlap = overlapPercent / 100
  const scenario = buildAssociationScenario({ overlap, itemCount })
  const recurrent = runRecurrent(scenario.tokens, { rotation: 'rope', writeRule: 'additive' })
  const output = recurrent.outputs[scenario.queryIndex]
  const prediction = argMax(output)
  const margin = targetMargin(output, scenario.targetIndex)

  const observation = [
    `Synthetic fixture: ${itemCount} association writes, ${overlapPercent}% shared key direction, RoPE enabled.`,
    `Declared target: A -> ${VALUE_LABELS[scenario.targetIndex]}.`,
    `Computed output: [${output.map((value) => value.toFixed(3)).join(', ')}].`,
    `Argmax: ${VALUE_LABELS[prediction]}; target margin: ${margin.toFixed(3)}.`,
    'Independent full, recurrent, and state-carrying chunk evaluators are tested for numerical parity.',
    'This is not a trained BDH or BDH-CQ checkpoint and is not a language benchmark.',
  ].join('\n')

  try {
    const result = await generateText({
      model: MODEL,
      system: [
        'You are a skeptical scientific co-reviewer inside an interactive ML exhibit.',
        'Use only the supplied observation. Do not invent paper results or imply trained-model evidence.',
        'Return at most three compact bullet points and 150 words.',
        'Explicitly label statements as Observation, Inference, or Next test.',
      ].join(' '),
      prompt: `${observation}\n\nRequested lens: ${LENSES[lens]}`,
      temperature: 0.2,
      maxOutputTokens: 240,
    })

    return json({ commentary: result.text, model: MODEL, lens, observation }, 200, true)
  } catch (error) {
    console.error('AI Gateway request failed', error)
    return json({ error: 'The research interlocutor is temporarily unavailable; the deterministic experiment remains valid.' }, 503)
  }
}
