"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Plus, Settings, Brain, Trash2, Database, Download, Upload as UploadIcon, Paperclip, X, ChevronsLeft, ChevronsRight, Menu, ArrowUp, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BYOKSetup } from "@/components/byok-setup"
import { Markdown } from "@/components/ui/markdown"
import { localStorageService, type Conversation, type Message } from "@/lib/local-storage"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "@/components/ui/prompt-input"
import { FileUpload, FileUploadTrigger, FileUploadContent } from "@/components/ui/file-upload"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
  metadata?: Record<string, any>
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [showDataManager, setShowDataManager] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [apiKey, setApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    loadLocalSettings()
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [])

  // Auto-redirect to chat if API key is already configured
  // useEffect(() => {
  //   const keys = localStorage.getItem("zen0-api-keys")
  //   if (keys) {
  //     const parsedKeys = JSON.parse(keys)
  //     const groqKey = parsedKeys.find((key: any) => key.provider === "groq")
  //     if (groqKey && groqKey.key && showApiSetup) {
  //       setApiKey(groqKey.key)
  //       setSelectedModel(groqKey.model || "llama-3.1-8b-instant")
  //       setShowApiSetup(false)
  //     }
  //   }
  // }, [showApiSetup])

  useEffect(() => {
    // Only auto-scroll when not streaming to prevent jittering
    if (!isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isStreaming])

  // Stable scroll to bottom during streaming
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  // Update scroll position when streaming message changes
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [streamingMessage, isStreaming, scrollToBottom])

  const loadLocalSettings = () => {
    const settings = localStorageService.getSettings()
    setApiKey(settings.api_keys.groq || "")
    setSelectedModel(settings.default_model || "")
    setMemoryEnabled(settings.memory_enabled)

    // Check if API key exists in localStorage
    const keys = localStorage.getItem("zen0-api-keys")
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      const groqKey = parsedKeys.find((key: any) => key.provider === "groq")
      if (groqKey && groqKey.key) {
        setApiKey(groqKey.key)
        setSelectedModel(groqKey.model || "llama-3.1-8b-instant")
        // Don't automatically hide API setup - let users access it manually
        // setShowApiSetup(false)
        return
      }
    }

    // Only show API setup if no key exists
    if (!settings.api_keys.groq) {
      setShowApiSetup(true)
    }
  }

  const fetchConversations = () => {
    const stored = localStorageService.getConversations()
    setConversations(stored)
  }

  const loadConversationMessages = (conversationId: string) => {
    const stored = localStorageService.getMessages(conversationId)
    setMessages(stored)
  }

  const saveMessages = (conversationId: string, msgs: ChatMessage[]) => {
    // Convert ChatMessage to Message format for storage
    const messagesForStorage: Message[] = msgs.map(msg => ({
      id: Date.now().toString(),
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata,
      created_at: msg.created_at || new Date().toISOString(),
    }))
    localStorageService.saveMessages(conversationId, messagesForStorage)
  }

  const deleteConversation = (conversationId: string) => {
    localStorageService.deleteConversation(conversationId)

    const updatedConversations = conversations.filter((conv) => conv.id !== conversationId)
    setConversations(updatedConversations)

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
      setMessages([])
    }
  }

  const createNewConversation = () => {
    if (!apiKey) {
      setShowApiSetup(true)
      return
    }

    const newConversation = localStorageService.createConversation({
      title: "New Chat",
      provider: "groq",
      model: selectedModel,
    })

    setConversations([newConversation, ...conversations])
    setCurrentConversation(newConversation)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !currentConversation) return
    if (!apiKey) {
      setShowApiSetup(true)
      return
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      metadata: files.length > 0 ? { files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined,
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveMessages(currentConversation.id, newMessages)
    setInput("")
    setIsStreaming(true)
    setStreamingMessage("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          model: currentConversation.model,
          apiKey: apiKey,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let completeMessage = ""
      let buffer = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines from the buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              
              if (content) {
                completeMessage += content
                setStreamingMessage(completeMessage)
                
                // Force a re-render for immediate UI update
                if (completeMessage.length % 3 === 0) {
                  setStreamingMessage(prev => prev)
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6)
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              completeMessage += content
              setStreamingMessage(completeMessage)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Add the final message to the messages array
      const finalMessages: ChatMessage[] = [...newMessages, { role: "assistant", content: completeMessage }]
      setMessages(finalMessages)
      saveMessages(currentConversation.id, finalMessages)

      // Store memory if enabled
      if (memoryEnabled) {
        localStorageService.storeMemory(currentConversation.id, finalMessages)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Add error message to chat
      const errorMessages: ChatMessage[] = [...newMessages, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]
      setMessages(errorMessages)
      saveMessages(currentConversation.id, errorMessages)
    } finally {
      setIsStreaming(false)
      setStreamingMessage("")
      setFiles([]) // Clear files after sending
    }
  }

  const exportData = () => {
    const data = localStorageService.exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zen0-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data exported successfully!")
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const jsonData = e.target?.result as string
        if (localStorageService.importData(jsonData)) {
          toast.success("Data imported successfully!")
          loadLocalSettings()
          fetchConversations()
        } else {
          toast.error("Failed to import data")
        }
      }
      reader.readAsText(file)
    }
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorageService.clearAllData()
      setConversations([])
      setCurrentConversation(null)
      setMessages([])
      setApiKey("")
      setSelectedModel("llama-3.1-8b-instant")
      setMemoryEnabled(false)
      setFiles([])
      toast.success("All data cleared")
    }
  }

  const handleFileChange = (files: File[]) => {
    setFiles((prev) => [...prev, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (showApiSetup) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back to Chat Button */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="outline"
              onClick={() => setShowApiSetup(false)}
              className="h-9 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
            >
              ← Back to Chat
            </Button>
          </div>
          
          <BYOKSetup />
          <div className="text-center mt-8 sm:mt-12">
            <Button
                onClick={() => {
                  const keys = localStorage.getItem("zen0-api-keys")
                  if (keys) {
                    const parsedKeys = JSON.parse(keys)
                    const keyMap: Record<string, string> = {}
                    const modelMap: Record<string, string> = {}

                    parsedKeys.forEach((key: any) => {
                      if (key.provider === "groq") {
                        keyMap[key.provider] = key.key
                        if (key.model) {
                          modelMap[key.provider] = key.model
                        }
                      }
                    })

                    setApiKey(keyMap.groq || "")
                    setSelectedModel(modelMap.groq || "llama-3.1-8b-instant")
                    setMemoryEnabled(!!keyMap.mem0)

                    if (keyMap.groq) {
                      setShowApiSetup(false)
                    }
                  }
                }}
                className="h-10 px-6 sm:px-8 bg-neutral-800 hover:bg-neutral-900 text-base font-medium rounded-full"
              >
              Continue to Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar - Mobile: Full width, Desktop: Fixed width, Collapsible */}
      <div className={`${sidebarCollapsed ? 'md:w-20 -translate-x-full md:translate-x-0' : 'md:w-80 translate-x-0'} w-full md:border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out md:relative absolute md:static z-30 h-full`}>
        {/* Sidebar Header with Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col items-center gap-3 mb-4">
            {sidebarCollapsed ? (
              <>
              <Link href="/" className="flex flex-col items-center gap-2">
                <div className="text-lg font-bold text-neutral-800">zen0</div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex h-8 w-8 p-0 rounded-md hover:bg-gray-100"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between w-full">
                  <Link href="/" className="text-lg font-bold text-neutral-800">zen0</Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden md:flex h-8 w-8 p-0 rounded-md hover:bg-gray-100"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={createNewConversation} 
                  className="md:w-full h-10 bg-neutral-800 hover:bg-neutral-900 font-medium rounded-lg transition-all duration-300 w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </>
            )}
            <div className="flex items-center gap-1 w-full justify-between md:justify-end">
              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(true)}
                className="md:hidden h-8 w-8 p-0 rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {!sidebarCollapsed && (
            <div className="space-y-3">
              {memoryEnabled && (
                <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                  <Brain className="w-4 h-4" />
                  <span className="font-medium">Memory Enabled</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0 ml-auto">
                    Active
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                <Database className="w-4 h-4" />
                <span className="font-medium">Local Storage</span>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          <div className="px-2">
            {conversations.map((conv) => (
              <div key={conv.id} className="group relative mb-1">
                <Button
                  {...({ variant: currentConversation?.id === conv.id ? "secondary" : "ghost" } as any)}
                  className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-auto py-3 px-2 text-left hover:bg-gray-100 rounded-lg transition-all duration-200`}
                  onClick={() => {
                    setCurrentConversation(conv)
                    loadConversationMessages(conv.id)
                    // Close sidebar on mobile after selecting conversation
                    if (window.innerWidth < 768) {
                      setSidebarCollapsed(true)
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    {sidebarCollapsed ? (
                      <div className="md:hidden flex flex-col items-start">
                        <div className="font-medium text-gray-900 truncate text-sm">{conv.title}</div>
                        <div className="text-xs text-gray-500 truncate mt-1">{conv.model}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <div className="font-medium text-gray-900 truncate text-sm">{conv.title}</div>
                        <div className="text-xs text-gray-500 truncate mt-1">{conv.model}</div>
                      </div>
                    )}
                  </div>
                </Button>
                <Button
                  {...({ variant: "ghost" } as any)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-gray-200 rounded-md z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(conv.id)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-gray-200">
          <div className="space-y-1">
            <Button 
              {...({ variant: "ghost" } as any)} 
              className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200`} 
              onClick={() => setShowApiSetup(true)}
            >
              <Settings className="w-4 h-4 md:mr-0 mr-3" />
              {!sidebarCollapsed && <span className="md:ml-3">API Settings</span>}
            </Button>
            <Dialog open={showDataManager} onOpenChange={setShowDataManager}>
              <DialogTrigger asChild>
                <Button 
                  {...({ variant: "ghost" } as any)} 
                  className={`${sidebarCollapsed ? 'md:w-12 md:px-0 md:justify-center' : 'md:w-full md:justify-start'} w-full justify-start h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200`}
                >
                  <Database className="w-4 h-4 md:mr-0 mr-3" />
                  {!sidebarCollapsed && <span className="md:ml-3">Data Manager</span>}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[90vw] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Data Management</DialogTitle>
                  <DialogDescription>Export, import, or clear your local data</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Button onClick={exportData} className="w-full h-10 bg-gray-900 hover:bg-gray-800 rounded-lg">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button {...({ variant: "outline" } as any)} className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
                      <label className="flex items-center justify-center w-full cursor-pointer">
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Import Data
                        <input
                          type="file"
                          accept=".json"
                          onChange={importData}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>
                  <Button {...({ variant: "destructive" } as any)} onClick={clearAllData} className="w-full h-10 rounded-lg">
                    Clear All Data
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden p-3 border-b border-gray-200 bg-white">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="h-9 px-3 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
          >
            <Menu className="w-4 h-4 mr-2" />
            Menu
          </Button>
        </div>

        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{currentConversation.title}</h1>
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {currentConversation.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {memoryEnabled && (
                    <Badge variant="outline" className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border-0 px-2.5 py-1">
                      <Brain className="w-3 h-3" />
                      Memory Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                      <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user" ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                      {message.role === "assistant" ? (
                        <Markdown className="prose prose-sm max-w-none dark:prose-invert [&>*]:!leading-relaxed [&>*]:!m-0 [&>*+*]:!mt-3">
                          {message.content}
                        </Markdown>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                          {message.metadata?.files && (
                            <div className="mt-3 pt-3 border-t border-gray-300/30">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span>Attached files: {message.metadata.files.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {message.metadata.files.map((file: any, fileIndex: number) => (
                                    <div key={fileIndex} className="flex items-center gap-2 text-xs bg-gray-800/50 px-2.5 py-1.5 rounded-md">
                                      {file.type?.startsWith('image/') ? (
                                        <div className="w-4 h-4 rounded bg-gray-700 flex items-center justify-center">
                                          <span className="text-[10px] text-gray-300">🖼️</span>
                                        </div>
                                      ) : (
                                        <Paperclip className="w-3.5 h-3.5" />
                                      )}
                                      <span className="text-gray-300 max-w-[80px] truncate">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {message.created_at && (
                        <div className="text-xs opacity-70 mt-3 text-right">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[80%] rounded-2xl p-4 bg-gray-100 text-gray-900">
                      <Markdown className="prose prose-sm max-w-none dark:prose-invert [&>*]:!leading-relaxed [&>*]:!m-0 [&>*+*]:!mt-3">
                        {streamingMessage}
                      </Markdown>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <div className="max-w-3xl mx-auto">
                <FileUpload
                  onFilesAdded={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.md"
                >
                  <PromptInput
                    value={input}
                    onValueChange={setInput}
                    isLoading={isStreaming}
                    onSubmit={sendMessage}
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
                              onClick={() => handleRemoveFile(index)}
                              className="hover:bg-gray-200 rounded-full p-1 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <PromptInputTextarea 
                      placeholder={
                        memoryEnabled
                          ? "Ask me anything..."
                          : "Type your message..."
                      }
                      disabled={isStreaming}
                      className="min-h-[60px] resize-none border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    />

                    <PromptInputActions className="flex items-center justify-between gap-2 pt-3">
                      <PromptInputAction tooltip="Attach files">
                        <FileUploadTrigger asChild>
                          <div className="hover:bg-gray-100 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors">
                            <Paperclip className="text-gray-600 w-4 h-4" />
                          </div>
                        </FileUploadTrigger>
                      </PromptInputAction>

                      <PromptInputAction tooltip="Send message">
                        <Button
                          variant="default"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-neutral-700 hover:bg-neutral-900"
                          onClick={sendMessage}
                          disabled={isStreaming || (!input.trim() && files.length === 0)}
                        >
                          {isStreaming ? (
                            <Square className="w-4 h-4 fill-current" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-xs sm:max-w-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-gray-900 mb-2">Welcome to zen0</h2>
              <p className="text-gray-600 mb-6 text-center leading-relaxed text-sm">
                {memoryEnabled
                  ? "Create a new chat to start a conversation with memory-enhanced AI"
                  : "Create a new chat to get started with AI conversations"}
              </p>
              <Button onClick={createNewConversation} className="h-10 px-6 bg-gray-900 hover:bg-gray-800 text-base font-medium rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
