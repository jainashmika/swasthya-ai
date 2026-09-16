'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DISCLAIMER } from '@/lib/ai'
import { t } from '@/lib/i18n'
import { PhoneIcon } from './Icons'
import { useLang } from './LangProvider'

export function SiteFooter() {
  const { lang } = useLang()
  const path = usePathname()

  if (path.startsWith('/admin')) return null

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            {DISCLAIMER[lang]}
          </p>

          <a
            href="tel:108"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-xl border-2 border-danger-edge bg-danger-soft px-4 py-3 font-semibold text-danger transition hover:brightness-95"
          >
            <PhoneIcon className="h-5 w-5" />
            {t(lang, 'callNow')}
          </a>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-line pt-5 text-xs text-ink-faint">
          <span>{t(lang, 'appName')}</span>
          <Link href="/admin" className="transition hover:text-ink">
            {t(lang, 'admin')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
