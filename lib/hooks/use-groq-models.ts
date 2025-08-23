import { useState, useEffect, useCallback } from "react"

export interface GroqModel {
  id: string
  name: string
  context_window: number
  owned_by: string
  max_tokens: number
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
