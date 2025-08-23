import type { NextRequest } from "next/server"
import { getMemoryService } from "@/lib/memory"

export async function POST(req: NextRequest) {
  try {
    const { messages, provider, model, apiKey, conversationId } = await req.json()

    const memoryService = getMemoryService()
    let enhancedMessages = messages

    if (memoryService.isEnabled() && messages.length > 0 && conversationId) {
      const userQuery = messages[messages.length - 1].content
      const relevantMemories = await memoryService.getRelevantMemories(userQuery, conversationId)

      if (relevantMemories.length > 0) {
        const systemPrompt = memoryService.generateSystemPrompt(relevantMemories, userQuery)
        enhancedMessages = [{ role: "system", content: systemPrompt }, ...messages.filter((m) => m.role !== "system")]
      }
    }

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
          messages: enhancedMessages,
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
          messages: enhancedMessages,
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
          messages: enhancedMessages.filter((m: any) => m.role !== "system"),
          stream: true,
        }
        break

      case "gemini":
        const geminiMessages = enhancedMessages.map((m: any) => ({
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

    // Create a transform stream to handle memory storage
    let completeResponse = ""
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)

        // Parse streaming response based on provider
        if (provider === "anthropic") {
          const lines = text.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === "content_block_delta" && data.delta?.text) {
                  completeResponse += data.delta.text
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        } else if (provider === "gemini") {
          const lines = text.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  completeResponse += data.candidates[0].content.parts[0].text
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        } else {
          const lines = text.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  completeResponse += parsed.choices[0].delta.content
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        controller.enqueue(chunk)
      },
      async flush() {
        // Store memory using conversationId as identifier
        if (memoryService.isEnabled() && conversationId && completeResponse) {
          const conversationMessages = [...messages, { role: "assistant", content: completeResponse }]
          await memoryService.storeConversationMemory(conversationMessages, conversationId, conversationId)
        }
      },
    })

    return new Response(response.body?.pipeThrough(transformStream), {
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
