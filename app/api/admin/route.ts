import { checkPassword, denied, isAdmin, signIn, signOut } from '@/lib/admin'
import { dbReady, getStats, listQueries } from '@/lib/db'

// GET — dashboard data. Gated, unlike the original project where admin reads
// were public and exposed everyone's health questions.
export async function GET() {
  if (!(await isAdmin())) return denied()

  try {
    const [stats, queries] = await Promise.all([getStats(), listQueries(100)])
    return Response.json({ stats, queries, dbReady })
  } catch (err) {
    console.error('[api/admin GET]', (err as Error).message)
    return Response.json({ error: 'Could not load dashboard' }, { status: 500 })
  }
}

// POST — log in.
export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string }

  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: 'ADMIN_PASSWORD is not configured on the server.' },
      { status: 500 },
    )
  }
  if (!password || !checkPassword(password)) {
    return Response.json({ error: 'Wrong password' }, { status: 401 })
  }

  await signIn()
  return Response.json({ ok: true })
}

// DELETE — log out.
export async function DELETE() {
  await signOut()
  return Response.json({ ok: true })
}
