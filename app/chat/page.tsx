"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Plus, Send, Settings, Brain, Trash2, Upload, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BYOKSetup } from "@/components/byok-setup"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  created_at?: string
  metadata?: Record<string, any>
  image?: string
  imageUrl?: string
}

interface Conversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [modelPreferences, setModelPreferences] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(false)

  useEffect(() => {
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
      if (availableProviders.length > 0 && !selectedProvider) {
        const defaultProvider = availableProviders.includes("groq") ? "groq" : availableProviders[0]
        setSelectedProvider(defaultProvider)
        setSelectedModel(modelMap[defaultProvider] || "llama-3.1-8b-instant")
      }

      if (Object.keys(keyMap).length === 0) {
        setShowApiSetup(true)
      }
    } else {
      setShowApiSetup(true)
    }
  }, [selectedProvider])

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  const fetchConversations = async () => {
    const stored = localStorage.getItem("zen0-conversations")
    if (stored) {
      setConversations(JSON.parse(stored))
    }
  }

  const saveConversations = (convs: Conversation[]) => {
    localStorage.setItem("zen0-conversations", JSON.stringify(convs))
    setConversations(convs)
  }

  const loadConversationMessages = async (conversationId: string) => {
    const stored = localStorage.getItem(`zen0-messages-${conversationId}`)
    if (stored) {
      setMessages(JSON.parse(stored))
    } else {
      setMessages([])
    }
  }

  const saveMessages = (conversationId: string, msgs: ChatMessage[]) => {
    localStorage.setItem(`zen0-messages-${conversationId}`, JSON.stringify(msgs))
  }

  const deleteConversation = async (conversationId: string) => {
    const updatedConversations = conversations.filter((conv) => conv.id !== conversationId)
    saveConversations(updatedConversations)

    localStorage.removeItem(`zen0-messages-${conversationId}`)

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
      setMessages([])
    }
  }

  const createNewConversation = async () => {
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    const modelToUse = modelPreferences[selectedProvider] || selectedModel

    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      provider: selectedProvider,
      model: modelToUse,
      created_at: new Date().toISOString(),
    }

    const updatedConversations = [newConversation, ...conversations]
    saveConversations(updatedConversations)
    setCurrentConversation(newConversation)
    setMessages([])
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeUploadedImage = () => {
    setUploadedImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const generateImage = async (prompt: string) => {
    if (!apiKeys.openai) {
      alert("OpenAI API key required for image generation")
      return
    }

    setIsStreaming(true)
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          apiKey: apiKeys.openai,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()
      const imageMessage: ChatMessage = {
        role: "assistant",
        content: `Generated image for: "${prompt}"`,
        imageUrl: data.imageUrl,
        created_at: new Date().toISOString(),
      }

      const newMessages = [...messages, imageMessage]
      setMessages(newMessages)
      if (currentConversation) {
        saveMessages(currentConversation.id, newMessages)
      }
    } catch (error) {
      console.error("Image generation failed:", error)
    } finally {
      setIsStreaming(false)
    }
  }

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || isStreaming || !currentConversation) return
    if (!apiKeys[selectedProvider]) {
      setShowApiSetup(true)
      return
    }

    if (input.toLowerCase().startsWith("/generate ") || input.toLowerCase().startsWith("/image ")) {
      const prompt = input.replace(/^\/(generate|image)\s+/i, "")
      if (prompt.trim()) {
        const userMessage: ChatMessage = { role: "user", content: input }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        saveMessages(currentConversation.id, newMessages)
        setInput("")
        await generateImage(prompt)
      }
      return
    }

    let messageContent = input
    if (uploadedImage && imageFile) {
      try {
        setIsStreaming(true) // Show loading state during OCR
        setStreamingMessage("Extracting text from image...")

        const extractedText = await extractTextFromImage(uploadedImage)
        if (extractedText.trim()) {
          messageContent = input
            ? `${input}\n\n[Extracted text from image: ${extractedText}]`
            : `[Extracted text from image: ${extractedText}]`
        }

        setStreamingMessage("")
        setIsStreaming(false)
      } catch (error) {
        console.error("OCR failed:", error)
        setStreamingMessage("")
        setIsStreaming(false)
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
      ...(uploadedImage && { image: uploadedImage }),
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveMessages(currentConversation.id, newMessages)
    setInput("")
    removeUploadedImage()
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
          conversationId: currentConversation.id,
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

      const finalMessages = [...newMessages, { role: "assistant", content: completeMessage }]
      setMessages(finalMessages)
      saveMessages(currentConversation.id, finalMessages)
      setStreamingMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsStreaming(false)
    }
  }

  const extractTextFromImage = async (imageDataUrl: string): Promise<string> => {
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      })

      if (!response.ok) {
        throw new Error("OCR failed")
      }

      const data = await response.json()
      return data.text || ""
    } catch (error) {
      console.error("OCR extraction failed:", error)
      return ""
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
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setShowApiSetup(true)}>
            <Settings className="w-4 h-4 mr-2" />
            API Settings
          </Button>
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
                {memoryEnabled && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Brain className="w-3 h-3" />
                    Memory Active
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.image && (
                        <div className="mb-2">
                          <img
                            src={message.image || "/placeholder.svg"}
                            alt="Uploaded image"
                            className="max-w-full h-auto rounded-lg"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      )}
                      {message.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="Generated image"
                            className="max-w-full h-auto rounded-lg"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      )}
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
              {uploadedImage && (
                <div className="max-w-3xl mx-auto mb-3">
                  <div className="relative inline-block">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Upload preview"
                      className="max-h-32 rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeUploadedImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 max-w-3xl mx-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="px-3"
                >
                  <Upload className="w-4 h-4" />
                </Button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    memoryEnabled
                      ? "Ask me anything, upload an image, or use /generate for image creation..."
                      : "Type your message, upload an image, or use /generate for image creation..."
                  }
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isStreaming}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isStreaming || (!input.trim() && !uploadedImage)}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-w-3xl mx-auto mt-2">
                <p className="text-xs text-muted-foreground text-center">
                  Use <code>/generate [prompt]</code> or <code>/image [prompt]</code> to create images with DALL-E
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to zen0</h2>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                {memoryEnabled
                  ? "Create a new chat to start a conversation with memory-enhanced AI, image uploads, and generation"
                  : "Create a new chat to get started with AI conversations, image uploads, and generation"}
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
