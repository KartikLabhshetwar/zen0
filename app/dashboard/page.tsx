import { auth } from "@/auth"
import { signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { BYOKSetup } from "@/components/byok-setup"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: {} })

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const handleSignOut = async () => {
    "use client"
    await signOut({ fetchOptions: { onSuccess: () => (window.location.href = "/") } })
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light">zen0</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {session.user.name}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <BYOKSetup />
        </div>
      </main>
    </div>
  )
}
