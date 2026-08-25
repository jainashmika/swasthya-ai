'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LANGUAGES } from '@/lib/ai'
import { t } from '@/lib/i18n'
import { useLang } from './LangProvider'

export function SiteHeader() {
  const { lang, setLang } = useLang()
  const path = usePathname()

  if (path.startsWith('/admin')) return null

  const links = [
    { href: '/chat', label: t(lang, 'navChat') },
    { href: '/symptoms', label: t(lang, 'navSymptoms') },
    { href: '/alerts', label: t(lang, 'navAlerts') },
  ]

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-accent">
          {t(lang, 'appName')}
        </Link>

        <nav className="flex gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                path === l.href
                  ? 'font-medium text-foreground'
                  : 'text-muted hover:text-foreground'
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          aria-label="Language"
          className="ml-auto rounded-md border border-line bg-surface px-2 py-1 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
