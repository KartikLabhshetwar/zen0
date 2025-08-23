import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
})

export const { signIn, signOut, signUp, useSession } = authClient

export const useAuthClient = () => {
  const session = useSession()

  return {
    data: session.data,
    isPending: session.isPending,
    error: session.error,
    signIn,
    signOut,
    signUp,
  }
}
