import { neon } from '@neondatabase/serverless'

/**
 * Raw SQL over Neon. No ORM.
 *
 * If DATABASE_URL is not set the app still runs — reads return empty, writes
 * are no-ops. That way you can develop the chatbot with only an OpenAI key.
 */

const url = process.env.DATABASE_URL
const sql = url ? neon(url) : null

export const dbReady = Boolean(sql)

export type Alert = {
  id: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  region: string
  is_active: boolean
  created_at: string
}

export type Query = {
  id: number
  kind: 'chat' | 'symptom' | 'image'
  text: string | null
  language: string
  flags: string[]
  created_at: string
}

// ─── Queries (the activity log that feeds the admin panel) ──────────────────

export async function logQuery(
  kind: Query['kind'],
  text: string,
  language: string,
  flags: string[] = [],
) {
  if (!sql) return
  try {
    await sql`
      insert into queries (kind, text, language, flags)
      values (${kind}, ${text.slice(0, 1000)}, ${language}, ${flags})
    `
  } catch (err) {
    // Logging must never break a user-facing response.
    console.error('[db] logQuery failed:', (err as Error).message)
  }
}

export async function listQueries(limit = 100): Promise<Query[]> {
  if (!sql) return []
  return (await sql`
    select * from queries order by created_at desc limit ${limit}
  `) as Query[]
}

export async function getStats() {
  if (!sql) {
    return { total: 0, today: 0, emergencies: 0, byLanguage: [], byKind: [] }
  }
  const [totals] = (await sql`
    select
      count(*)::int                                                    as total,
      count(*) filter (where created_at > now() - interval '1 day')::int as today,
      count(*) filter (where 'emergency' = any(flags))::int             as emergencies
    from queries
  `) as { total: number; today: number; emergencies: number }[]

  const byLanguage = (await sql`
    select language, count(*)::int as count from queries
    group by language order by count desc
  `) as { language: string; count: number }[]

  const byKind = (await sql`
    select kind, count(*)::int as count from queries
    group by kind order by count desc
  `) as { kind: string; count: number }[]

  return { ...totals, byLanguage, byKind }
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function listAlerts(region?: string, includeInactive = false): Promise<Alert[]> {
  if (!sql) return []
  if (region && region !== 'All India') {
    return (await sql`
      select * from alerts
      where (${includeInactive} or is_active)
        and (region = ${region} or region = 'All India')
      order by created_at desc
    `) as Alert[]
  }
  return (await sql`
    select * from alerts
    where (${includeInactive} or is_active)
    order by created_at desc
  `) as Alert[]
}

export async function createAlert(a: Omit<Alert, 'id' | 'created_at' | 'is_active'>) {
  if (!sql) throw new Error('DATABASE_URL is not configured')
  const [row] = (await sql`
    insert into alerts (severity, title, message, region)
    values (${a.severity}, ${a.title}, ${a.message}, ${a.region})
    returning *
  `) as Alert[]
  return row
}

export async function updateAlert(id: number, a: Partial<Alert>) {
  if (!sql) throw new Error('DATABASE_URL is not configured')
  const [row] = (await sql`
    update alerts set
      severity  = coalesce(${a.severity ?? null}, severity),
      title     = coalesce(${a.title ?? null}, title),
      message   = coalesce(${a.message ?? null}, message),
      region    = coalesce(${a.region ?? null}, region),
      is_active = coalesce(${a.is_active ?? null}, is_active)
    where id = ${id}
    returning *
  `) as Alert[]
  return row ?? null
}

export async function deleteAlert(id: number) {
  if (!sql) throw new Error('DATABASE_URL is not configured')
  await sql`delete from alerts where id = ${id}`
}
