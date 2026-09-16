import type { Metadata, Viewport } from 'next'
import {
  Noto_Sans,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Telugu,
} from 'next/font/google'
import { LangProvider } from '@/components/LangProvider'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

/**
 * Four scripts, four faces. A single Latin display font would fall back to
 * whatever the device happens to have the moment someone switches to Kannada,
 * which on a cheap Android phone is often nothing good. Noto is the only
 * family with matching weights across all four.
 */
const latin = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-latin',
  display: 'swap',
})
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-deva',
  display: 'swap',
})
const kannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-knda',
  display: 'swap',
})
const telugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-telu',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SwasthyaAI — Health answers in your language',
  description:
    'Free multilingual health information for India. Ask a question, send a photo, or check your symptoms in English, Hindi, Kannada, or Telugu.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b6b53' },
    { media: '(prefers-color-scheme: dark)', color: '#0a120f' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  const fonts = `${latin.variable} ${devanagari.variable} ${kannada.variable} ${telugu.variable}`

  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
        >
          Skip to content
        </a>
        <LangProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </LangProvider>
      </body>
    </html>
  )
}
