import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pump.fun Trading Analytics',
  description: 'Real-time RSI monitoring dashboard for pump.fun tokens',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}