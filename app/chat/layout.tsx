import type React from "react"
import { MCPProvider } from "@/lib/context/mcp-context"

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background font-space-grotesk antialiased">
      <MCPProvider>
        {children}
      </MCPProvider>
    </div>
  )
}
