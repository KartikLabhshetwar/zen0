"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { localStorageService, type Conversation, type Message } from "@/lib/local-storage"
import { Mem0Service } from "@/lib/mem0-service"
import { toast } from "sonner"
import {
  Sidebar,
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [reasoningText, setReasoningText] = useState("")
  const [showReasoning, setShowReasoning] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [showDataManager, setShowDataManager] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // On desktop, sidebar is always visible. On mobile, it starts collapsed
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })

  const [apiKey, setApiKey] = useState<string>("")
  const [mem0ApiKey, setMem0ApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")

  const [files, setFiles] = useState<File[]>([])

  // Flag to prevent multiple calls to loadLocalSettings
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Debounced input handler to prevent excessive re-renders
  const debouncedSetInput = useCallback((value: string) => {
    setInput(value)
  }, [])

  // Mem0 service instance - memoized to prevent recreation on every render
  const mem0Service = useMemo(() => {
    return mem0ApiKey ? new Mem0Service(mem0ApiKey) : null
  }, [mem0ApiKey])

  // Set global user ID for Mem0 (can be customized)
  useEffect(() => {
    if (mem0Service) {
      const globalUserId = "zen0-global-user";
      mem0Service.setGlobalUserId(globalUserId);
    }
  }, [mem0Service])

  useEffect(() => {
    // Only load settings once when component mounts, not on every mem0Service change
    loadLocalSettings()
    
    // Cleanup function for Mem0 service
    return () => {
      if (mem0Service && mem0Service.isReady()) {
        mem0Service.cleanup();
      }
      
      // Save current model selection before unmounting
      if (selectedModel) {
        localStorage.setItem('zen0-current-model', selectedModel)
      }
    };
  }, []) // Remove mem0Service dependency to prevent unnecessary re-runs

  // Show welcome message when Mem0 is first enabled
  useEffect(() => {
    if (mem0ApiKey) {
      const hasSeenMem0Welcome = sessionStorage.getItem('mem0-welcome-shown');
      if (!hasSeenMem0Welcome) {
        toast.success("🎉 Mem0 AI Memory enabled! Your conversations will now be enhanced with intelligent memory.", {
          duration: 2000,
        });
        sessionStorage.setItem('mem0-welcome-shown', 'true');
      }
    }
  }, [mem0ApiKey])

  useEffect(() => {
    fetchConversations()
  }, [])

  // Handle window resize for sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // On desktop, always show sidebar
        setSidebarCollapsed(false)
      } else {
        // On mobile, keep current state
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update selectedModel when currentConversation changes
  useEffect(() => {
    if (currentConversation && currentConversation.model && !selectedModel) {
      // Only update if we don't have a model selected, preventing override of user choice
      setSelectedModel(currentConversation.model)
    }
  }, [currentConversation?.model, selectedModel])

  // Initialize selected model from settings if not already set
  useEffect(() => {
    if (!selectedModel && settingsLoaded) {
      // First try to restore from localStorage backup
      const savedModel = localStorage.getItem('zen0-current-model')
      if (savedModel) {
        setSelectedModel(savedModel)
        return
      }
      
      // Fallback to settings
      const settings = localStorageService.getSettings()
      const defaultModel = settings.default_model || "llama-3.1-8b-instant"
      setSelectedModel(defaultModel)
    }
  }, [selectedModel, settingsLoaded])

  const loadLocalSettings = () => {
    if (settingsLoaded) {
      return // Prevent multiple calls
    }
    
    const settings = localStorageService.getSettings()
    setApiKey(settings.api_keys.groq || "")
    
    // Check if API keys exist in localStorage
    const keys = localStorage.getItem("zen0-api-keys")
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      const groqKey = parsedKeys.find((key: any) => key.provider === "groq")
      const mem0Key = parsedKeys.find((key: any) => key.provider === "mem0")
      
      if (groqKey && groqKey.key) {
        setApiKey(groqKey.key)
        
        // Only set default model if we don't have a current conversation AND no model is currently selected
        if (!currentConversation && !selectedModel) {
          // Use the model from the API key if available, otherwise use the stored default
          const modelToUse = groqKey.model || settings.default_model || "llama-3.1-8b-instant"
          setSelectedModel(modelToUse)
        }
      }
      
      if (mem0Key && mem0Key.key) {
        setMem0ApiKey(mem0Key.key)
      }
      
      setSettingsLoaded(true)
      return
    }

    // Only show API setup if no Groq key exists
    if (!settings.api_keys.groq) {
      setShowApiSetup(true)
    }
    
    setSettingsLoaded(true)
  }

  const fetchConversations = () => {
    const stored = localStorageService.getConversations()
    setConversations(stored)
  }

  const loadConversationMessages = (conversationId: string) => {
    const stored = localStorageService.getMessages(conversationId)
    setMessages(stored)
    
    // Only update selected model if we don't have one currently selected
    // This prevents overriding user's model selection when switching conversations
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation && conversation.model && !selectedModel) {
      setSelectedModel(conversation.model)
    }
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
    
    toast.success("Conversation deleted successfully!")
  }

  const createNewConversation = () => {
    if (!apiKey) {
      setShowApiSetup(true)
      return
    }

    // Ensure we have a valid model selected
    const modelToUse = selectedModel || "llama-3.1-8b-instant"
    
    const newConversation = localStorageService.createConversation({
      title: "New Chat",
      provider: "groq",
      model: modelToUse,
    })

    setConversations([newConversation, ...conversations])
    setCurrentConversation(newConversation)
    setMessages([])
    
    // Ensure the selected model stays consistent
    setSelectedModel(modelToUse)
    
    toast.success("New conversation created!")
  }

  const handleModelChange = useCallback((model: string) => {
    console.log('handleModelChange called with:', model)
    
    // Always update the selected model immediately
    setSelectedModel(model)
    
    // Backup to localStorage for persistence
    localStorage.setItem('zen0-current-model', model)
    
    // Update current conversation with new model if it exists
    if (currentConversation) {
      console.log('Updating conversation model to:', model)
      const updatedConversation = { ...currentConversation, model }
      setCurrentConversation(updatedConversation)
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      )
      setConversations(updatedConversations)
      
      // Save to localStorage
      localStorageService.updateConversation(currentConversation.id, { model })
    } else {
      console.log('No current conversation to update')
    }
    
    // Also save the model preference to user settings for future use
    localStorageService.updateDefaultModel(model)
    
  }, [currentConversation, conversations, localStorageService])

  const sendMessage = useCallback(async () => {
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
    const userInput = input.trim()

    // IMMEDIATE UI FEEDBACK - Show loading state right away
    setInput("")
    setIsProcessing(true)
    setIsStreaming(true)
    setStreamingMessage("")

    // Prepare user message
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      metadata: files.length > 0 ? { files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined,
    }
    
    // Update messages immediately for instant feedback
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveMessages(currentConversation.id, newMessages)
    
    // Update conversation title if it's the first message
    if (messages.length === 0) {
      const updatedConversations = conversations.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, title: userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput }
          : conv
      )
      setConversations(updatedConversations)
      const updatedConversation = { ...currentConversation, title: userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput }
      setCurrentConversation(updatedConversation)
      localStorageService.updateConversation(currentConversation.id, { title: userInput.length > 30 ? userInput.substring(0, 30) + "..." : userInput })
    }

    // Intelligent memory retrieval - only search when needed
    let relevantMemories: string[] = [];
    let shouldSearch = mem0Service ? mem0Service.shouldSearchMemories(userInput) : false;
    
    if (mem0Service && shouldSearch) {
      try {
        relevantMemories = await mem0Service.searchMemories(userInput, undefined, 5, 0.3);
      } catch (error) {
        console.error("❌ Failed to retrieve memories:", error);
      }
    } else if (mem0Service) {
      console.log(`⏭️ Skipping Mem0 search for general query: "${userInput}"`);
    }

    // Create clean messages for API (only role and content)
    let cleanMessagesForAPI = newMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Enhance messages with memories if available
    if (relevantMemories.length > 0) {
      const firstUserMessage = cleanMessagesForAPI.find(msg => msg.role === "user");
      if (firstUserMessage && firstUserMessage.content) {
        const memoryContext = `\n\n[Previous Context: ${relevantMemories.join(" | ")}]`;
        firstUserMessage.content += memoryContext;
      }
      
      cleanMessagesForAPI.unshift({
        role: "system",
        content: `You have access to previous context about this user. Use this information to provide personalized and contextual responses. The context is marked with [Previous Context: ...] in the user's message. IMPORTANT: Always respond with plain text or markdown. Never use HTML tags like <p>, <div>, etc. Use simple formatting like **bold**, *italic*, and line breaks for structure.`
      });
    }

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
                setStreamingMessage(completeMessage)
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
        // Check if this message contains personal information that should be stored as profile
        const userMessage = finalMessages.find(msg => msg.role === "user");
        if (userMessage && userMessage.content && (
            userMessage.content.toLowerCase().includes("my name is") || 
            userMessage.content.toLowerCase().includes("i am") || 
            userMessage.content.toLowerCase().includes("i'm"))) {
          // Store as user profile for future reference (only if service is available)
          if (mem0Service && mem0Service.isReady()) {
            mem0Service.storeUserProfile(userMessage.content, { 
              conversation_id: currentConversation.id,
              type: "user_introduction"
            });
          }
        }
        
        // Mem0 operations in background - non-blocking (only if service is available)
        if (mem0Service && mem0Service.isReady()) {
          Promise.all([
            // Store current conversation memories (now global)
            mem0Service.storeConversation(currentConversation.id, finalMessages)
          ]).catch((error: Error) => {
            console.error("Background Mem0 operations failed:", error);
            // Don't retry immediately to avoid API throttling
          });
        }
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
      setIsProcessing(false)
      setStreamingMessage("")
      setShowReasoning(false)
      setReasoningText("")
      setFiles([]) // Clear files after sending
    }
  }, [input, isStreaming, currentConversation, apiKey, messages, conversations, mem0Service, files])

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
    <div className="flex flex-col md:flex-row mobile-full-height md:h-screen bg-background overflow-hidden">
      {/* Mobile Backdrop - Only for mobile */}
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
            // Only update the selected model if the conversation has a different model
            if (conv.model && conv.model !== selectedModel) {
              setSelectedModel(conv.model)
            }
            loadConversationMessages(conv.id)
            // Only collapse sidebar on mobile
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
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden w-full max-w-full">
        {/* Mobile Header - Only show on mobile */}
        <div className="md:hidden flex-shrink-0">
          <MobileHeader onMenuToggle={() => setSidebarCollapsed(false)} />
        </div>

        {currentConversation ? (
          <>
            <div className="flex-1 overflow-hidden min-h-0">
              <ChatMessages 
                messages={messages}
                streamingMessage={streamingMessage}
                isStreaming={isStreaming}
                isProcessing={isProcessing}
                reasoningText={reasoningText}
                showReasoning={showReasoning}
              />
            </div>
            <div className="flex-shrink-0 border-t border-slate-100">
              <ResponseCopySection 
                streamingMessage={streamingMessage}
                isStreaming={isStreaming}
              />
              <ChatInput
                input={input}
                onInputChange={debouncedSetInput}
                onSubmit={sendMessage}
                isStreaming={isStreaming}
                files={files}
                onFilesChange={setFiles}
                onFileRemove={(index) => setFiles(files.filter((_, i) => i !== index))}
                apiKey={apiKey}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden min-h-0">
            <WelcomeScreen onNewConversation={createNewConversation} />
          </div>
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
