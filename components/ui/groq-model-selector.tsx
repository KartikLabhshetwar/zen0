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
    if (contextWindow >= 100000) return "default"
    if (contextWindow >= 50000) return "secondary"
    return "outline"
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="border-red-200 bg-red-50 h-10">
            <SelectValue placeholder="Error loading models" />
          </SelectTrigger>
        </Select>
        <p className="text-xs text-red-600">{error}</p>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="w-full h-9 rounded-full"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0 w-full">
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="h-10 border-gray-200 focus:border-gray-400 focus:ring-gray-400 w-full">
              <SelectValue placeholder={loading ? "Loading models..." : placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-80 w-[90vw] sm:w-[400px] max-w-[90vw]">
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-gray-900 truncate text-sm sm:text-base">{model.id}</span>
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-0">
                        {model.owned_by}
                      </Badge>
                      <Badge 
                        variant={getModelBadgeVariant(model.context_window)} 
                        className="text-xs bg-blue-50 text-blue-700 border-0"
                      >
                        {formatContextWindow(model.context_window)}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex-shrink-0 h-10 w-10 p-0 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full self-center sm:self-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {loading && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Fetching latest models from Groq API...
        </p>
      )}
    </div>
  )
}
