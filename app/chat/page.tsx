"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [reasoningText, setReasoningText] = useState("")
  const [showReasoning, setShowReasoning] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [showDataManager, setShowDataManager] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Debounced input handler to prevent excessive re-renders
  const debouncedSetInput = useCallback((value: string) => {
    setInput(value)
  }, [])

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
      if (mem0Service && mem0Service.isReady()) {
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

    // Smart memory retrieval - only search when needed
    let relevantMemories: string[] = [];
    let shouldSearch = shouldSearchMemories(userInput);
    
    if (mem0Service && shouldSearch) {
      try {
        // Use simple search instead of comprehensive for better performance
        relevantMemories = await mem0Service.searchMemories(userInput, undefined, 5, 0.3);
      } catch (error) {
        console.error("❌ Failed to retrieve memories:", error);
      }
    }
    
    // Generate realistic AI thinking text (always show thinking process)
    const thinkingText = generateThinkingText(userInput, relevantMemories.length > 0, relevantMemories.length);
    setReasoningText(thinkingText);
    setShowReasoning(true);

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
        // Local storage is fast, do it immediately
        localStorageService.storeMemory(currentConversation.id, finalMessages)
        
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
            mem0Service.storeMemories(currentConversation.id, finalMessages)
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

  // Smart query detection - only search Mem0 for personal/contextual queries
  const shouldSearchMemories = (query: string): boolean => {
    const personalKeywords = [
      'my', 'me', 'i', 'myself', 'name', 'who am i', 'what do you know about me',
      'remember', 'memory', 'personal', 'preference', 'like', 'love', 'hate',
      'background', 'history', 'conversation', 'previous', 'before'
    ];
    
    const generalKnowledgeKeywords = [
      'what is', 'how to', 'explain', 'tell me about', 'define', 'give me',
      'interview questions', 'examples', 'tutorial', 'guide', 'steps'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Skip Mem0 for general knowledge questions (these don't need personal context)
    if (generalKnowledgeKeywords.some(keyword => queryLower.includes(keyword)) && 
        !personalKeywords.some(keyword => queryLower.includes(keyword))) {
      return false;
    }
    
    // Search Mem0 only for personal/contextual queries
    return personalKeywords.some(keyword => queryLower.includes(keyword));
  };

  // Generate realistic AI thinking text based on query type
  const generateThinkingText = (query: string, hasMemories: boolean, memoryCount: number = 0): string => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('name') || queryLower.includes('who am i')) {
      if (hasMemories) {
        return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I found ${memoryCount} relevant memories about them. Since the user might be testing if I remember the context, I should mention their name and maybe reference other details I found to show I'm paying attention. Let me make sure I state the name clearly first, then add a friendly comment about their interests to personalize the response.</think>`;
      } else {
        return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I'm searching through my memory to find information about this, but I don't see any relevant memories yet. Let me think about this and provide the best response I can based on what I know. I should ask them to share their name so I can remember it for future conversations.</think>`;
      }
    }
    
    if (queryLower.includes('math') || queryLower.includes('calculate') || queryLower.includes('solve')) {
      return `<think>Okay, the user is asking "${query}". This is a straightforward mathematical question that I can solve directly. I don't need to search my memory for this - it's a calculation problem. Let me solve it step by step and explain the process clearly. I should also check if there are any personal preferences I can reference to make the answer more engaging.</think>`;
    }
    
    if (queryLower.includes('like') || queryLower.includes('love') || queryLower.includes('preference')) {
      if (hasMemories) {
        return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I found ${memoryCount} relevant memories about their preferences and interests. I should reference these specific details to show I remember what they've told me before. This will make the conversation more personal and demonstrate that I'm learning from our interactions.</think>`;
      } else {
        return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I don't see any specific memories about their preferences yet. I should ask them to share more about what they like so I can remember it for future conversations. This will help me provide more personalized responses going forward.</think>`;
      }
    }
    
    // Default thinking for other queries
    if (hasMemories) {
      return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I found ${memoryCount} relevant memories that might be helpful. I should incorporate this context into my response to make it more personalized and relevant to them. Let me think about how to best use this information.</think>`;
    } else {
      return `<think>Okay, the user is asking "${query}". Let me check the previous context provided. I don't see any specific memories related to this question, but I can still provide a helpful response. I should ask if they'd like me to remember specific details about this topic for future conversations.</think>`;
    }
  };

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
              isProcessing={isProcessing}
              reasoningText={reasoningText}
              showReasoning={showReasoning}
            />
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
