'use client'

import { ChatPanel } from '@/components/ChatPanel'
import { useLang } from '@/components/LangProvider'
import { t } from '@/lib/i18n'

export default function ChatPage() {
  const { lang } = useLang()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">{t(lang, 'chatTitle')}</h1>
      <p className="mb-5 text-sm text-muted">{t(lang, 'intro')}</p>
      <ChatPanel />
    </div>
  )
}
