"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Zen0Icon } from "@/components/ui/zen0-icon"

export function Header() {
  const pathname = usePathname()
  
  // Hide header on chat page
  if (pathname?.startsWith("/chat")) {
    return null
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-neutral-800 hover:text-neutral-900 transition-colors">
            <Zen0Icon className="text-neutral-800" size={28} />
            zen0
          </Link>

          <nav className="hidden sm:flex items-center gap-6 lg:gap-8">
            <Link href="/#features" className="text-gray-600 hover:text-neutral-800 transition-colors text-sm">
              Features
            </Link>
            <Link href="/chat" className="text-gray-600 hover:text-neutral-800 transition-colors text-sm">
              Chat
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild {...({ size: "sm" } as any)} className="h-8 sm:h-9 text-xs sm:text-sm bg-neutral-800 hover:bg-neutral-900">
              <Link href="/chat">Start Chatting</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
