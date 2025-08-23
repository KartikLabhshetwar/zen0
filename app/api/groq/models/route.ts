import type { NextRequest } from "next/server"

interface GroqModel {
  id: string
  object: string
  created: number
  owned_by: string
  active: boolean
  context_window: number
  public_apps: any
  max_completion_tokens?: number
}

interface GroqModelsResponse {
  object: string
  data: GroqModel[]
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "")
    
    if (!apiKey) {
      return new Response("API key required", { status: 401 })
    }

    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(`Groq API Error: ${response.status} - ${errorText}`, { 
        status: response.status 
      })
    }

    const data: GroqModelsResponse = await response.json()
    
    // Filter out non-chat models and sort by relevance
    const chatModels = data.data
      .filter((model) => {
        // Exclude audio, guard, and other non-chat models
        return (
          model.active &&
          !model.id.includes("whisper") &&
          !model.id.includes("guard") &&
          !model.id.includes("distil-whisper") &&
          !model.id.includes("tts") &&
          model.context_window > 1000 // Ensure it's a chat model
        )
      })
      .sort((a, b) => {
        // Sort by context window (larger = better) and then by name
        if (b.context_window !== a.context_window) {
          return b.context_window - a.context_window
        }
        return a.id.localeCompare(b.id)
      })
      .map((model) => ({
        id: model.id,
        name: model.id,
        context_window: model.context_window,
        owned_by: model.owned_by,
        max_tokens: model.max_completion_tokens || model.context_window,
      }))

    return new Response(JSON.stringify(chatModels), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Groq models API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
