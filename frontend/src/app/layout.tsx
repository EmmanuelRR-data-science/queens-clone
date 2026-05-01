import './globals.css'

export const metadata = {
  title: 'Queens Clone',
  description: 'Master of Logic & Strategy',
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
