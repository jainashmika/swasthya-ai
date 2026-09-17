'use client'

import { useState } from 'react'
import { PhoneIcon, SymptomsIcon } from '@/components/Icons'
import { useLang } from '@/components/LangProvider'
import { DISCLAIMER } from '@/lib/ai'
import { AGE_BANDS, DURATIONS, SYMPTOMS, t } from '@/lib/i18n'

export default function SymptomsPage() {
  const { lang } = useLang()

  const [selected, setSelected] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [duration, setDuration] = useState(DURATIONS[1].value)
  const [ageBand, setAgeBand] = useState(AGE_BANDS[2].value)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ content: string; emergency: boolean } | null>(null)

  function toggle(value: string) {
    setSelected((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || (selected.length === 0 && !details.trim())) return

    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: selected, details, duration, ageBand, language: lang }),
      })
      const data = await res.json()
      setResult({
        content: data.content ?? data.error ?? t(lang, 'error'),
        emergency: Boolean(data.emergency),
      })
    } catch {
      setResult({ content: t(lang, 'error'), emergency: false })
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setSelected([])
    setDetails('')
    setResult(null)
  }

  const canSubmit = selected.length > 0 || details.trim().length > 0

  const fieldClass =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] outline-none transition focus:border-brand'

  // ── Result ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-5 text-2xl font-bold tracking-tight sm:text-3xl">
          {t(lang, 'symptomsTitle')}
        </h1>

        {result.emergency ? (
          <div role="alert" className="lift-in rounded-2xl border-2 border-danger-edge bg-danger-soft p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-danger">
              <PhoneIcon className="h-4 w-4" />
              {t(lang, 'emergency')}
            </p>
            <p className="answer font-medium">{result.content}</p>
            <p className="mt-2 text-sm text-ink-soft">{t(lang, 'emergencyHelp')}</p>
            <a
              href="tel:108"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-3 font-bold text-white transition hover:brightness-110"
            >
              <PhoneIcon className="h-5 w-5" />
              {t(lang, 'callNow')}
            </a>
          </div>
        ) : (
          <div className="glass glass-lit lift-in rounded-2xl p-5 shadow-(--shadow)">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand">
              <SymptomsIcon className="h-4 w-4" />
              {t(lang, 'resultTitle')}
            </h2>
            <div className="answer">{result.content}</div>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
              {DISCLAIMER[lang]}
            </p>
          </div>
        )}

        <button
          onClick={reset}
          className="mt-6 rounded-xl border border-line bg-surface px-5 py-2.5 font-medium transition hover:border-brand-edge hover:bg-brand-soft hover:text-brand"
        >
          {t(lang, 'startOver')}
        </button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t(lang, 'symptomsTitle')}
      </h1>
      <p className="mb-7 mt-1.5 text-ink-soft">{t(lang, 'symptomsIntro')}</p>

      <form onSubmit={submit} className="space-y-7">
        <fieldset>
          <legend className="mb-3 font-semibold">{t(lang, 'selectSymptoms')}</legend>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = selected.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.value)}
                  className={`rounded-full border-2 px-4 py-2 text-[0.95rem] font-medium transition ${
                    on
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-line bg-surface text-ink-soft hover:border-brand-edge hover:text-ink'
                  }`}
                >
                  {s.label[lang]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2.5 block font-semibold">{t(lang, 'otherDetails')}</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t(lang, 'otherPlaceholder')}
            className={`${fieldClass} resize-none placeholder:text-ink-faint`}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2.5 block font-semibold">{t(lang, 'duration')}</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={fieldClass}
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label[lang]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2.5 block font-semibold">{t(lang, 'ageGroup')}</span>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className={fieldClass}
            >
              {AGE_BANDS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label[lang]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-semibold text-brand-ink transition hover:bg-brand-hover disabled:opacity-35 sm:w-auto"
        >
          {busy ? (
            <>
              <span className="flex gap-1.5">
                <i className="dot" />
                <i className="dot" />
                <i className="dot" />
              </span>
              {t(lang, 'checking')}
            </>
          ) : (
            <>
              <SymptomsIcon className="h-5 w-5" />
              {t(lang, 'checkNow')}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
