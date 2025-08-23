import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getUserByEmail, getConversationById, getMessagesByConversationId } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Verify conversation ownership
    const conversation = await getConversationById(params.id, user.id)
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages for this conversation
    const messages = await getMessagesByConversationId(params.id)

    // Transform messages to match the chat interface format
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      metadata: msg.metadata,
    }))

    return Response.json(formattedMessages)
  } catch (error) {
    console.error("Get messages error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
