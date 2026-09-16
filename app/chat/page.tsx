'use client'

import { ChatPanel } from '@/components/ChatPanel'
import { useLang } from '@/components/LangProvider'
import { t } from '@/lib/i18n'

export default function ChatPage() {
  const { lang } = useLang()

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, 'chatTitle')}</h1>
      <p className="mb-6 mt-1.5 text-ink-soft">{t(lang, 'intro')}</p>
      <ChatPanel />
    </div>
  )
}
