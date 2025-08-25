import React, { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Image, Search, Brain, DollarSign, Mic, Eye, Code, Zap, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOpenRouterModels, type OpenRouterModel } from "@/lib/hooks/use-openrouter-models"

interface OpenRouterModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  apiKey?: string
  placeholder?: string
  className?: string
  showRefresh?: boolean
  onRefresh?: () => void
}

export function OpenRouterModelSelector({
  value,
  onValueChange,
  apiKey,
  placeholder = "Select a model",
  className = "",
  showRefresh = true,
  onRefresh,
}: OpenRouterModelSelectorProps) {
  const { models, loading, error, refreshModels } = useOpenRouterModels({
    apiKey,
    autoFetch: !!apiKey,
  })
  
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all")
  
  // Filter models based on capability
  const filteredModels = useMemo(() => {
    if (capabilityFilter === "all") return models
    
    return models.filter(model => {
      switch (capabilityFilter) {
        case "vision":
          return model.capabilities.vision
        case "audio":
          return model.capabilities.audio
        case "web_search":
          return model.capabilities.web_search
        case "reasoning":
          return model.capabilities.reasoning
        case "function_calling":
          return model.capabilities.function_calling
        default:
          return true
      }
    })
  }, [models, capabilityFilter])

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

  const formatPricing = (prompt: number, completion: number) => {
    const promptFormatted = prompt < 0.001 ? `${(prompt * 1000000).toFixed(1)}M` : `${(prompt * 1000).toFixed(1)}K`
    const completionFormatted = completion < 0.001 ? `${(completion * 1000000).toFixed(1)}M` : `${(completion * 1000).toFixed(1)}K`
    return `${promptFormatted}/${completionFormatted}`
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
      {/* Capability Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-700">Filter by:</span>
        <select
          value={capabilityFilter}
          onChange={(e) => setCapabilityFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
        >
          <option value="all">All Capabilities</option>
          <option value="vision">👁️ Vision</option>
          <option value="audio">🎤 Audio</option>
          <option value="web_search">🔍 Web Search</option>
          <option value="reasoning">🧠 Reasoning</option>
          <option value="function_calling">⚙️ Functions</option>
        </select>
        <span className="text-xs text-gray-500">
          {filteredModels.length} of {models.length} models
        </span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0 w-full">
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="h-10 border-gray-200 focus:border-gray-400 focus:ring-gray-400 w-full">
              <SelectValue placeholder={loading ? "Loading models..." : placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-80 w-[90vw] sm:w-[500px] max-w-[90vw]">
              {filteredModels.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-3">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-gray-900 truncate text-sm">{model.name}</span>
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-0">
                          {model.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatPricing(model.pricing.prompt, model.pricing.completion)}</span>
                      </div>
                    </div>
                    
                    {/* Quick Capability Summary */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {model.capabilities.vision && <span>👁️</span>}
                        {model.capabilities.audio && <span>🎤</span>}
                        {model.capabilities.web_search && <span>🔍</span>}
                        {model.capabilities.reasoning && <span>🧠</span>}
                        {model.capabilities.function_calling && <span>⚙️</span>}
                        {model.capabilities.json_output && <span>📄</span>}
                        {model.capabilities.parallel_tool_calls && <span>⚡</span>}
                      </div>
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                        {Object.values(model.capabilities).filter(Boolean).length} features
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                      {/* Context Window Badge */}
                      <Badge 
                        variant={getModelBadgeVariant(model.context_window)} 
                        className="text-xs bg-blue-50 text-blue-700 border-0"
                      >
                        {formatContextWindow(model.context_window)}
                      </Badge>
                      
                      {/* Core Capabilities */}
                      {model.capabilities.vision && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          <Eye className="w-3 h-3 mr-1" />
                          Vision
                        </Badge>
                      )}
                      
                      {model.capabilities.audio && (
                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          <Mic className="w-3 h-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                      
                      {/* Advanced Features */}
                      {model.capabilities.web_search && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <Search className="w-3 h-3 mr-1" />
                          Web
                        </Badge>
                      )}
                      
                      {model.capabilities.reasoning && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          <Brain className="w-3 h-3 mr-1" />
                          Reasoning
                        </Badge>
                      )}
                      
                      {model.capabilities.function_calling && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Code className="w-3 h-3 mr-1" />
                          Functions
                        </Badge>
                      )}
                      
                      {model.capabilities.json_output && (
                        <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          <FileText className="w-3 h-3 mr-1" />
                          JSON
                        </Badge>
                      )}
                      
                      {model.capabilities.parallel_tool_calls && (
                        <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                          <Zap className="w-3 h-3 mr-1" />
                          Parallel
                        </Badge>
                      )}
                    </div>
                    
                    {model.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{model.description}</p>
                    )}
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
          Fetching latest models from OpenRouter...
        </p>
      )}
      
      {!loading && models.length > 0 && (
        <p className="text-xs text-gray-500">
          Found {models.length} models • {filteredModels.length} match your filter
        </p>
      )}
      
      {/* Capability Legend */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Model Capabilities:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-purple-600" />
            <span>Vision - Can analyze images</span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3 text-indigo-600" />
            <span>Audio - Can process speech</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3 text-green-600" />
            <span>Web - Can search the internet</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-3 h-3 text-orange-600" />
            <span>Reasoning - Advanced thinking</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-3 h-3 text-yellow-600" />
            <span>Functions - Tool calling</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-teal-600" />
            <span>JSON - Structured output</span>
          </div>
        </div>
      </div>
    </div>
  )
}
