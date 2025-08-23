import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getUserByEmail, createConversation, getConversationsByUserId } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: {} })
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const conversations = await getConversationsByUserId(user.id)
    return Response.json(conversations)
  } catch (error) {
    console.error("Get conversations error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, provider, model } = await req.json()

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const conversation = await createConversation({
      user_id: user.id,
      title: title || "New Chat",
      provider,
      model,
    })

    return Response.json(conversation)
  } catch (error) {
    console.error("Create conversation error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
