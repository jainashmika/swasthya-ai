import { denied, isAdmin } from '@/lib/admin'
import { createAlert, deleteAlert, listAlerts, updateAlert, type Alert } from '@/lib/db'

const SEVERITIES = ['critical', 'high', 'medium', 'low']

// GET — public. Admins additionally see inactive alerts.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') ?? undefined
  const includeInactive = searchParams.get('all') === '1' && (await isAdmin())

  try {
    return Response.json({ alerts: await listAlerts(region, includeInactive) })
  } catch (err) {
    console.error('[api/alerts GET]', (err as Error).message)
    return Response.json({ error: 'Could not load alerts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return denied()

  const body = (await request.json().catch(() => ({}))) as Partial<Alert>
  const title = body.title?.trim()
  const message = body.message?.trim()

  if (!title || !message) {
    return Response.json({ error: 'Title and message are required' }, { status: 400 })
  }

  try {
    const alert = await createAlert({
      title,
      message,
      severity: SEVERITIES.includes(body.severity as string)
        ? (body.severity as Alert['severity'])
        : 'medium',
      region: body.region?.trim() || 'All India',
    })
    return Response.json({ alert }, { status: 201 })
  } catch (err) {
    console.error('[api/alerts POST]', (err as Error).message)
    return Response.json({ error: 'Could not create alert' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return denied()

  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const body = (await request.json().catch(() => ({}))) as Partial<Alert>

  try {
    const alert = await updateAlert(id, body)
    if (!alert) return Response.json({ error: 'Alert not found' }, { status: 404 })
    return Response.json({ alert })
  } catch (err) {
    console.error('[api/alerts PUT]', (err as Error).message)
    return Response.json({ error: 'Could not update alert' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return denied()

  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  try {
    await deleteAlert(id)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[api/alerts DELETE]', (err as Error).message)
    return Response.json({ error: 'Could not delete alert' }, { status: 500 })
  }
}
