"use client"

import { useState, useEffect } from "react"
import { Bot, ChevronDown, RefreshCw, Settings } from "lucide-react"
import { toast } from "sonner"

import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useGroqModels, type GroqModel } from "@/lib/hooks/use-groq-models"

interface ChatHeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
  onRefresh?: () => void
  apiKey?: string
}

export function ChatHeader({ selectedModel, onModelChange, onRefresh, apiKey }: ChatHeaderProps) {
  const { isMobile, state, open } = useSidebar()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { models, loading } = useGroqModels({
    apiKey,
    autoFetch: !!apiKey,
  })

  const currentModel = models.find(m => m.id === selectedModel) || models[0]

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
        toast.success("Chat refreshed")
      } catch (error) {
        toast.error("Failed to refresh chat")
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  const handleModelChange = (modelId: string) => {
    try {
      onModelChange(modelId)
      const model = models.find(m => m.id === modelId)
      toast.success(`Switched to ${model?.id || modelId}`)
    } catch (error) {
      console.error("Failed to change model:", error)
      toast.error("Failed to change model")
    }
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

  const formatMaxTokens = (maxTokens: number) => {
    if (maxTokens >= 1000000) {
      return `${(maxTokens / 1000000).toFixed(1)}M`
    }
    if (maxTokens >= 1000) {
      return `${(maxTokens / 1000).toFixed(0)}K`
    }
    return maxTokens.toString()
  }

  return (
    <div className="flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 shadow-sm">
      <SidebarTrigger />

      {apiKey ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="hidden sm:inline">
                {currentModel ? currentModel.id.replace('llama3-', '').replace('mixtral-', '').replace('-32768', '').replace('-8192', '').replace('-4096', '') : 'Model'}
              </span>
              <span className="sm:hidden">
                {currentModel ? currentModel.id.split('-')[0] : 'Model'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
            {models.map((model: GroqModel) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className="flex items-center justify-between gap-3 py-3 px-3 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {model.id}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {model.provider}
                    </span>
                    <span className="text-xs text-slate-500 bg-blue-100 hover:text-blue-700 px-2 py-1 rounded-lg">
                      Max: {formatMaxTokens(model.max_completion_tokens)}
                    </span>
                    <span className="text-xs text-slate-500 bg-green-100 hover:text-green-700 px-2 py-1 rounded-lg">
                      Context: {formatContextWindow(model.context_window)}
                    </span>
                    {model.capabilities.vision && (
                      <span className="text-xs text-slate-500 bg-purple-100 px-2 py-1 rounded-lg">
                        👁️ Vision
                      </span>
                    )}
                    {model.capabilities.audio && (
                      <span className="text-xs text-slate-500 bg-indigo-100 px-2 py-1 rounded-lg">
                        🎤 Audio
                      </span>
                    )}
                  </div>
                </div>
                {selectedModel === model.id && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="text-xs text-slate-400 px-3 py-2">
          No API key
        </div>
      )}
    </div>
  )
}
