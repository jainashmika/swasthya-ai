'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { isLang, type Lang } from '@/lib/ai'

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
}>({ lang: 'en', setLang: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    if (isLang(stored)) setLangState(stored)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return <LangContext value={{ lang, setLang }}>{children}</LangContext>
}

export const useLang = () => useContext(LangContext)
