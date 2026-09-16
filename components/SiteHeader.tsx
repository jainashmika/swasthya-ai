'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LANGUAGES } from '@/lib/ai'
import { t } from '@/lib/i18n'
import { AlertIcon, ChatIcon, GlobeIcon, SymptomsIcon } from './Icons'
import { useLang } from './LangProvider'

export function SiteHeader() {
  const { lang, setLang } = useLang()
  const path = usePathname()

  if (path.startsWith('/admin')) return null

  const links = [
    { href: '/chat', label: t(lang, 'navChat'), Icon: ChatIcon },
    { href: '/symptoms', label: t(lang, 'navSymptoms'), Icon: SymptomsIcon },
    { href: '/alerts', label: t(lang, 'navAlerts'), Icon: AlertIcon },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-base font-bold text-brand-ink"
          >
            स
          </span>
          {t(lang, 'appName')}
        </Link>

        {/* Desktop nav. On phones this collapses to the bottom bar below. */}
        <nav className="ml-4 hidden gap-1 sm:flex">
          {links.map(({ href, label, Icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="relative ml-auto">
          <GlobeIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label={t(lang, 'langLabel')}
            className="appearance-none rounded-lg border border-line bg-surface py-2 pl-8 pr-7 text-sm font-medium text-ink transition hover:border-line-strong"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint"
          >
            ▾
          </span>
        </div>
      </div>

      {/* Phone nav — thumb-reachable, icon-led, full-width targets. */}
      <nav className="flex border-t border-line sm:hidden">
        {links.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                active
                  ? 'border-b-2 border-brand text-brand'
                  : 'border-b-2 border-transparent text-ink-soft'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
