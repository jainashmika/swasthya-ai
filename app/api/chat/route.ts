import {
  aiError,
  checkEmergency,
  EMERGENCY_RESPONSE,
  isLang,
  streamChat,
  type ChatMessage,
} from '@/lib/ai'
import { logQuery } from '@/lib/db'

export const maxDuration = 30

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[]; language?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  const language = isLang(body.language) ? body.language : 'en'
  const latest = messages.filter((m) => m.role === 'user').at(-1)?.content?.trim()

  if (!latest) {
    return Response.json({ error: 'No message provided' }, { status: 400 })
  }
  if (latest.length > 2000) {
    return Response.json({ error: 'Message too long' }, { status: 400 })
  }

  // Safety first: emergencies short-circuit before the model is ever asked.
  if (checkEmergency(latest)) {
    await logQuery('chat', latest, language, ['emergency'])
    return new Response(EMERGENCY_RESPONSE[language], {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Emergency': '1' },
    })
  }

  try {
    const stream = await streamChat(messages, language)
    await logQuery('chat', latest, language)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[api/chat]', (err as Error).message)
    const { status, error } = aiError(err)
    return Response.json({ error }, { status })
  }
}
