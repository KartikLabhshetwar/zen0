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

interface ChatHeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
  onRefresh?: () => void
}

const AVAILABLE_MODELS = [
  { id: "llama3-8b-8192", name: "Llama 3.1 8B", description: "Fast, efficient 8B parameter model" },
  { id: "llama3-70b-8192", name: "Llama 3.1 70B", description: "High-quality 70B parameter model" },
  { id: "llama3-8b-instruct", name: "Llama 3.1 8B Instruct", description: "Instruction-tuned 8B model" },
  { id: "llama3-70b-instruct", name: "Llama 3.1 70B Instruct", description: "Instruction-tuned 70B model" },
  { id: "llama-4-scout-1m", name: "Llama 4 Scout 1M", description: "Vision-capable model with 1M context" },
  { id: "llama-4-maverick-1m", name: "Llama 4 Maverick 1M", description: "Advanced vision model with 1M context" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "High-performance mixture of experts" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B IT", description: "Google's efficient 9B instruction model" },
]

export function ChatHeader({ selectedModel, onModelChange, onRefresh }: ChatHeaderProps) {
  const { isMobile, state, open } = useSidebar()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

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
      toast.success(`Switched to ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId}`)
    } catch (error) {
      console.error("Failed to change model:", error)
      toast.error("Failed to change model")
    }
  }

  return (
    <div className="flex h-14 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span className="hidden sm:inline">{currentModel.name}</span>
              <span className="sm:hidden">{currentModel.id.split('-')[0]}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {AVAILABLE_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleModelChange(model.id)}
                className="flex flex-col items-start gap-1 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  {selectedModel === model.id && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
            aria-label="Refresh chat"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}


      </div>
    </div>
  )
}
