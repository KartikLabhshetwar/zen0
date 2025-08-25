"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Zen0Icon } from "@/components/ui/zen0-icon"
import { GitHubStars } from "@/components/ui/github-stars"

export function Header() {
  const pathname = usePathname()
  
  // Hide header on chat page
  if (pathname?.startsWith("/chat")) {
    return null
  }

  return (
    <header className="border-b border-gray-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <Link href="/" className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-neutral-900 hover:text-black transition-all duration-300 group">
            <div className="transform group-hover:rotate-12 transition-transform duration-300">
              <Zen0Icon className="text-neutral-900" size={32} />
            </div>
            <span className="font-space-grotesk">zen0</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-700 hover:text-black transition-all duration-300 text-sm font-medium relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/chat" className="text-gray-700 hover:text-black transition-all duration-300 text-sm font-medium relative group">
              Chat
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <GitHubStars />
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl font-medium">
              <Link href="/chat">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
