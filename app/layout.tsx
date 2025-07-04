import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Local Firewood',
  description: 'Find local firewood stands near you. Support local suppliers through honor-system roadside stands.',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
