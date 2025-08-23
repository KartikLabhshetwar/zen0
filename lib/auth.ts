import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          console.log("[v0] Attempting to sign in user:", user.email)

          if (!process.env.DATABASE_URL) {
            console.error("[v0] DATABASE_URL not configured")
            return false
          }

          // Check if user exists
          const existingUser = await sql`
            SELECT id FROM users WHERE email = ${user.email}
          `

          if (existingUser.length === 0) {
            const userId = crypto.randomUUID()

            // Create new user
            await sql`
              INSERT INTO users (id, email, name, image, created_at, last_login)
              VALUES (${userId}, ${user.email}, ${user.name}, ${user.image}, NOW(), NOW())
            `

            // Create default user settings
            await sql`
              INSERT INTO user_settings (user_id, default_provider, default_model, theme, api_keys)
              VALUES (${userId}, 'groq', 'llama-3.1-8b-instant', 'dark', '{}')
            `

            console.log("[v0] Created new user:", userId)
          } else {
            // Update last login
            await sql`
              UPDATE users SET last_login = NOW() WHERE email = ${user.email}
            `
            console.log("[v0] Updated existing user login")
          }

          return true
        } catch (error) {
          console.error("[v0] Error during sign in:", error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const user = await sql`
            SELECT id FROM users WHERE email = ${session.user.email}
          `
          if (user.length > 0) {
            session.user.id = user[0].id
          }
        } catch (error) {
          console.error("[v0] Error fetching user in session:", error)
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
