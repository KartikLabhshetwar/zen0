"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Plus, Send, Settings, Brain, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Conversation } from "@/lib/db"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
  metadata?: Record<string, any>
}

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for API keys in localStorage
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState<string>("groq")
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.1-8b-instant")
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false)

  useEffect(() => {
    if (!isPending && !session) {
      redirect("/auth/signin")
    }
  }, [session, isPending])

  useEffect(() => {
    // Load API keys from localStorage
    const keys = localStorage.getItem("zen0-api-keys")
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      const keyMap: Record<string, string> = {}

      parsedKeys.forEach((key: any) => {
        keyMap[key.provider] = key.key
      })

      setApiKeys(keyMap)
      setMemoryEnabled(!!keyMap.mem0)

      // Check if any keys are available
      if (Object.keys(keyMap).length === 0) {
        setShowApiSetup(true)
      }
    } else {
      setShowApiSetup(true)
    }
  }, [])

  useEffect(() => {
    // Load conversations
    if (session) {
      fetchConversations()
    }
  }, [session])

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error("Failed to load messages")
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const createNewConversation = async () => {
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Chat",
          provider: selectedProvider,
          model: selectedModel,
        }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setConversations((prev) => [newConversation, ...prev])
        setCurrentConversation(newConversation)
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !currentConversation) return
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    const userMessage: ChatMessage = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsStreaming(true)
    setStreamingMessage("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKeys[selectedProvider],
          conversationId: currentConversation.id,
          mem0ApiKey: apiKeys.mem0,
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

      // Add complete message to messages
      setMessages((prev) => [...prev, { role: "assistant", content: completeMessage }])
      setStreamingMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsStreaming(false)
    }
  }

  if (isPending) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (showApiSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-semibold mb-4">Setup API Keys</h2>
          <p className="text-sm text-muted-foreground mb-4">Please configure your API keys to start chatting.</p>
          <Button
            onClick={() => {
              setShowApiSetup(false)
              // Redirect to dashboard to setup API keys
              window.location.href = "/dashboard"
            }}
            className="w-full"
          >
            Configure API Keys
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b space-y-2">
          <Button onClick={createNewConversation} className="w-full" size="sm">
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
        </div>

        <ScrollArea className="flex-1 p-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative">
              <Button
                variant={currentConversation?.id === conv.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 h-auto p-3 pr-8"
                onClick={() => {
                  setCurrentConversation(conv)
                  loadConversationMessages(conv.id)
                }}
              >
                <div className="text-left truncate">
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {conv.provider} • {conv.model}
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
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

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-semibold">{currentConversation.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentConversation.provider} • {currentConversation.model}
                  </p>
                </div>
                {memoryEnabled && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Memory Active
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground">Loading conversation history...</div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
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
                          <div className="whitespace-pre-wrap">
                            {streamingMessage}
                            <span className="animate-pulse">▋</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    memoryEnabled ? "Ask me anything (I'll remember our conversation)..." : "Type your message..."
                  }
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={isStreaming || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to zen0</h2>
              <p className="text-muted-foreground mb-4">
                {memoryEnabled
                  ? "Create a new chat to start a conversation with memory-enhanced AI"
                  : "Create a new chat to get started"}
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
