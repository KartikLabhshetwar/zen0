"use client"

import { useState, useEffect } from "react"
import { localStorageService, type Conversation, type Message } from "@/lib/local-storage"
import { Mem0Service } from "@/lib/mem0-service"
import { toast } from "sonner"
import {
  Sidebar,
  ChatHeader,
  ChatMessages,
  ChatInput,
  WelcomeScreen,
  MobileHeader,
  ResponseCopySection,
  ApiSetupScreen,
  DataManagerDialog
} from "@/components/chat"

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

  const [apiKey, setApiKey] = useState<string>("")
  const [mem0ApiKey, setMem0ApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")

  const [files, setFiles] = useState<File[]>([])

  // Mem0 service instance
  const mem0Service = mem0ApiKey ? Mem0Service.getInstance(mem0ApiKey) : null

  // Set global user ID for Mem0 (can be customized)
  useEffect(() => {
    if (mem0Service) {
      const globalUserId = "zen0-global-user";
      mem0Service.setGlobalUserId(globalUserId);
    }
  }, [mem0Service])

  useEffect(() => {
    loadLocalSettings()
    
    // Cleanup function for Mem0 service
    return () => {
      if (mem0Service) {
        mem0Service.flushBatch().then(() => {
          mem0Service.cleanup();
        });
      }
    };
  }, [mem0Service])

  // Show welcome message when Mem0 is first enabled
  useEffect(() => {
    if (mem0ApiKey) {
      const hasSeenMem0Welcome = sessionStorage.getItem('mem0-welcome-shown');
      if (!hasSeenMem0Welcome) {
        toast.success("🎉 Mem0 AI Memory enabled! Your conversations will now be enhanced with intelligent memory.", {
          duration: 5000,
          description: "The AI will learn from your interactions and provide better, more contextual responses."
        });
        sessionStorage.setItem('mem0-welcome-shown', 'true');
      }
    }
  }, [mem0ApiKey])

  useEffect(() => {
    fetchConversations()
  }, [])

  const loadLocalSettings = () => {
    const settings = localStorageService.getSettings()
    setApiKey(settings.api_keys.groq || "")
    setSelectedModel(settings.default_model || "")

    // Check if API keys exist in localStorage
    const keys = localStorage.getItem("zen0-api-keys")
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      const groqKey = parsedKeys.find((key: any) => key.provider === "groq")
      const mem0Key = parsedKeys.find((key: any) => key.provider === "mem0")
      
      if (groqKey && groqKey.key) {
        setApiKey(groqKey.key)
        setSelectedModel(groqKey.model || "llama-3.1-8b-instant")
      }
      
      if (mem0Key && mem0Key.key) {
        setMem0ApiKey(mem0Key.key)
      }
      
      return
    }

    // Only show API setup if no Groq key exists
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
    if (!currentConversation.id) {
      console.error("Conversation ID is missing");
      return;
    }
    if (!apiKey) {
      setShowApiSetup(true)
      return
    }

    const startTime = performance.now()

    // Prepare messages for sending
    let messagesToSend = [...messages];

    // Retrieve relevant memories BEFORE sending to AI for better context
    let relevantMemories: string[] = [];
    if (mem0Service) {
      try {
        // Use a more general search query to find relevant user information
        let searchQuery = input;
        
        // For questions about the user, use a broader search
        if (input.toLowerCase().includes("my name") || input.toLowerCase().includes("what is my") || input.toLowerCase().includes("who am i")) {
          searchQuery = "user information personal details preferences";
        }
        
        relevantMemories = await mem0Service.searchMemories(searchQuery, undefined, 5);
      } catch (error) {
        console.error("Failed to retrieve memories:", error);
        // Continue without memories if retrieval fails
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      metadata: files.length > 0 ? { files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined,
    }
    const newMessages = [...messagesToSend, userMessage]
    setMessages(newMessages)
    saveMessages(currentConversation.id, newMessages)
    
    // Memory storage will happen AFTER streaming completes to avoid slowing down the response
    
    // Create clean messages for API (only role and content)
    let cleanMessagesForAPI = newMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Enhance the first user message with relevant memories if available
    if (relevantMemories.length > 0 && cleanMessagesForAPI.length > 0) {
      const firstUserMessage = cleanMessagesForAPI.find(msg => msg.role === "user");
      if (firstUserMessage && firstUserMessage.content) {
        const memoryContext = `\n\n[Previous Context: ${relevantMemories.join(" | ")}]`;
        firstUserMessage.content += memoryContext;
      }
    }

    // Add system message to instruct AI to use memory context
    if (relevantMemories.length > 0) {
      cleanMessagesForAPI.unshift({
        role: "system",
        content: `You have access to previous context about this user. Use this information to provide personalized and contextual responses. The context is marked with [Previous Context: ...] in the user's message.`
      });
    }
    
    // Update conversation title to first user message if it's the first message
    if (messages.length === 0) {
      const updatedConversations = conversations.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, title: input.length > 30 ? input.substring(0, 30) + "..." : input }
          : conv
      )
      setConversations(updatedConversations)
      const updatedConversation = { ...currentConversation, title: input.length > 30 ? input.substring(0, 30) + "..." : input }
      setCurrentConversation(updatedConversation)
      localStorageService.updateConversation(currentConversation.id, { title: input.length > 30 ? input.substring(0, 30) + "..." : input })
    }
    
    setInput("")
    setIsStreaming(true)
    setStreamingMessage("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: cleanMessagesForAPI,
          model: currentConversation.model,
          apiKey: apiKey,
          conversationId: currentConversation.id,
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
                // Only update state if the message has changed to prevent unnecessary re-renders
                setStreamingMessage(prev => {
                  if (prev !== completeMessage) {
                    return completeMessage
                  }
                  return prev
                })
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

      // Ensure final message is set correctly
      setStreamingMessage(completeMessage)

      // Add the final message to the messages array
      const finalMessages: ChatMessage[] = [...newMessages, { role: "assistant", content: completeMessage }]
      setMessages(finalMessages)
      saveMessages(currentConversation.id, finalMessages)

      // Performance monitoring
      const responseTime = performance.now() - startTime
      console.log(`[zen0] Response time: ${responseTime.toFixed(2)}ms`)

      // Memory operations in background - don't block the UI
      if (mem0Service) {
        // Local storage is fast, do it immediately
        localStorageService.storeMemory(currentConversation.id, finalMessages)
        
        // Check if this message contains personal information that should be stored as profile
        const userMessage = finalMessages.find(msg => msg.role === "user");
        if (userMessage && userMessage.content && (
            userMessage.content.toLowerCase().includes("my name is") || 
            userMessage.content.toLowerCase().includes("i am") || 
            userMessage.content.toLowerCase().includes("i'm"))) {
          // Store as user profile for future reference
          mem0Service.storeUserProfile(userMessage.content, { 
            conversation_id: currentConversation.id,
            type: "user_introduction"
          });
        }
        
        // Mem0 operations in background - non-blocking
        Promise.all([
          // Store current conversation memories (now global)
          mem0Service.storeMemories(currentConversation.id, finalMessages)
        ]).catch((error: Error) => {
          console.error("Background Mem0 operations failed:", error);
          // Don't retry immediately to avoid API throttling
        });
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
      setMem0ApiKey("")
      setSelectedModel("llama-3.1-8b-instant")
      setFiles([])
      toast.success("All data cleared")
    }
  }

  if (showApiSetup) {
    return (
      <ApiSetupScreen
        onBackToChat={() => setShowApiSetup(false)}
        onContinueToChat={() => {
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
              } else if (key.provider === "mem0") {
                keyMap[key.provider] = key.key
              }
            })

            setApiKey(keyMap.groq || "")
            setMem0ApiKey(keyMap.mem0 || "")
            setSelectedModel(modelMap.groq || "llama-3.1-8b-instant")

            if (keyMap.groq) {
              setShowApiSetup(false)
            }
          }
        }}
      />
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
      
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewConversation={createNewConversation}
        onConversationSelect={(conv) => {
          if (conv.id) {
            setCurrentConversation(conv)
            loadConversationMessages(conv.id)
            if (window.innerWidth < 768) {
              setSidebarCollapsed(true)
            }
          }
        }}
        onConversationDelete={deleteConversation}
        onShowApiSetup={() => setShowApiSetup(true)}
        onShowDataManager={() => setShowDataManager(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <MobileHeader onMenuToggle={() => setSidebarCollapsed(false)} />

        {currentConversation ? (
          <>
            <ChatHeader conversation={currentConversation} />
            <ChatMessages 
              messages={messages}
              streamingMessage={streamingMessage}
              isStreaming={isStreaming}
            />
            <ResponseCopySection 
              streamingMessage={streamingMessage}
              isStreaming={isStreaming}
            />
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={sendMessage}
              isStreaming={isStreaming}
              files={files}
              onFilesChange={setFiles}
              onFileRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
            />
          </>
        ) : (
          <WelcomeScreen onNewConversation={createNewConversation} />
        )}
      </div>

      <DataManagerDialog
        open={showDataManager}
        onOpenChange={setShowDataManager}
        onExport={exportData}
        onImport={importData}
        onClearAll={clearAllData}
      />
    </div>
  )
}
