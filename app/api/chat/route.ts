import type { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getUserByEmail, addMessage, getConversationById } from "@/lib/db"
import { getMemoryService } from "@/lib/memory"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, provider, model, apiKey, conversationId, mem0ApiKey } = await req.json()

    // Get user from database
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return new Response("User not found", { status: 404 })
    }

    const memoryService = getMemoryService(mem0ApiKey)
    let enhancedMessages = messages

    if (memoryService.isEnabled() && messages.length > 0) {
      const userQuery = messages[messages.length - 1].content
      const relevantMemories = await memoryService.getRelevantMemories(userQuery, user.id)

      if (relevantMemories.length > 0) {
        const systemPrompt = memoryService.generateSystemPrompt(relevantMemories, userQuery)
        enhancedMessages = [{ role: "system", content: systemPrompt }, ...messages.filter((m) => m.role !== "system")]
      }
    }

    // Validate conversation ownership if provided
    let conversation
    if (conversationId) {
      conversation = await getConversationById(conversationId, user.id)
      if (!conversation) {
        return new Response("Conversation not found", { status: 404 })
      }
    }

    // Save user message to database
    if (conversationId) {
      await addMessage({
        conversation_id: conversationId,
        role: "user",
        content: messages[messages.length - 1].content,
      })
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
          messages: enhancedMessages, // Use enhanced messages with memory context
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
          messages: enhancedMessages, // Use enhanced messages with memory context
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
          messages: enhancedMessages.filter((m: any) => m.role !== "system"), // Use enhanced messages
          stream: true,
        }
        break

      case "gemini":
        const geminiMessages = enhancedMessages.map((m: any) => ({
          // Use enhanced messages
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

    // Create a transform stream to save the complete response
    let completeResponse = ""
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)

        // Parse streaming response based on provider
        if (provider === "anthropic") {
          // Handle Anthropic's streaming format
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
          // Handle Gemini's streaming format
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
          // Handle OpenAI/Groq format
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
        // Save complete response to database when stream ends
        if (conversationId && completeResponse) {
          await addMessage({
            conversation_id: conversationId,
            role: "assistant",
            content: completeResponse,
            metadata: { provider, model },
          })

          if (memoryService.isEnabled()) {
            const conversationMessages = [...messages, { role: "assistant", content: completeResponse }]
            await memoryService.storeConversationMemory(conversationMessages, user.id, conversationId)
          }
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
