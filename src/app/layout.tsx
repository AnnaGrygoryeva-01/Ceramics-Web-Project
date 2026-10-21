import type { Metadata } from 'next'
import CornerDecorations from '@/components/CornerDecorations'
import Header from '@/components/Header'
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
    <html lang='en'>
      <body>
        <CornerDecorations />
        <Header />
        <main>{children}</main>
        <footer>
          <p>&copy; Handmade Ceramics</p>
        </footer>
      </body>
    </html>
  )
}
