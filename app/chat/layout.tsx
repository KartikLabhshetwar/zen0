import type React from "react"
import { cookies } from "next/headers"
import { MCPProvider } from "@/lib/context/mcp-context"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get sidebar state from cookies for persistence
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <div className="min-h-screen bg-background font-space-grotesk antialiased">
      <MCPProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          {children}
        </SidebarProvider>
      </MCPProvider>
    </div>
  )
}
