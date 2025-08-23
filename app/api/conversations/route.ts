import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In local storage mode, we just return success
    // The frontend handles the actual storage
    return NextResponse.json({ success: true, id: body.id })
  } catch (error) {
    console.error("Failed to create conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
