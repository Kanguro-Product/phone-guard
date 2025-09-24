import type React from "react"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { TutorialProvider } from "@/components/tutorial/tutorial-provider"

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: "Phone Number Manager",
  description: "Manage phone numbers for sales cadences with A/B testing and reputation monitoring",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TutorialProvider>{children}</TutorialProvider>
      </body>
    </html>
  )
}
