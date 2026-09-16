'use client'

import Link from 'next/link'
import { ChatPanel } from '@/components/ChatPanel'
import { AlertIcon, ChatIcon, ShieldIcon, SymptomsIcon } from '@/components/Icons'
import { useLang } from '@/components/LangProvider'
import { LANGUAGES } from '@/lib/ai'
import { t } from '@/lib/i18n'

export default function LandingPage() {
  const { lang } = useLang()

  const actions = [
    {
      href: '/chat',
      Icon: ChatIcon,
      title: t(lang, 'navChat'),
      body: t(lang, 'chatPlaceholder'),
    },
    {
      href: '/symptoms',
      Icon: SymptomsIcon,
      title: t(lang, 'symptomsTitle'),
      body: t(lang, 'symptomsIntro'),
    },
    {
      href: '/alerts',
      Icon: AlertIcon,
      title: t(lang, 'alertsTitle'),
      body: t(lang, 'alertsIntro'),
    },
  ]

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-hero text-hero-ink">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-hero-chip px-3.5 py-1.5 text-xs font-semibold tracking-wide">
            <ShieldIcon className="h-4 w-4" />
            {t(lang, 'noSignup')}
          </p>

          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            {t(lang, 'tagline')}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-hero-ink/85 sm:text-lg">
            {t(lang, 'intro')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-hero-cta px-5 py-3 font-semibold text-hero-cta-ink transition hover:brightness-95"
            >
              <ChatIcon className="h-5 w-5" />
              {t(lang, 'openChat')}
            </Link>
            <Link
              href="/symptoms"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-hero-line px-5 py-3 font-semibold transition hover:bg-hero-chip"
            >
              <SymptomsIcon className="h-5 w-5" />
              {t(lang, 'openSymptoms')}
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-hero-line pt-5 text-sm text-hero-ink/75">
            {LANGUAGES.map((l) => (
              <li key={l.code}>{l.label}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Try it immediately ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <ChatPanel compact />
      </section>

      {/* ── What else it does ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {actions.map(({ href, Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-brand-edge hover:shadow-(--shadow)"
            >
              <span className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-brand-ink">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
