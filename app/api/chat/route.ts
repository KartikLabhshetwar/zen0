import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey } = await req.json()

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions"
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
    const body = {
      model,
      messages,
      stream: true,
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error?.message) {
          errorMessage = `API Error: ${errorData.error.message}`
        } else if (errorData.message) {
          errorMessage = `API Error: ${errorData.message}`
        }
      } catch {
        // If we can't parse the error, use the status text
      }
      
      return new Response(errorMessage, { 
        status: response.status,
        headers: { "Content-Type": "text/plain" }
      })
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
