'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/components/LangProvider'
import type { Alert } from '@/lib/db'
import { REGIONS, t } from '@/lib/i18n'

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
}

export default function AlertsPage() {
  const { lang } = useLang()
  const [region, setRegion] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/alerts${region ? `?region=${encodeURIComponent(region)}` : ''}`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [region])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">{t(lang, 'alertsTitle')}</h1>
      <p className="mb-5 text-sm text-muted">{t(lang, 'alertsIntro')}</p>

      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="mb-6 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      >
        <option value="">{t(lang, 'allRegions')}</option>
        {REGIONS.filter((r) => r !== 'All India').map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {loading ? (
        <p className="text-sm text-muted">…</p>
      ) : alerts.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
          {t(lang, 'noAlerts')}
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                    SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.medium
                  }`}
                >
                  {a.severity}
                </span>
                <span className="text-xs text-muted">{a.region}</span>
                <span className="ml-auto text-xs text-muted">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="font-medium">{a.title}</h2>
              <p className="mt-1 text-sm text-muted">{a.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
