import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const userId = user[0].id

    // Get conversations with message count
    const conversations = await sql`
      SELECT 
        c.id,
        c.title,
        c.provider,
        c.model,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}
      GROUP BY c.id, c.title, c.provider, c.model, c.created_at, c.updated_at
      ORDER BY c.updated_at DESC
      LIMIT 10
    `

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
