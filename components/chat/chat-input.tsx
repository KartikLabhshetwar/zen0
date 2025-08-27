import { useState, useCallback, memo, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, ArrowUp, Check } from "lucide-react"
import { 
  FiSearch, 
  FiTrendingUp, 
  FiBookOpen,
  FiImage,
  FiVideo,
  FiMusic,
} from "react-icons/fi"
import {  FaYoutube, FaSpotify } from "react-icons/fa"
import { MdBusiness, MdScience } from "react-icons/md"
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoReddit } from "react-icons/io5";
import { TbWorldSearch } from "react-icons/tb";
import { TbAtomOff } from "react-icons/tb";

import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input"
import { FileUpload, FileUploadTrigger, FileUploadContent } from "@/components/ui/file-upload"
import { SpeechInput } from "@/components/ui/speech-input"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { toast } from "sonner"
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard"

interface FileWithPreview extends File {
  preview?: string
}

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  isStreaming: boolean
  files: FileWithPreview[]
  onFilesChange: (files: FileWithPreview[]) => void
  onFileRemove: (index: number) => void
  apiKey?: string
  selectedModel?: string
  isProcessing: boolean
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
  isProcessing
}: ChatInputProps) {
  const { isKeyboardOpen, inputBottom } = useMobileKeyboard()
  const [selectedSearchMode, setSelectedSearchMode] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [switchMode, setSwitchMode] = useState<"search" | "atom">("search")
  
  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])
  
  const handleFileChange = useCallback((newFiles: File[]) => {
    // Create preview URLs for image files
    const filesWithPreview = newFiles.map(file => {
      if (file.type.startsWith('image/')) {
        const fileWithPreview = file as FileWithPreview
        fileWithPreview.preview = URL.createObjectURL(file)
        return fileWithPreview
      }
      return file as FileWithPreview
    })
    
    onFilesChange([...files, ...filesWithPreview])
    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`)
    }
  }, [files, onFilesChange])

  const handleFileRemove = useCallback((index: number) => {
    const fileName = files[index]?.name || 'File'
    // Clean up preview URL if it exists
    if (files[index]?.preview) {
      URL.revokeObjectURL(files[index].preview!)
    }
    onFileRemove(index)
    toast.success(`${fileName} removed`)
  }, [onFileRemove, files])

  const handleSubmit = useCallback(() => {
    if (!isStreaming && input.trim()) {
      onSubmit()
    }
  }, [isStreaming, input, onSubmit])

  const handleSwitchModeChange = useCallback((mode: "search" | "atom") => {
    setSwitchMode(mode)
    switch (mode) {
      case "search":
        break
      case "atom":
        toast.success("Deep Research mode")
        break
    }
  }, [])

  return (
    <FileUpload
      onFilesAdded={handleFileChange}
      accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.md"
    >
      <div 
        className={`p-3 sm:p-4 md:p-6 chat-input-transition ${isKeyboardOpen ? 'keyboard-open' : ''}`}
        style={{
          paddingBottom: isKeyboardOpen ? `${Math.max(16, inputBottom)}px` : undefined,
          transition: 'padding-bottom 0.3s ease-out'
        }}
      >
        <PromptInput
          value={input}
          onValueChange={onInputChange}
          isLoading={isStreaming}
          onSubmit={handleSubmit}
          className="w-full max-w-3xl mx-auto"
        >
          {files.length > 0 && (
            <div className="space-y-2 pb-3">
              {selectedModel && (selectedModel.includes("llama-4-scout") || selectedModel.includes("llama-4-maverick")) && (
                <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  🎯 <strong>Vision Model Active:</strong> Images will be analyzed by the AI. Ask questions about what you see!
                </div>
              )}
              {isProcessing && (
                <div className="text-xs text-slate-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                  Processing images...
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="bg-slate-100 flex w-full items-center justify-between gap-2 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-2 text-sm border border-slate-200/50"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.type.startsWith('image/') ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img 
                            src={file.preview || URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Paperclip className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-slate-700 font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
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
            </div>
          )}

          <PromptInputTextarea 
            placeholder={
              files.length > 0 && selectedModel && (selectedModel.includes("llama-4-scout") || selectedModel.includes("llama-4-maverick"))
                ? "Ask me about the uploaded image(s)..."
                : "Ask me anything..."
            }
            disabled={isStreaming}
            className="min-h-[50px] sm:min-h-[60px] resize-none border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl sm:rounded-2xl text-base leading-relaxed px-4 py-3"
          />

          <PromptInputActions className="flex items-center justify-between gap-3 sm:gap-2 pt-3">
            <div className="flex items-center gap-3 sm:gap-2">
              

                <PromptInputAction tooltip={`${switchMode} mode - Click to cycle through modes`}>
                  <div className="flex items-center gap-3">
                    {/* CustomSwitch removed - will be replaced with separate components */}
                  </div>
                </PromptInputAction>

                {/* Search Mode Dropdown */}
                <PromptInputAction tooltip={selectedSearchMode ? `Click to deselect ${selectedSearchMode}` : "Select search mode"}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div 
                        className={`hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation ${
                          selectedSearchMode ? "bg-slate-200" : ""
                        }`}
                        onClick={(e) => {
                          // If a search mode is already selected, clicking will deselect it
                          if (selectedSearchMode) {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedSearchMode("")
                            toast.success("No mode selected")
                          }
                        }}
                      >
                        <div className="relative">
                          {selectedSearchMode === "X Posts" ? (
                            <FaXTwitter className="w-5 h-5 sm:w-4 sm:h-4 text-green-600" />
                          ) : selectedSearchMode === "Stocks" ? (
                            <FiTrendingUp className="w-5 h-5 sm:w-4 sm:h-4 text-purple-600" />
                          ) : selectedSearchMode === "Reddit" ? (
                            <IoLogoReddit className="w-5 h-5 sm:w-4 sm:h-4 text-orange-600" />
                          ) : selectedSearchMode === "Academic" ? (
                            <FiBookOpen className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-600" />
                          ) : selectedSearchMode === "Business" ? (
                            <MdBusiness className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-600" />
                          ) : selectedSearchMode === "Science" ? (
                            <MdScience className="w-5 h-5 sm:w-4 sm:h-4 text-cyan-600" />
                          ) : selectedSearchMode === "Images" ? (
                            <FiImage className="w-5 h-5 sm:w-4 sm:h-4 text-pink-600" />
                          ) : selectedSearchMode === "Videos" ? (
                            <FiVideo className="w-5 h-5 sm:w-4 sm:h-4 text-red-600" />
                          ) : selectedSearchMode === "Music" ? (
                            <FiMusic className="w-5 h-5 sm:w-4 sm:h-4 text-yellow-600" />
                          ) : selectedSearchMode === "YouTube" ? (
                            <FaYoutube className="w-5 h-5 sm:w-4 sm:h-4 text-red-500" />
                          ) : selectedSearchMode === "Spotify" ? (
                            <FaSpotify className="w-5 h-5 sm:w-4 sm:h-4 text-green-500" />
                          ) : (
                            <TbWorldSearch className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" sideOffset={5}>
                      <div className="px-2 py-1.5 text-sm font-medium text-slate-700 border-b border-slate-200">
                        Search Modes
                      </div>
                      <div className="p-2 border-b border-slate-200">
                        <div className="relative">
                          <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search modes..."
                            className="w-full pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery("");
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors"
                              aria-label="Clear search"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {/* None option to deselect search mode */}
                      <DropdownMenuItem 
                        className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700"
                        onClick={() => {
                          setSelectedSearchMode("")
                          toast.success("No mode selected")
                        }}
                      >
                        <span>None (Default)</span>
                        {!selectedSearchMode && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {[
                        { id: "Web Search", icon: () => <TbWorldSearch className="w-4 h-4 text-blue-600" />, color: "text-blue-600" },
                        { id: "X Posts", icon: () => <FaXTwitter className="w-4 h-4 text-green-600" />, color: "text-green-600" },
                        { id: "Stocks", icon: () => <FiTrendingUp className="w-4 h-4 text-purple-600" />, color: "text-purple-600" },
                        { id: "Reddit", icon: () => <IoLogoReddit className="w-4 h-4 text-orange-600" />, color: "text-orange-600" },
                        { id: "Academic", icon: () => <FiBookOpen className="w-4 h-4 text-indigo-600" />, color: "text-indigo-600" },
                        { id: "Business", icon: () => <MdBusiness className="w-4 h-4 text-emerald-600" />, color: "text-emerald-600" },
                        { id: "Science", icon: () => <MdScience className="w-4 h-4 text-cyan-600" />, color: "text-cyan-600" },
                        { id: "Images", icon: () => <FiImage className="w-4 h-4 text-pink-600" />, color: "text-pink-600" },
                        { id: "Videos", icon: () => <FiVideo className="w-4 h-4 text-red-600" />, color: "text-red-600" },
                        { id: "Music", icon: () => <FiMusic className="w-4 h-4 text-yellow-600" />, color: "text-yellow-600" },
                        { id: "YouTube", icon: () => <FaYoutube className="w-4 h-4 text-red-500" />, color: "text-red-500" },
                        { id: "Spotify", icon: () => <FaSpotify className="w-4 h-4 text-green-500" />, color: "text-green-500" }
                      ].filter(mode => 
                        !searchQuery || mode.id.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((mode) => (
                        <DropdownMenuItem 
                          key={mode.id}
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setSelectedSearchMode(mode.id)
                            toast.success(`${mode.id} mode`)
                          }}
                        >
                          {mode.icon()}
                          <span>{mode.id}</span>
                          {selectedSearchMode === mode.id && (
                            <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PromptInputAction>

                {/* Atom Icon - Deep Research Mode */}
                <PromptInputAction tooltip={`${switchMode === "atom" ? "Deep Research" : "Chat"} mode - Click to toggle`}>
                  <div 
                    className={`hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation ${
                      switchMode === "atom" ? "bg-slate-200 text-slate-800" : "text-slate-600"
                    }`}
                    onClick={() => {
                      const nextMode = switchMode === "search" ? "atom" : "search"
                      setSwitchMode(nextMode)
                      if (nextMode === "atom") {
                        toast.success("Deep Research mode")
                      } else {
                        toast.success("Chat mode")
                      }
                    }}
                  >
                    <TbAtomOff className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                </PromptInputAction>

              <PromptInputAction tooltip="Attach files">
                <FileUploadTrigger asChild>
                  <div className="hover:bg-slate-100 flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 touch-manipulation">
                    <Paperclip className="text-slate-600 w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                </FileUploadTrigger>
              </PromptInputAction>

              <PromptInputAction tooltip="Speech to text">
                <SpeechInput
                  apiKey={apiKey}
                  selectedModel={selectedModel}
                  onTranscriptChange={(transcript) => {
                    const currentInput = input
                    onInputChange(currentInput + (currentInput ? ' ' : '') + transcript)
                  }}
                />
              </PromptInputAction>
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
