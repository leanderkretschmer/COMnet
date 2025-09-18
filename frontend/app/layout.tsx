import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'COMNet - Dezentrale Social-Media-Plattform',
  description: 'Eine dezentrale, offene und modulare Social-Media-Plattform, die an Reddit angelehnt ist, aber vollständig Open Source und föderiert/dezentral funktioniert.',
  keywords: ['social media', 'dezentral', 'federiert', 'open source', 'community'],
  authors: [{ name: 'COMNet Team' }],
  openGraph: {
    title: 'COMNet - Dezentrale Social-Media-Plattform',
    description: 'Eine dezentrale, offene und modulare Social-Media-Plattform',
    type: 'website',
    locale: 'de_DE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
