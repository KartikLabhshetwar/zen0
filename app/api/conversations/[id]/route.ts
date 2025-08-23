import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getUserByEmail, getConversationById, updateConversationTitle, deleteConversation } from "@/lib/db"

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

    const conversation = await getConversationById(params.id, user.id)
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    return Response.json(conversation)
  } catch (error) {
    console.error("Get conversation error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await req.json()

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const updatedConversation = await updateConversationTitle(params.id, title, user.id)
    if (!updatedConversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    return Response.json(updatedConversation)
  } catch (error) {
    console.error("Update conversation error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    await deleteConversation(params.id, user.id)
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete conversation error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
