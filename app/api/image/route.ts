import {
  aiError,
  checkEmergency,
  EMERGENCY_RESPONSE,
  isLang,
  streamImageAnalysis,
} from '@/lib/ai'
import { logQuery } from '@/lib/db'

export const maxDuration = 30

// Vercel caps request bodies at 4.5 MB and Netlify at 6 MB. The browser
// downscales before upload, but reject anything oversized here too rather than
// failing opaquely at the platform layer.
const MAX_IMAGE_BYTES = 3_000_000

export async function POST(request: Request) {
  let body: { image?: string; description?: string; language?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { image } = body
  const description = (body.description ?? '').slice(0, 500)
  const language = isLang(body.language) ? body.language : 'en'

  if (!image?.startsWith('data:image/')) {
    return Response.json({ error: 'No image provided' }, { status: 400 })
  }
  if (image.length > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: 'Image is too large. Please use a smaller photo.' },
      { status: 413 },
    )
  }

  if (description && checkEmergency(description)) {
    await logQuery('image', description, language, ['emergency'])
    return new Response(EMERGENCY_RESPONSE[language], {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Emergency': '1' },
    })
  }

  try {
    const stream = await streamImageAnalysis(image, description, language)
    await logQuery('image', description || '(photo, no description)', language)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[api/image]', (err as Error).message)
    const { status, error } = aiError(err)
    return Response.json({ error }, { status })
  }
}
