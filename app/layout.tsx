import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SanityLive } from "@/sanity/lib/live"
import { ToastProvider } from "@/components/ui/toast"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Revolt Holiday Calendar",
  description: "Annual holiday calendar for Revolt",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
        <SanityLive />
        <Analytics />
      </body>
    </html>
  )
}
