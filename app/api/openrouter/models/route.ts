import type { NextRequest } from "next/server"

interface OpenRouterModel {
  id: string
  name: string
  created: number
  description: string
  architecture: {
    input_modalities: string[]
    output_modalities: string[]
    tokenizer: string
    instruct_type: string
  }
  top_provider: {
    is_moderated: boolean
    context_length: number
    max_completion_tokens: number
  }
  pricing: {
    prompt: string
    completion: string
    image: string
    request: string
    web_search: string
    internal_reasoning: string
    input_cache_read: string
    input_cache_write: string
  }
  canonical_slug: string
  context_length: number
  hugging_face_id?: string
  per_request_limits: Record<string, any>
  supported_parameters: string[]
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[]
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "")
    
    if (!apiKey) {
      return new Response("API key required", { status: 401 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(`OpenRouter API Error: ${response.status} - ${errorText}`, { 
        status: response.status 
      })
    }

    const data: OpenRouterModelsResponse = await response.json()
    
    // Filter and transform models for better UX
    const chatModels = data.data
      .filter((model) => {
        // Only include text-based chat models
        return (
          model.architecture.input_modalities.includes("text") &&
          model.architecture.output_modalities.includes("text") &&
          model.top_provider.context_length > 1000
        )
      })
      .sort((a, b) => {
        // Sort by context length (larger = better) and then by name
        if (b.top_provider.context_length !== a.top_provider.context_length) {
          return b.top_provider.context_length - a.top_provider.context_length
        }
        return a.name.localeCompare(b.name)
      })
      .map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        context_window: model.top_provider.context_length,
        max_tokens: model.top_provider.max_completion_tokens,
        provider: model.id.split('/')[0], // Extract provider from model ID
        pricing: {
          prompt: parseFloat(model.pricing.prompt),
          completion: parseFloat(model.pricing.completion)
        },
        capabilities: {
          text: true,
          image: model.architecture?.input_modalities?.includes("image") || false,
          audio: model.architecture?.input_modalities?.includes("audio") || model.architecture?.input_modalities?.includes("speech") || false,
          web_search: parseFloat(model.pricing?.web_search || "0") > 0,
          reasoning: parseFloat(model.pricing?.internal_reasoning || "0") > 0,
          function_calling: model.supported_parameters?.includes("functions") || model.supported_parameters?.includes("tool_choice") || false,
          json_output: model.supported_parameters?.includes("response_format") || model.supported_parameters?.includes("json_mode") || false,
          parallel_tool_calls: model.supported_parameters?.includes("parallel_tool_calls") || false,
          vision: model.architecture?.input_modalities?.includes("image") || model.architecture?.input_modalities.includes("vision") || false
        }
      }))

    return new Response(JSON.stringify(chatModels), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("OpenRouter models API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
