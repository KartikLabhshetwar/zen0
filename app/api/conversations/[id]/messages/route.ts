import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id

    // Get user ID
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Verify conversation belongs to user
    const conversation = await sql`
      SELECT id FROM conversations 
      WHERE id = ${conversationId} AND user_id = ${userId}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages
    const messages = await sql`
      SELECT role, content, images, metadata, created_at
      FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `

    // Transform messages to match frontend format
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      metadata: msg.metadata || {},
      ...(msg.images && msg.images.length > 0 && { image: msg.images[0] }),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id
    const body = await request.json()
    const { messages } = body

    // Get user ID
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Verify conversation belongs to user
    const conversation = await sql`
      SELECT id FROM conversations 
      WHERE id = ${conversationId} AND user_id = ${userId}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Clear existing messages and insert new ones
    await sql`DELETE FROM messages WHERE conversation_id = ${conversationId}`

    // Insert messages
    for (const message of messages) {
      const images = message.image ? [message.image] : []
      await sql`
        INSERT INTO messages (conversation_id, role, content, images, metadata, created_at)
        VALUES (
          ${conversationId}, 
          ${message.role}, 
          ${message.content}, 
          ${JSON.stringify(images)}, 
          ${JSON.stringify(message.metadata || {})},
          ${message.created_at || new Date().toISOString()}
        )
      `
    }

    // Update conversation updated_at
    await sql`
      UPDATE conversations 
      SET updated_at = NOW() 
      WHERE id = ${conversationId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
