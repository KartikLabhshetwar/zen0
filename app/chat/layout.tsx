import type React from "react"

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {children}
    </div>
  )
}