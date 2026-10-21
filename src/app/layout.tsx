import type { Metadata } from 'next'
import CornerDecorations from '@/components/CornerDecorations'
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
          <p>&copy; Handmade Ceramics by Anna Grygoryeva</p>
        </footer>
      </body>
    </html>
  )
}
