import { useState, useEffect, useCallback } from "react"

export interface GroqModel {
  id: string
  name: string
  description: string
  context_window: number
  max_tokens: number
  provider: string
  pricing: {
    prompt: number
    completion: number
  }
  capabilities: {
    text: boolean
    image: boolean
    audio: boolean
    web_search: boolean
    reasoning: boolean
    function_calling: boolean
    json_output: boolean
    parallel_tool_calls: boolean
    vision: boolean
  }
}

interface UseGroqModelsOptions {
  apiKey?: string
  autoFetch?: boolean
  onError?: (error: string) => void
}

interface UseGroqModelsReturn {
  models: GroqModel[]
  loading: boolean
  error: string | null
  fetchModels: () => Promise<void>
  refreshModels: () => Promise<void>
}

export function useGroqModels({
  apiKey,
  autoFetch = true,
  onError,
}: UseGroqModelsOptions = {}): UseGroqModelsReturn {
  const [models, setModels] = useState<GroqModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      setError("API key required")
      onError?.("API key required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/groq/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data = await response.json()
      setModels(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch models"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [apiKey, onError])

  const refreshModels = useCallback(async () => {
    await fetchModels()
  }, [fetchModels])

  useEffect(() => {
    if (autoFetch && apiKey) {
      fetchModels()
    }
  }, [autoFetch, apiKey, fetchModels])

  return {
    models,
    loading,
    error,
    fetchModels,
    refreshModels,
  }
}
