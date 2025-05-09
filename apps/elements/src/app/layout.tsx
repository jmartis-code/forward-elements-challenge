import "@fwd/ui/globals.css"
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';



export const metadata = {
  title: 'Welcome to elements',
  description: 'Generated by create-nx-workspace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
