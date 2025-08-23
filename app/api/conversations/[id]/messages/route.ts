import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    
    // In local storage mode, we just return empty messages
    // The frontend handles the actual storage
    return NextResponse.json({ messages: [] })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    
    // In local storage mode, we just return success
    // The frontend handles the actual storage
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
