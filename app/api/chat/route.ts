import type { NextRequest } from "next/server"

// Disable Edge functions - use Node.js runtime for better compatibility and memory
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey, conversationId } = await req.json()

    // Clean messages to remove any unsupported properties for Groq API
    const cleanMessages = messages.map((msg: any) => {
      // Only keep the properties that Groq API supports
      const { role, content } = msg;
      
      // For vision models, ensure content is properly formatted
      if (Array.isArray(content)) {
        // This is a multimodal message, validate the structure
        const validatedContent = content.map(item => {
          if (item.type === "text" && item.text) {
            return { type: "text", text: item.text };
          } else if (item.type === "image_url" && item.image_url?.url) {
            return { type: "image_url", image_url: { url: item.image_url.url } };
          }
          return null;
        }).filter(Boolean);
        
        return { role, content: validatedContent };
      }
      
      return { role, content };
    });

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions"
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }
    const body = {
      model,
      messages: cleanMessages,
      stream: true,
      // Add performance optimizations
      max_tokens: 4000, // Limit response length for faster streaming
      temperature: 0.7, // Balanced creativity vs speed
    }

    // Use AbortController for better timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

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

    // Return streaming response immediately
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering for better streaming
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response("Request timeout", { status: 408 })
    }
    
    return new Response("Internal Server Error", { status: 500 })
  }
}
