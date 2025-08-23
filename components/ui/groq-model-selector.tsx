import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGroqModels, type GroqModel } from "@/lib/hooks/use-groq-models"

interface GroqModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  apiKey?: string
  placeholder?: string
  className?: string
  showRefresh?: boolean
  onRefresh?: () => void
}

export function GroqModelSelector({
  value,
  onValueChange,
  apiKey,
  placeholder = "Select a model",
  className = "",
  showRefresh = true,
  onRefresh,
}: GroqModelSelectorProps) {
  const { models, loading, error, refreshModels } = useGroqModels({
    apiKey,
    autoFetch: !!apiKey,
  })

  const handleRefresh = async () => {
    await refreshModels()
    onRefresh?.()
  }

  const formatContextWindow = (contextWindow: number) => {
    if (contextWindow >= 1000000) {
      return `${(contextWindow / 1000000).toFixed(1)}M`
    }
    if (contextWindow >= 1000) {
      return `${(contextWindow / 1000).toFixed(0)}K`
    }
    return contextWindow.toString()
  }

  const getModelBadgeVariant = (contextWindow: number) => {
    if (contextWindow >= 100000) return "default" // High capacity
    if (contextWindow >= 50000) return "secondary" // Medium capacity
    return "outline" // Low capacity
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="border-red-200 bg-red-50">
            <SelectValue placeholder="Error loading models" />
          </SelectTrigger>
        </Select>
        <p className="text-xs text-red-600">{error}</p>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="w-full"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading models..." : placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate font-medium">{model.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.owned_by}
                    </Badge>
                  </div>
                  <Badge variant={getModelBadgeVariant(model.context_window)} className="text-xs">
                    {formatContextWindow(model.context_window)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
      {loading && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Fetching latest models from Groq API...
        </p>
      )}
    </div>
  )
}
