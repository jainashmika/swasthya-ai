'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Alert, Query } from '@/lib/db'
import { REGIONS } from '@/lib/i18n'

type Stats = {
  total: number
  today: number
  emergencies: number
  byLanguage: { language: string; count: number }[]
  byKind: { kind: string; count: number }[]
}

const BLANK = { title: '', message: '', severity: 'medium', region: 'All India' }

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [queries, setQueries] = useState<Query[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dbReady, setDbReady] = useState(true)

  const [draft, setDraft] = useState(BLANK)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAlerts = useCallback(async () => {
    const res = await fetch('/api/alerts?all=1')
    const data = await res.json()
    setAlerts(data.alerts ?? [])
  }, [])

  const load = useCallback(async () => {
    const res = await fetch('/api/admin')
    if (res.status === 401) {
      setAuthed(false)
      return
    }
    const data = await res.json()
    setStats(data.stats ?? null)
    setQueries(data.queries ?? [])
    setDbReady(data.dbReady !== false)
    setAuthed(true)
    await loadAlerts()
  }, [loadAlerts])

  useEffect(() => {
    void load()
  }, [load])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setPassword('')
      await load()
    } else {
      const data = await res.json().catch(() => ({}))
      setLoginError(data.error ?? 'Wrong password')
    }
  }

  async function logout() {
    await fetch('/api/admin', { method: 'DELETE' })
    setAuthed(false)
    setStats(null)
    setQueries([])
    setAlerts([])
  }

  async function saveAlert(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim() || !draft.message.trim() || saving) return

    setSaving(true)
    const url = editing ? `/api/alerts?id=${editing}` : '/api/alerts'
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    setDraft(BLANK)
    setEditing(null)
    setSaving(false)
    await loadAlerts()
  }

  async function toggleActive(a: Alert) {
    await fetch(`/api/alerts?id=${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !a.is_active }),
    })
    await loadAlerts()
  }

  async function remove(id: number) {
    if (!confirm('Delete this alert permanently?')) return
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
    await loadAlerts()
  }

  if (authed === null) {
    return <p className="p-8 text-sm text-ink-soft">Loading…</p>
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-1 text-xl font-semibold">Admin</h1>
        <p className="mb-6 text-sm text-ink-soft">Enter the admin password to continue.</p>

        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </button>
        </form>

        <Link href="/" className="mt-6 block text-center text-sm text-ink-soft hover:text-ink">
          ← Back to site
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          View site
        </Link>
        <button onClick={logout} className="ml-auto text-sm text-ink-soft hover:text-ink">
          Sign out
        </button>
      </div>

      {!dbReady && (
        <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          DATABASE_URL is not set, so alerts and the activity log are unavailable. The
          chatbot still works.
        </p>
      )}

      {/* Stats */}
      <section className="mb-10 grid grid-cols-3 gap-3">
        {[
          { label: 'Questions asked', value: stats?.total ?? 0 },
          { label: 'Last 24 hours', value: stats?.today ?? 0 },
          { label: 'Emergency flags', value: stats?.emergencies ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs text-ink-soft">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Alerts */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Health alerts</h2>

        <form onSubmit={saveAlert} className="mb-5 space-y-3 rounded-xl border border-line bg-surface p-4">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <textarea
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            placeholder="Message shown to the public"
            rows={3}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={draft.severity}
              onChange={(e) => setDraft({ ...draft, severity: e.target.value })}
              className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
            >
              {['critical', 'high', 'medium', 'low'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={draft.region}
              onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {editing ? 'Save changes' : 'Create alert'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null)
                  setDraft(BLANK)
                }}
                className="rounded-lg border border-line px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded-lg border border-line bg-surface p-3 text-sm ${
                a.is_active ? '' : 'opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{a.title}</span>
                <span className="text-xs text-ink-soft">
                  {a.severity} · {a.region} {a.is_active ? '' : '· inactive'}
                </span>
                <span className="ml-auto flex gap-3 text-xs">
                  <button
                    onClick={() => {
                      setEditing(a.id)
                      setDraft({
                        title: a.title,
                        message: a.message,
                        severity: a.severity,
                        region: a.region,
                      })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-brand hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => toggleActive(a)} className="hover:underline">
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => remove(a.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </span>
              </div>
              <p className="mt-1 text-ink-soft">{a.message}</p>
            </li>
          ))}
          {alerts.length === 0 && <li className="text-sm text-ink-soft">No alerts yet.</li>}
        </ul>
      </section>

      {/* Activity */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Recent questions</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Type</th>
                <th className="p-3">Lang</th>
                <th className="p-3">Question</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr
                  key={q.id}
                  className={`border-b border-line last:border-0 ${
                    q.flags?.includes('emergency')
                      ? 'bg-red-50 dark:bg-red-950/30'
                      : ''
                  }`}
                >
                  <td className="whitespace-nowrap p-3 text-xs text-ink-soft">
                    {new Date(q.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs">{q.kind}</td>
                  <td className="p-3 text-xs">{q.language}</td>
                  <td className="p-3">
                    {q.text}
                    {q.flags?.includes('emergency') && (
                      <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">
                        emergency
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {queries.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-sm text-ink-soft">
                    Nothing yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
