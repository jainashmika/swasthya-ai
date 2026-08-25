'use client'

import { useEffect, useRef, useState } from 'react'
import { DISCLAIMER } from '@/lib/ai'
import { t } from '@/lib/i18n'
import { resizeImage } from '@/lib/resize-image'
import { useLang } from './LangProvider'

type Message = {
  role: 'user' | 'assistant'
  content: string
  image?: string
  emergency?: boolean
}

const STORAGE_KEY = 'swasthya_chat'

export function ChatPanel({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // History lives in the browser — no accounts, nothing stored server-side.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setMessages(JSON.parse(saved))
    } catch {
      // corrupt or unavailable storage — start fresh
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      // Photos are dropped from storage — they'd blow the quota immediately.
      const slim = messages.slice(-40).map(({ image, ...m }) => m)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
    } catch {
      // over quota — not worth interrupting the user for
    }
  }, [messages, loaded])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    try {
      setPhoto(await resizeImage(file))
    } catch {
      setPhoto(null)
    }
  }

  async function send() {
    const text = input.trim()
    if ((!text && !photo) || busy) return

    const outgoing: Message = { role: 'user', content: text, image: photo ?? undefined }
    const history = [...messages, outgoing]
    setMessages(history)
    setInput('')
    setBusy(true)

    const sentPhoto = photo
    setPhoto(null)
    if (fileRef.current) fileRef.current.value = ''

    try {
      if (sentPhoto) {
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: sentPhoto, description: text, language: lang }),
        })
        const data = await res.json()
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: data.content ?? data.error ?? t(lang, 'error'),
            emergency: Boolean(data.emergency),
          },
        ])
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            language: lang,
          }),
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}))
          setMessages((m) => [
            ...m,
            { role: 'assistant', content: data.error ?? t(lang, 'error') },
          ])
        } else {
          const emergency = res.headers.get('X-Emergency') === '1'
          setMessages((m) => [...m, { role: 'assistant', content: '', emergency }])

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let acc = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            acc += decoder.decode(value, { stream: true })
            setMessages((m) => {
              const copy = [...m]
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: acc }
              return copy
            })
          }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t(lang, 'error') }])
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface">
      <div
        className={`flex-1 space-y-4 overflow-y-auto p-4 ${compact ? 'h-80' : 'h-[60vh]'}`}
      >
        {messages.length === 0 && (
          <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">{t(lang, 'greeting')}</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            {m.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.image}
                alt=""
                className="ml-auto mb-2 max-h-40 rounded-lg border border-line"
              />
            )}

            <div
              className={
                m.role === 'user'
                  ? 'inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-left text-sm text-white'
                  : m.emergency
                    ? 'rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200'
                    : 'answer text-sm'
              }
            >
              {m.emergency && (
                <strong className="mb-1 block uppercase tracking-wide">
                  {t(lang, 'emergency')}
                </strong>
              )}
              {m.content || (busy && i === messages.length - 1 ? t(lang, 'thinking') : '')}
            </div>

            {m.role === 'assistant' && m.content && !m.emergency && (
              <p className="mt-1 text-xs text-muted">{DISCLAIMER[lang]}</p>
            )}
          </div>
        ))}

        {busy && messages.at(-1)?.role === 'user' && (
          <p className="text-sm text-muted">{t(lang, 'thinking')}</p>
        )}

        <div ref={endRef} />
      </div>

      {photo && (
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-10 w-10 rounded object-cover" />
          <span className="text-muted">{t(lang, 'photoAttached')}</span>
          <button
            type="button"
            onClick={() => {
              setPhoto(null)
              if (fileRef.current) fileRef.current.value = ''
            }}
            className="ml-auto text-accent hover:underline"
          >
            {t(lang, 'remove')}
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title={t(lang, 'attachPhoto')}
          aria-label={t(lang, 'attachPhoto')}
          className="rounded-lg border border-line px-3 py-2 text-lg leading-none hover:bg-accent-soft"
        >
          +
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, 'chatPlaceholder')}
          className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={busy || (!input.trim() && !photo)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? '…' : t(lang, 'send')}
        </button>
      </form>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="border-t border-line py-2 text-xs text-muted hover:text-foreground"
        >
          {t(lang, 'clearChat')}
        </button>
      )}
    </div>
  )
}
