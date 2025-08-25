import { useState, useCallback, memo, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, ArrowUp, ChevronUp } from "lucide-react"
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input"
import { FileUpload, FileUploadTrigger, FileUploadContent } from "@/components/ui/file-upload"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useOpenRouterModels } from "@/lib/hooks/use-openrouter-models"
import { toast } from "sonner"

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  isStreaming: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (index: number) => void
  apiKey?: string
  selectedModel?: string
  onModelChange?: (model: string) => void
}

export const ChatInput = memo(function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isStreaming,
  files,
  onFilesChange,
  onFileRemove,
  apiKey,
  selectedModel,
  onModelChange
}: ChatInputProps) {
  const { models, loading } = useOpenRouterModels({
    apiKey,
    autoFetch: !!apiKey,
  })

  // Memoize models to prevent unnecessary re-renders
  const memoizedModels = useMemo(() => models, [models])

  const handleFileChange = useCallback((newFiles: File[]) => {
    onFilesChange([...files, ...newFiles])
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`)
    }
  }, [files, onFilesChange])

  const handleFileRemove = useCallback((index: number) => {
    const fileName = files[index]?.name || 'File'
    onFileRemove(index)
    toast.success(`${fileName} removed`)
  }, [onFileRemove, files])

  const handleSubmit = useCallback(() => {
    if (!isStreaming && input.trim()) {
      onSubmit()
    }
  }, [isStreaming, input, onSubmit])

  const handleModelSelect = useCallback((modelId: string) => {
    onModelChange?.(modelId)
  }, [onModelChange])

  const formatContextWindow = useCallback((contextWindow: number) => {
    if (contextWindow >= 1000000) {
      return `${(contextWindow / 1000000).toFixed(1)}M`
    }
    if (contextWindow >= 1000) {
      return `${(contextWindow / 1000).toFixed(0)}K`
    }
    return contextWindow.toString()
  }, [])

  const getModelBadgeVariant = useCallback((contextWindow: number) => {
    if (contextWindow >= 100000) return "default"
    if (contextWindow >= 50000) return "secondary"
    return "outline"
  }, [])

  return (
    <FileUpload
      onFilesAdded={handleFileChange}
      accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.md"
    >
      <div className="p-3 sm:p-4 md:p-6">
        <PromptInput
          value={input}
          onValueChange={onInputChange}
          isLoading={isStreaming}
          onSubmit={handleSubmit}
          className="w-full max-w-3xl mx-auto"
        >
        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-2 pb-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-slate-100 flex w-full items-center justify-between gap-2 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-2 text-sm border border-slate-200/50"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.type.startsWith('image/') ? (
                    <div className="w-5 h-5 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-slate-600">🖼️</span>
                    </div>
                  ) : (
                    <Paperclip className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className="max-w-[120px] sm:max-w-[100px] truncate text-sm text-slate-700 font-medium">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  className="hover:bg-slate-200 rounded-xl p-1.5 sm:p-1 transition-all duration-200 flex-shrink-0 hover:scale-105 touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[auto] sm:min-w-[auto] flex items-center justify-center"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        <PromptInputTextarea 
          placeholder="Ask me anything..."
          disabled={isStreaming}
          className="min-h-[50px] sm:min-h-[60px] resize-none border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl sm:rounded-2xl text-base leading-relaxed px-4 py-3"
        />

        <PromptInputActions className="flex items-center justify-between gap-3 sm:gap-2 pt-3">
          <div className="flex items-center gap-3 sm:gap-2">
            <PromptInputAction tooltip="Attach files">
              <FileUploadTrigger asChild>
                <div className="hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation">
                  <Paperclip className="text-slate-600 w-5 h-5 sm:w-4 sm:h-4" />
                </div>
              </FileUploadTrigger>
            </PromptInputAction>

            {apiKey ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div 
                    className="hover:bg-slate-100 flex h-10 sm:h-9 px-3 sm:px-3 cursor-pointer items-center gap-2 rounded-xl sm:rounded-2xl transition-all duration-200 border border-slate-200/50 touch-manipulation min-w-[120px]"
                  >
                    <span className="text-xs sm:text-xs text-slate-600 font-medium truncate max-w-[100px]">
                      {selectedModel ? selectedModel.replace('llama-', '').replace('-instant', '') : 'Model'}
                    </span>
                    <ChevronUp className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-slate-500 flex-shrink-0" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  side="top" 
                  align="start"
                  className="w-72 sm:w-80 max-h-80 sm:max-h-96 overflow-y-auto"
                >
                  {memoizedModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => {
                        handleModelSelect(model.id)
                      }}
                      className="flex items-center justify-between gap-3 py-3 px-3 cursor-pointer hover:bg-slate-50 rounded-xl touch-manipulation"
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
                            {formatContextWindow(model.context_window)}
                          </span>
                          {/* Show key capabilities */}
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
                          {model.capabilities.web_search && (
                            <span className="text-xs text-slate-500 bg-green-100 px-2 py-1 rounded-lg">
                              🔍 Web
                            </span>
                          )}
                          {model.capabilities.reasoning && (
                            <span className="text-xs text-slate-500 bg-orange-100 px-2 py-1 rounded-lg">
                              🧠 Reasoning
                            </span>
                          )}
                        </div>
                        
                        {/* Quick capability summary */}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          {Object.values(model.capabilities).filter(Boolean).length} features
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
              <div className="text-xs text-slate-400 px-3 py-2 sm:py-2">
                No API key
              </div>
            )}
          </div>

          <PromptInputAction tooltip="Send message">
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm touch-manipulation"
              onClick={handleSubmit}
              disabled={isStreaming || (!input.trim() && files.length === 0)}
            >
              <ArrowUp className="w-5 h-5 sm:w-4 sm:h-4" />
            </Button>
          </PromptInputAction>
        </PromptInputActions>
        </PromptInput>
      </div>

      <FileUploadContent>
        <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white/95 w-full max-w-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="mb-3 flex justify-center">
              <svg
                className="text-gray-400 w-8 h-8 sm:w-6 sm:h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-base sm:text-sm font-medium text-gray-900">
              Drop files to upload
            </h3>
            <p className="text-gray-600 text-center text-sm sm:text-xs">
              Release to add files to your message
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  )
})
