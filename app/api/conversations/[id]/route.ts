import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id
    
    // In local storage mode, we just return success
    // The frontend handles the actual storage
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
