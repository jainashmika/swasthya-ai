'use client'

import { useState } from 'react'
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

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">{t(lang, 'symptomsTitle')}</h1>

        <div
          className={
            result.emergency
              ? 'rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950/40 dark:text-red-200'
              : 'rounded-xl border border-line bg-surface p-4'
          }
        >
          {result.emergency && (
            <strong className="mb-2 block uppercase tracking-wide">
              {t(lang, 'emergency')}
            </strong>
          )}
          <div className="answer text-sm">{result.content}</div>
        </div>

        {!result.emergency && <p className="mt-3 text-xs text-muted">{DISCLAIMER[lang]}</p>}

        <button
          onClick={reset}
          className="mt-5 rounded-lg border border-line px-4 py-2 text-sm hover:bg-accent-soft"
        >
          {t(lang, 'startOver')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">{t(lang, 'symptomsTitle')}</h1>
      <p className="mb-6 text-sm text-muted">{t(lang, 'symptomsIntro')}</p>

      <form onSubmit={submit} className="space-y-6">
        <fieldset>
          <legend className="mb-2 font-medium">{t(lang, 'selectSymptoms')}</legend>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const on = selected.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    on
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-surface hover:border-accent'
                  }`}
                >
                  {s.label[lang]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block font-medium">{t(lang, 'otherDetails')}</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t(lang, 'otherPlaceholder')}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-medium">{t(lang, 'duration')}</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label[lang]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">{t(lang, 'ageGroup')}</span>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
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
          disabled={busy || (selected.length === 0 && !details.trim())}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white disabled:opacity-40"
        >
          {busy ? t(lang, 'checking') : t(lang, 'checkNow')}
        </button>
      </form>
    </div>
  )
}
