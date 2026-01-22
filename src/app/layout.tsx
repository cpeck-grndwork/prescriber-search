import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Medicare Prescriber Search',
  description: 'Search Medicare Part D prescriber data',
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
