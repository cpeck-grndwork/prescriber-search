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
      <body>
        {children}
        <footer style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
          This website is based on Medicare Part D prescriber records found{' '}
          <a href="https://data.cms.gov/provider-summary-by-type-of-service/medicare-part-d-prescribers/medicare-part-d-prescribers-by-provider" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            here
          </a>
          {' '}and is intended to provide a simple interface for anyone to view this publicly available data.
        </footer>
      </body>
    </html>
  )
}
