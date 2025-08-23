"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthClient } from "@/lib/auth-client"
import { useEffect, useState } from "react"

export function Header() {
  const { data: session, signOut } = useAuthClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black">
              zen0
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700 transition-colors">
            zen0
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-600 hover:text-black transition-colors">
              Features
            </Link>
            {session?.user && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-black transition-colors">
                  Dashboard
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-black transition-colors">
                  Chat
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">{session.user.name || session.user.email}</span>
                <Button variant="outline" size="sm" onClick={() => signOut()} className="text-sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
