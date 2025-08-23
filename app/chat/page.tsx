"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Plus, Send, Settings, Brain, Trash2, Database, Download, Upload as UploadIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BYOKSetup } from "@/components/byok-setup"
import { MarkdownRenderer } from "@/components/markdown-renderer"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [modelPreferences, setModelPreferences] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false)

  useEffect(() => {
    loadLocalSettings()
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [])

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
    setApiKeys(settings.api_keys)
    setSelectedProvider(settings.default_provider)
    setSelectedModel(settings.default_model)
    setMemoryEnabled(settings.memory_enabled)

    if (Object.keys(settings.api_keys).length === 0) {
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
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    const modelToUse = modelPreferences[selectedProvider] || selectedModel

    const newConversation = localStorageService.createConversation({
      title: "New Chat",
      provider: selectedProvider,
      model: modelToUse,
    })

    setConversations([newConversation, ...conversations])
    setCurrentConversation(newConversation)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !currentConversation) return
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
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
          provider: currentConversation.provider,
          model: currentConversation.model,
          apiKey: apiKeys[currentConversation.provider],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let completeMessage = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

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
              }
            } catch (e) {
              // Skip invalid JSON
            }
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
      setApiKeys({})
      setSelectedProvider("")
      setSelectedModel("")
      setMemoryEnabled(false)
      toast.success("All data cleared")
    }
  }

  if (showApiSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="w-full max-w-4xl p-8">
          <h2 className="text-xl font-semibold mb-4">Setup API Keys</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your API keys to start chatting with AI models.
          </p>
          <BYOKSetup />
          <Button
            onClick={() => {
              const keys = localStorage.getItem("zen0-api-keys")
              if (keys) {
                const parsedKeys = JSON.parse(keys)
                const keyMap: Record<string, string> = {}
                const modelMap: Record<string, string> = {}

                parsedKeys.forEach((key: any) => {
                  keyMap[key.provider] = key.key
                  if (key.model) {
                    modelMap[key.provider] = key.model
                  }
                })

                setApiKeys(keyMap)
                setModelPreferences(modelMap)
                setMemoryEnabled(!!keyMap.mem0)

                const availableProviders = Object.keys(keyMap)
                if (availableProviders.length > 0) {
                  const defaultProvider = availableProviders.includes("groq") ? "groq" : availableProviders[0]
                  setSelectedProvider(defaultProvider)
                  setSelectedModel(modelMap[defaultProvider] || "llama-3.1-8b-instant")
                  setShowApiSetup(false)
                }
              }
            }}
            className="w-full mt-4"
          >
            Continue to Chat
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 border-r bg-background flex flex-col">
        <div className="p-4 border-b space-y-2">
          <Button onClick={createNewConversation} className="w-full" {...({ size: "sm" } as any)}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          {memoryEnabled && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain className="w-3 h-3" />
              <span>Memory Enabled</span>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>Local Storage</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative">
              <Button
                {...({ variant: currentConversation?.id === conv.id ? "secondary" : "ghost" } as any)}
                className="w-full justify-start mb-1 h-auto p-3 pr-8"
                onClick={() => {
                  setCurrentConversation(conv)
                  loadConversationMessages(conv.id)
                }}
              >
                <div className="text-left truncate">
                  <div className="font-medium truncate flex items-center gap-2">
                    {conv.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {conv.provider} • {conv.model}
                  </div>
                </div>
              </Button>
              <Button
                {...({ variant: "ghost", size: "sm" } as any)}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(conv.id)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <Button {...({ variant: "ghost", size: "sm" } as any)} className="w-full justify-start" onClick={() => setShowApiSetup(true)}>
            <Settings className="w-4 h-4 mr-2" />
            API Settings
          </Button>
          <Dialog open={showDataManager} onOpenChange={setShowDataManager}>
            <DialogTrigger asChild>
              <Button {...({ variant: "ghost", size: "sm" } as any)} className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Data Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Data Management</DialogTitle>
                <DialogDescription>Export, import, or clear your local data</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={exportData} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button {...({ variant: "outline" } as any)} className="flex-1">
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
                <Button {...({ variant: "destructive" } as any)} onClick={clearAllData} className="w-full">
                  Clear All Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {currentConversation ? (
          <>
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <h1 className="font-semibold truncate">{currentConversation.title}</h1>
                    <p className="text-sm text-muted-foreground truncate">
                      {currentConversation.provider} • {currentConversation.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {memoryEnabled && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Brain className="w-3 h-3" />
                      Memory Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      )}
                      {message.created_at && (
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <MarkdownRenderer content={streamingMessage + "▋"} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    memoryEnabled
                      ? "Ask me anything..."
                      : "Type your message..."
                  }
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isStreaming || !input.trim()}
                  {...({ size: "sm" } as any)}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to zen0</h2>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                {memoryEnabled
                  ? "Create a new chat to start a conversation with memory-enhanced AI"
                  : "Create a new chat to get started with AI conversations"}
              </p>
              <Button onClick={createNewConversation}>
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
