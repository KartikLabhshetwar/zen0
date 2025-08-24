import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, ArrowUp } from "lucide-react"
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input"
import { FileUpload, FileUploadTrigger, FileUploadContent } from "@/components/ui/file-upload"

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  isStreaming: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (index: number) => void
}

export const ChatInput = memo(function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isStreaming,
  files,
  onFilesChange,
  onFileRemove
}: ChatInputProps) {
  const handleFileChange = useCallback((newFiles: File[]) => {
    onFilesChange([...files, ...newFiles])
  }, [files, onFilesChange])

  const handleFileRemove = useCallback((index: number) => {
    onFileRemove(index)
  }, [onFileRemove])

  const handleSubmit = useCallback(() => {
    if (!isStreaming && input.trim()) {
      onSubmit()
    }
  }, [isStreaming, input, onSubmit])

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="max-w-3xl mx-auto">
        <FileUpload
          onFilesAdded={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.md"
        >
          <PromptInput
            value={input}
            onValueChange={onInputChange}
            isLoading={isStreaming}
            onSubmit={handleSubmit}
            className="w-full"
          >
            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.type.startsWith('image/') ? (
                        <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-600">🖼️</span>
                        </div>
                      ) : (
                        <Paperclip className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <span className="max-w-[100px] truncate text-sm text-gray-700 font-medium">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="hover:bg-gray-200 rounded-full p-1 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <PromptInputTextarea 
              placeholder="Ask me anything..."
              disabled={isStreaming}
              className="min-h-[60px] resize-none border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />

            <PromptInputActions className="flex items-center justify-between gap-2 pt-3">
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip="Attach files">
                  <FileUploadTrigger asChild>
                    <div className="hover:bg-gray-100 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors">
                      <Paperclip className="text-gray-600 w-4 h-4" />
                    </div>
                  </FileUploadTrigger>
                </PromptInputAction>
              </div>

              <PromptInputAction tooltip="Send message">
                <Button
                  variant="default"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-neutral-700 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={isStreaming || (!input.trim() && files.length === 0)}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>

          <FileUploadContent>
            <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
              <div className="bg-white/95 m-4 w-full max-w-sm rounded-xl border border-gray-200 p-6 shadow-lg">
                <div className="mb-3 flex justify-center">
                  <svg
                    className="text-gray-400 w-6 h-6"
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
                <h3 className="mb-2 text-center text-sm font-medium text-gray-900">
                  Drop files to upload
                </h3>
                <p className="text-gray-600 text-center text-xs">
                  Release to add files to your message
                </p>
              </div>
            </div>
          </FileUploadContent>
        </FileUpload>
      </div>
    </div>
  )
})
