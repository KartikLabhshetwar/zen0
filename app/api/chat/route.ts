import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages, provider, model, apiKey } = await req.json()

    // Prepare API call based on provider
    let apiUrl: string
    let headers: Record<string, string>
    let body: any

    switch (provider) {
      case "groq":
        apiUrl = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        }
        body = {
          model,
          messages,
          stream: true,
        }
        break

      case "openai":
        apiUrl = "https://api.openai.com/v1/chat/completions"
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        }
        body = {
          model,
          messages,
          stream: true,
        }
        break

      case "anthropic":
        apiUrl = "https://api.anthropic.com/v1/messages"
        headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        }
        body = {
          model,
          max_tokens: 4096,
          messages: messages.filter((m: any) => m.role !== "system"),
          stream: true,
        }
        break

      case "gemini":
        const geminiMessages = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }))
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`
        headers = {
          "Content-Type": "application/json",
        }
        body = {
          contents: geminiMessages,
        }
        break

      default:
        return new Response("Invalid provider", { status: 400 })
    }

    // Make API call
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return new Response(`API Error: ${response.statusText}`, { status: response.status })
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
