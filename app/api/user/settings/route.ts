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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Get user settings
    const settings = await sql`
      SELECT default_provider, default_model, theme, api_keys, custom_instructions
      FROM user_settings
      WHERE user_id = ${userId}
    `

    if (settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        default_provider: "groq",
        default_model: "llama-3.1-8b-instant",
        theme: "dark",
        api_keys: {},
        custom_instructions: "",
      })
    }

    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("Failed to fetch user settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { default_provider, default_model, theme, api_keys, custom_instructions } = body

    // Get user ID
    const user = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Upsert user settings
    await sql`
      INSERT INTO user_settings (user_id, default_provider, default_model, theme, api_keys, custom_instructions)
      VALUES (${userId}, ${default_provider}, ${default_model}, ${theme}, ${JSON.stringify(api_keys)}, ${custom_instructions})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        default_provider = EXCLUDED.default_provider,
        default_model = EXCLUDED.default_model,
        theme = EXCLUDED.theme,
        api_keys = EXCLUDED.api_keys,
        custom_instructions = EXCLUDED.custom_instructions,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update user settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
