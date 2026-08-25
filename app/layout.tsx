import type { Metadata } from 'next'
import Link from 'next/link'
import { LangProvider } from '@/components/LangProvider'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwasthyaAI — Health answers in your language',
  description:
    'Free multilingual health information for India. Ask a question, send a photo, or check your symptoms in English, Hindi, Kannada, or Telugu.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <LangProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
            <p>
              Health education only. Not a substitute for a doctor. In an emergency call{' '}
              <strong className="text-foreground">108</strong>.
            </p>
            <Link href="/admin" className="mt-2 inline-block hover:text-foreground">
              Admin
            </Link>
          </footer>
        </LangProvider>
      </body>
    </html>
  )
}
