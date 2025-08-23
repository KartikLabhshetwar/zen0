"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700 transition-colors">
            zen0
          </Link>

          <nav className="flex items-center gap-8">
            <Link href="/#features" className="text-gray-600 hover:text-black transition-colors">
              Features
            </Link>
            <Link href="/chat" className="text-gray-600 hover:text-black transition-colors">
              Chat
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button asChild size="sm">
              <Link href="/chat">Start Chatting</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
