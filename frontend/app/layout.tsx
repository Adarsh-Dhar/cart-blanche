import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Galactic Gateway | AI Shopping Concierge',
  description: 'Futuristic space-themed shopping with AI-powered commerce. Discover exclusive space gear and fashion.',
  keywords: 'shopping, AI, space, fashion, gear, e-commerce',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#141418',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          :root {
            color-scheme: dark;
          }
        `}</style>
      </head>
      <body className={`${geist.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
