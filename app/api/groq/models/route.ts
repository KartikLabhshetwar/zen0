import type { NextRequest } from "next/server"

interface GroqModel {
  id: string
  object: string
  created: number
  owned_by: string
  active: boolean
  context_window: number
  public_apps: any
  max_completion_tokens: number
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
    
    // Transform Groq models to match our interface
    const transformedModels = data.data
      .filter((model) => {
        // Only include text-based chat models
        return model.id && !model.id.includes("deprecated")
      })
      .sort((a, b) => {
        // Sort by model name for better UX
        return a.id.localeCompare(b.id)
      })
      .map((model) => {
        // Map Groq model to our interface
        const isAudio = model.id.includes("whisper") || model.id.includes("tts")
        const isVision = model.id.includes("llama-4-scout") || model.id.includes("llama-4-maverick")
        const isChatModel = !isAudio // Whisper and TTS models are not chat models
        
        return {
          id: model.id,
          name: model.id.replace(/-/g, " ").replace(/_/g, " "),
          description: getModelDescription(model.id),
          context_window: model.context_window,
          max_tokens: model.max_completion_tokens,
          provider: model.owned_by || "groq",
          pricing: {
            prompt: getModelPricing(model.id, "prompt"),
            completion: getModelPricing(model.id, "completion")
          },
          capabilities: {
            text: isChatModel, // Only chat models support text generation
            image: isVision, // Llama 4 Scout and Maverick support vision
            audio: isAudio,
            web_search: false, // Groq doesn't have web search
            reasoning: false, // We don't have reliable capability info
            function_calling: false, // We don't have reliable capability info
            json_output: false, // We don't have reliable capability info
            parallel_tool_calls: false, // We don't have reliable capability info
            vision: isVision // Llama 4 Scout and Maverick support vision
          }
        }
      })

    return new Response(JSON.stringify(transformedModels), {
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

// Helper functions to get model-specific information
function getModelDescription(modelId: string): string {
  if (modelId.includes("llama3")) {
    return "Meta's latest Llama 3 model with improved reasoning and instruction following"
  } else if (modelId.includes("llama-3.1")) {
    return "Meta's Llama 3.1 model with enhanced reasoning and larger context window"
  } else if (modelId.includes("llama-3.3")) {
    return "Meta's Llama 3.3 model with versatile capabilities and large context"
  } else if (modelId.includes("llama-4-scout")) {
    return "Meta's multimodal Llama 4 Scout model with vision capabilities, tool use, and JSON mode"
  } else if (modelId.includes("llama-4-maverick")) {
    return "Meta's multimodal Llama 4 Maverick model with vision capabilities, tool use, and JSON mode"
  } else if (modelId.includes("llama-4")) {
    return "Meta's advanced Llama 4 model with enhanced performance"
  } else if (modelId.includes("llama-guard")) {
    return "Safety-focused model for content moderation and filtering"
  } else if (modelId.includes("llama-prompt-guard")) {
    return "Prompt safety model for input validation and filtering"
  } else if (modelId.includes("gemma")) {
    return "Google's Gemma model optimized for instruction following"
  } else if (modelId.includes("whisper")) {
    return "Audio transcription model for converting speech to text"
  } else if (modelId.includes("tts")) {
    return "Text-to-speech model for audio generation"
  } else if (modelId.includes("gpt-oss")) {
    return "OpenAI's open-source GPT model for text generation"
  } else if (modelId.includes("qwen")) {
    return "Alibaba Cloud's Qwen model for text generation"
  } else if (modelId.includes("compound")) {
    return "Groq's compound model for enhanced performance"
  } else if (modelId.includes("deepseek")) {
    return "DeepSeek's distilled model for efficient text generation"
  } else if (modelId.includes("kimi")) {
    return "Moonshot AI's Kimi model for instruction following"
  } else if (modelId.includes("allam")) {
    return "SDAIA's Allam model for Arabic text generation"
  }
  return "High-performance language model for text generation and reasoning"
}



function getModelPricing(modelId: string, type: "prompt" | "completion"): number {
  // Groq pricing (approximate, check their website for current rates)
  if (modelId.includes("llama3")) {
    return type === "prompt" ? 0.05 : 0.10 // $0.05/$0.10 per 1M tokens
  } else if (modelId.includes("llama-3.1")) {
    return type === "prompt" ? 0.05 : 0.10 // $0.05/$0.10 per 1M tokens
  } else if (modelId.includes("llama-3.3")) {
    return type === "prompt" ? 0.05 : 0.10 // $0.05/$0.10 per 1M tokens
  } else if (modelId.includes("llama-4-scout")) {
    return type === "prompt" ? 0.12 : 0.20 // $0.12/$0.20 per 1M tokens (vision model)
  } else if (modelId.includes("llama-4-maverick")) {
    return type === "prompt" ? 0.12 : 0.20 // $0.12/$0.20 per 1M tokens (vision model)
  } else if (modelId.includes("llama-4")) {
    return type === "prompt" ? 0.08 : 0.15 // $0.08/$0.15 per 1M tokens
  } else if (modelId.includes("gemma")) {
    return type === "prompt" ? 0.10 : 0.20 // $0.10/$0.20 per 1M tokens
  } else if (modelId.includes("gpt-oss")) {
    return type === "prompt" ? 0.12 : 0.25 // $0.12/$0.25 per 1M tokens
  } else if (modelId.includes("qwen")) {
    return type === "prompt" ? 0.08 : 0.16 // $0.08/$0.16 per 1M tokens
  } else if (modelId.includes("compound")) {
    return type === "prompt" ? 0.06 : 0.12 // $0.06/$0.12 per 1M tokens
  }
  return type === "prompt" ? 0.10 : 0.20 // Default pricing
}
