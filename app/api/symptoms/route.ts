import { aiError, checkEmergency, checkSymptoms, EMERGENCY_RESPONSE, isLang } from '@/lib/ai'
import { logQuery } from '@/lib/db'

export const maxDuration = 30

export async function POST(request: Request) {
  let body: {
    symptoms?: string[]
    details?: string
    duration?: string
    ageBand?: string
    language?: string
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const symptoms = Array.isArray(body.symptoms) ? body.symptoms.slice(0, 15) : []
  const details = (body.details ?? '').slice(0, 500)
  const duration = body.duration || 'not specified'
  const ageBand = body.ageBand || 'not specified'
  const language = isLang(body.language) ? body.language : 'en'

  if (symptoms.length === 0 && !details) {
    return Response.json({ error: 'Select at least one symptom' }, { status: 400 })
  }

  const summary = [...symptoms, details].filter(Boolean).join(', ')

  if (checkEmergency(summary)) {
    await logQuery('symptom', summary, language, ['emergency'])
    return Response.json({ content: EMERGENCY_RESPONSE[language], emergency: true })
  }

  try {
    const content = await checkSymptoms({ symptoms, details, duration, ageBand }, language)
    await logQuery('symptom', summary, language)
    return Response.json({ content, emergency: false })
  } catch (err) {
    console.error('[api/symptoms]', (err as Error).message)
    const { status, error } = aiError(err)
    return Response.json({ error }, { status })
  }
}
