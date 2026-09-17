'use client'

import Link from 'next/link'
import { ChatPanel } from '@/components/ChatPanel'
import { Heartbeat } from '@/components/Heartbeat'
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
      <section className="relative isolate overflow-hidden border-b border-line bg-hero text-hero-ink">
        {/* Drifting light behind the glass. Transform-only, so it stays cheap. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span
            className="orb orb-a"
            style={{ background: 'var(--orb-a)', width: 420, height: 420, top: -140, left: -80 }}
          />
          <span
            className="orb orb-b"
            style={{ background: 'var(--orb-b)', width: 360, height: 360, top: 40, right: -100 }}
          />
          <span
            className="orb orb-c"
            style={{ background: 'var(--orb-c)', width: 300, height: 300, bottom: -110, left: '38%' }}
          />
        </div>

        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <p className="glass-on-dark glass-lit lift-in mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide">
            <ShieldIcon className="h-4 w-4" />
            {t(lang, 'noSignup')}
          </p>

          <h1
            className="lift-in max-w-2xl text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl"
            style={{ animationDelay: '60ms' }}
          >
            {t(lang, 'tagline')}
          </h1>

          <p
            className="lift-in mt-4 max-w-xl text-base leading-relaxed text-hero-ink/85 sm:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            {t(lang, 'intro')}
          </p>

          <div className="lift-in mt-7 flex flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
            <Link
              href="/chat"
              className="pulse-ring inline-flex items-center gap-2 rounded-xl bg-hero-cta px-5 py-3 font-semibold text-hero-cta-ink transition hover:brightness-95"
            >
              <ChatIcon className="h-5 w-5" />
              {t(lang, 'openChat')}
            </Link>
            <Link
              href="/symptoms"
              className="glass-on-dark glass-lit hover-lift inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold"
            >
              <SymptomsIcon className="h-5 w-5" />
              {t(lang, 'openSymptoms')}
            </Link>
          </div>

          <ul
            className="lift-in mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-hero-line pt-5 text-sm text-hero-ink/75"
            style={{ animationDelay: '240ms' }}
          >
            {LANGUAGES.map((l) => (
              <li key={l.code}>{l.label}</li>
            ))}
          </ul>
        </div>

        {/* Live trace along the base of the hero. */}
        <Heartbeat className="absolute inset-x-0 bottom-0 h-14 w-full text-hero-ink/35" speed={7} />
      </section>

      {/* ── Try it immediately ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <ChatPanel compact />
      </section>

      {/* ── What else it does ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {actions.map(({ href, Icon, title, body }, i) => (
            <Link
              key={href}
              href={href}
              className="glass glass-lit hover-lift lift-in group rounded-2xl p-5"
              style={{ animationDelay: `${i * 80}ms` }}
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
