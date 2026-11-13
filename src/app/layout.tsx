import type { Metadata } from 'next'
import CornerDecorations from '@/components/CornerDecorations'
import Link from 'next/link'
import Header from '@/components/Header'
import { applyThemeScript } from '@/lib/theme'
import './globals.sass'

export const metadata: Metadata = {
  title: {
    default: 'Ceramics',
    template: '%s | Ceramics'
  },
  description: 'Handmade ceramic pieces'
}

export default function RootLayout ({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' data-theme='day' suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyThemeScript }} />
      </head>
      <body>
        <CornerDecorations />
        <Header />
        <main>{children}</main>
        <footer>
          <p>
            &copy; 2026 Anna Grygoryeva &middot; <Link href='/privacy'>Privacy</Link>
          </p>
        </footer>
      </body>
    </html>
  )
}
