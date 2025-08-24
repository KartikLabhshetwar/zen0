import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  metadataBase: new URL("https://zen0.vercel.app"),
  title: "zen0 - AI Chat with Memory",
  description:
    "AI conversations with perfect memory. Connect your preferred models and experience intelligent dialogue that remembers every detail.",
  keywords: ["AI", "chat", "memory", "conversation", "artificial intelligence", "chatbot"],
  authors: [{ name: "zen0" }],
  creator: "zen0",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "zen0",
    description: "AI conversations with perfect memory",
    url: "https://zen0.vercel.app",
    siteName: "zen0",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "zen0",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "zen0",
    description: "AI conversations with perfect memory",
    images: ["/og-image.png"],
    creator: "@zen0app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
