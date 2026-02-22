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
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1832948711160952"
     crossOrigin="anonymous"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
