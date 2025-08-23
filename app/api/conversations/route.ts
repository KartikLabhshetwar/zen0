import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, provider, model, created_at } = body

    // Get user ID
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Create conversation
    const conversation = await sql`
      INSERT INTO conversations (id, user_id, title, provider, model, created_at)
      VALUES (${id}, ${userId}, ${title}, ${provider}, ${model}, ${created_at})
      RETURNING *
    `

    return NextResponse.json(conversation[0])
  } catch (error) {
    console.error("Failed to create conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
