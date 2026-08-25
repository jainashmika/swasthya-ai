'use client'

import Link from 'next/link'
import { ChatPanel } from '@/components/ChatPanel'
import { useLang } from '@/components/LangProvider'
import { t } from '@/lib/i18n'

export default function LandingPage() {
  const { lang } = useLang()

  const features = [
    { href: '/chat', title: t(lang, 'navChat'), body: t(lang, 'chatPlaceholder') },
    { href: '/symptoms', title: t(lang, 'symptomsTitle'), body: t(lang, 'symptomsIntro') },
    { href: '/alerts', title: t(lang, 'alertsTitle'), body: t(lang, 'alertsIntro') },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <section className="text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t(lang, 'tagline')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t(lang, 'intro')}</p>
        <p className="mt-4 text-sm text-muted">English · हिन्दी · ಕನ್ನಡ · తెలుగు</p>
      </section>

      <section className="mt-8">
        <ChatPanel compact />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-xl border border-line bg-surface p-4 transition hover:border-accent"
          >
            <h2 className="font-medium text-accent">{f.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-muted">{f.body}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
