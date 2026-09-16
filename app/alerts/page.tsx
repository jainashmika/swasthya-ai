'use client'

import { useEffect, useState } from 'react'
import { AlertIcon, GlobeIcon } from '@/components/Icons'
import { useLang } from '@/components/LangProvider'
import type { Alert } from '@/lib/db'
import { REGIONS, t } from '@/lib/i18n'

/** Severity reads as colour first, text second — it has to scan at a glance. */
const SEVERITY: Record<string, { chip: string; stripe: string }> = {
  critical: {
    chip: 'bg-danger-soft text-danger border-danger-edge',
    stripe: 'bg-danger',
  },
  high: {
    chip: 'bg-warn-soft text-warn border-warn-edge',
    stripe: 'bg-warn',
  },
  medium: {
    chip: 'bg-info-soft text-info border-transparent',
    stripe: 'bg-info',
  },
  low: {
    chip: 'bg-brand-soft text-brand border-transparent',
    stripe: 'bg-brand',
  },
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
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, 'alertsTitle')}</h1>
      <p className="mb-6 mt-1.5 text-ink-soft">{t(lang, 'alertsIntro')}</p>

      <div className="relative mb-7 inline-block">
        <GlobeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t(lang, 'allRegions')}
          className="appearance-none rounded-xl border border-line bg-surface py-2.5 pl-9 pr-9 text-[0.95rem] font-medium outline-none transition hover:border-line-strong focus:border-brand"
        >
          <option value="">{t(lang, 'allRegions')}</option>
          {REGIONS.filter((r) => r !== 'All India').map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint"
        >
          ▾
        </span>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-surface-2" />
          ))}
        </ul>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink-faint">
            <AlertIcon className="h-6 w-6" />
          </span>
          <p className="text-ink-soft">{t(lang, 'noAlerts')}</p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {alerts.map((a) => {
            const style = SEVERITY[a.severity] ?? SEVERITY.medium
            return (
              <li
                key={a.id}
                className="rise flex overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow)"
              >
                <span aria-hidden className={`w-1.5 shrink-0 ${style.stripe}`} />
                <div className="min-w-0 flex-1 p-4.5">
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${style.chip}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-xs font-medium text-ink-soft">{a.region}</span>
                    <time
                      dateTime={a.created_at}
                      className="ml-auto text-xs tabular-nums text-ink-faint"
                    >
                      {new Date(a.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  <h2 className="font-semibold leading-snug text-ink">{a.title}</h2>
                  <p className="mt-1.5 text-[0.93rem] leading-relaxed text-ink-soft">{a.message}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
