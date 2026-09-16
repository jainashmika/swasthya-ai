'use client'

import { useEffect, useRef, useState } from 'react'
import { DISCLAIMER } from '@/lib/ai'
import { SUGGESTIONS, t } from '@/lib/i18n'
import { resizeImage } from '@/lib/resize-image'
import { CameraIcon, CloseIcon, PhoneIcon, SendIcon, SparkIcon } from './Icons'
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
  const boxRef = useRef<HTMLTextAreaElement>(null)
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

  /** Grow the box with the question instead of scrolling a one-line input. */
  function autoGrow() {
    const el = boxRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    try {
      setPhoto(await resizeImage(file))
    } catch {
      setPhoto(null)
    }
  }

  async function send(preset?: string) {
    const text = (preset ?? input).trim()
    if ((!text && !photo) || busy) return

    const outgoing: Message = { role: 'user', content: text, image: photo ?? undefined }
    const history = [...messages, outgoing]
    setMessages(history)
    setInput('')
    setBusy(true)
    requestAnimationFrame(autoGrow)

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
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // storage unavailable
    }
  }

  const empty = messages.length === 0
  const waiting = busy && messages.at(-1)?.role === 'user'

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow)">
      {/* ── Conversation ─────────────────────────────────────────────── */}
      <div
        className={`scroll-soft flex-1 space-y-5 overflow-y-auto p-5 ${
          compact ? 'h-[22rem]' : 'h-[58vh] min-h-[24rem]'
        }`}
      >
        {empty && (
          <div className="rise">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
              >
                <SparkIcon className="h-5 w-5" />
              </span>
              <p className="rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3 text-[0.95rem] leading-relaxed">
                {t(lang, 'greeting')}
              </p>
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {t(lang, 'tryAsking')}
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS[lang].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-sm text-ink-soft transition hover:border-brand-edge hover:bg-brand-soft hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const streaming = busy && i === messages.length - 1 && m.role === 'assistant'

          if (m.role === 'user') {
            return (
              <div key={i} className="rise flex flex-col items-end gap-2">
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt=""
                    className="max-h-44 rounded-2xl border border-line object-cover"
                  />
                )}
                {m.content && (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-[0.95rem] text-brand-ink">
                    {m.content}
                  </p>
                )}
              </div>
            )
          }

          if (m.emergency) {
            return (
              <div
                key={i}
                role="alert"
                className="rise rounded-2xl border-2 border-danger-edge bg-danger-soft p-4"
              >
                <p className="mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-danger">
                  <PhoneIcon className="h-4 w-4" />
                  {t(lang, 'emergency')}
                </p>
                <p className="answer text-[0.97rem] font-medium text-ink">{m.content}</p>
                <a
                  href="tel:108"
                  className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-3 font-bold text-white transition hover:brightness-110"
                >
                  <PhoneIcon className="h-5 w-5" />
                  {t(lang, 'callNow')}
                </a>
              </div>
            )
          }

          return (
            <div key={i} className="rise flex items-start gap-3">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
              >
                <SparkIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                {m.content ? (
                  <p className="answer text-[0.95rem]">{m.content}</p>
                ) : (
                  streaming && (
                    <span
                      className="flex gap-1.5 py-2 text-ink-faint"
                      aria-label={t(lang, 'thinking')}
                    >
                      <i className="dot" />
                      <i className="dot" />
                      <i className="dot" />
                    </span>
                  )
                )}
                {m.content && !streaming && (
                  <p className="mt-2 border-l-2 border-line pl-2.5 text-xs leading-relaxed text-ink-faint">
                    {DISCLAIMER[lang]}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {waiting && (
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
            >
              <SparkIcon className="h-5 w-5" />
            </span>
            <span className="flex gap-1.5 py-3 text-ink-faint" aria-label={t(lang, 'thinking')}>
              <i className="dot" />
              <i className="dot" />
              <i className="dot" />
            </span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Photo preview ────────────────────────────────────────────── */}
      {photo && (
        <div className="flex items-center gap-3 border-t border-line bg-surface-2 px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-11 w-11 rounded-lg object-cover" />
          <span className="text-sm font-medium text-ink-soft">{t(lang, 'photoAttached')}</span>
          <button
            type="button"
            onClick={() => {
              setPhoto(null)
              if (fileRef.current) fileRef.current.value = ''
            }}
            aria-label={t(lang, 'remove')}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition hover:bg-surface hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="flex items-end gap-2 border-t border-line p-3"
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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition hover:border-brand-edge hover:bg-brand-soft hover:text-brand"
        >
          <CameraIcon className="h-5 w-5" />
        </button>

        <textarea
          ref={boxRef}
          value={input}
          rows={1}
          onChange={(e) => {
            setInput(e.target.value)
            autoGrow()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder={t(lang, 'chatPlaceholder')}
          className="min-w-0 flex-1 resize-none rounded-xl border border-line bg-paper px-4 py-2.5 text-[0.95rem] leading-relaxed outline-none transition placeholder:text-ink-faint focus:border-brand"
        />

        <button
          type="submit"
          disabled={busy || (!input.trim() && !photo)}
          aria-label={t(lang, 'send')}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink transition hover:bg-brand-hover disabled:opacity-35"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </form>

      {!empty && (
        <button
          type="button"
          onClick={clear}
          className="border-t border-line py-2.5 text-xs font-medium text-ink-faint transition hover:bg-surface-2 hover:text-ink"
        >
          {t(lang, 'newChat')}
        </button>
      )}
    </div>
  )
}
