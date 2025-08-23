import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const shareToken = params.token

    // Get shared conversation
    const conversation = await sql`
      SELECT c.id, c.title, c.provider, c.model, c.created_at
      FROM conversations c
      WHERE c.share_token = ${shareToken} AND c.is_shared = true
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conv = conversation[0]

    // Get messages for the conversation
    const messages = await sql`
      SELECT role, content, images, created_at
      FROM messages 
      WHERE conversation_id = ${conv.id}
      ORDER BY created_at ASC
    `

    // Transform messages to match frontend format
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      ...(msg.images && msg.images.length > 0 && { image: msg.images[0] }),
    }))

    return NextResponse.json({
      id: conv.id,
      title: conv.title,
      provider: conv.provider,
      model: conv.model,
      created_at: conv.created_at,
      messages: formattedMessages,
    })
  } catch (error) {
    console.error("Failed to fetch shared conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
