import type { Metadata } from 'next'
import './globals.css'
import { VersionFooter } from '@/components/version-footer'

export const metadata: Metadata = {
  title: 'Local Firewood',
  description: 'Find local firewood stands near you. Support local suppliers through honor-system roadside stands.',
  generator: 'v0.dev',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/favicon.svg',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/favicon-light.svg',
      media: '(prefers-color-scheme: dark)',
    },
    {
      rel: 'shortcut icon',
      url: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      url: '/favicon.svg',
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <VersionFooter />
        </div>
      </body>
    </html>
  )
}