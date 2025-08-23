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
      return NextResponse.json({
        total_conversations: 0,
        total_messages: 0,
        favorite_provider: "groq",
        favorite_model: "llama-3.1-8b-instant",
      })
    }

    const userId = user[0].id

    // Get total conversations
    const conversationCount = await sql`
      SELECT COUNT(*) as count FROM conversations WHERE user_id = ${userId}
    `

    // Get total messages
    const messageCount = await sql`
      SELECT COUNT(m.*) as count 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = ${userId}
    `

    // Get favorite provider
    const favoriteProvider = await sql`
      SELECT provider, COUNT(*) as count
      FROM conversations
      WHERE user_id = ${userId}
      GROUP BY provider
      ORDER BY count DESC
      LIMIT 1
    `

    // Get favorite model
    const favoriteModel = await sql`
      SELECT model, COUNT(*) as count
      FROM conversations
      WHERE user_id = ${userId}
      GROUP BY model
      ORDER BY count DESC
      LIMIT 1
    `

    return NextResponse.json({
      total_conversations: Number.parseInt(conversationCount[0]?.count || "0"),
      total_messages: Number.parseInt(messageCount[0]?.count || "0"),
      favorite_provider: favoriteProvider[0]?.provider || "groq",
      favorite_model: favoriteModel[0]?.model || "llama-3.1-8b-instant",
    })
  } catch (error) {
    console.error("Failed to fetch user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
