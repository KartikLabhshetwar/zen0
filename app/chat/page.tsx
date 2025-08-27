"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

import { Mem0Service } from "@/lib/mem0-service"
import { conversationService, type Conversation } from "@/lib/conversation-service"
import { toast } from "sonner"

import {
  ChatMessages,
  ChatInput,
  ResponseCopySection,
  ApiSetupScreen,
  ConversationSidebar,
  ChatHeader
} from "@/components/chat"



interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string | Array<{
    type: "text" | "image_url"
    text?: string
    image_url?: { url: string }
  }>
  created_at?: string
  metadata?: Record<string, any>
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [reasoningText, setReasoningText] = useState("")
  const [showReasoning, setShowReasoning] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)

  const [apiKey, setApiKey] = useState<string>("")
  const [mem0ApiKey, setMem0ApiKey] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [currentConversationId, setCurrentConversationId] = useState<string>("")

  const [files, setFiles] = useState<File[]>([])

  // Flag to prevent multiple calls to loadLocalSettings
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Helper function to check if a model supports vision
  const isVisionModel = useCallback((modelId: string) => {
    return modelId && (modelId.includes("llama-4-scout") || modelId.includes("llama-4-maverick"));
  }, []);

  // Helper function to convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data:image/...;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }, []);

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

  // Initialize conversation and load settings
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await loadLocalSettings()
        
        // Clean up any corrupted data first
        await conversationService.cleanupCorruptedData()
        
        // Only set a conversation if none is currently selected and one exists
        if (!currentConversationId) {
          const mostRecentConvo = await conversationService.getMostRecentConversation()
          if (mostRecentConvo) {
            setCurrentConversationId(mostRecentConvo.id)
            // Load messages for the most recent conversation
            await loadConversationMessages(mostRecentConvo.id)
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error)
        toast.error("Failed to initialize chat")
      }
    }
    
    initializeChat()
    
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

  // Initialize selected model from settings if not already set
  useEffect(() => {
    if (!selectedModel && settingsLoaded) {
      // First try to restore from localStorage backup
      const savedModel = localStorage.getItem('zen0-current-model')
      if (savedModel) {
        setSelectedModel(savedModel)
        return
      }
      
      // Fallback to default model
      setSelectedModel("llama3-8b-8192")
    }
  }, [selectedModel, settingsLoaded])

  const loadLocalSettings = () => {
    if (settingsLoaded) {
      return // Prevent multiple calls
    }
    
    // Check if API keys exist in localStorage
    const keys = localStorage.getItem("zen0-api-keys")
    if (keys) {
      const parsedKeys = JSON.parse(keys)
      const groqKey = parsedKeys.find((key: any) => key.provider === "groq")
      const mem0Key = parsedKeys.find((key: any) => key.provider === "mem0")
      
      if (groqKey && groqKey.key) {
        setApiKey(groqKey.key)
        
        // Set default model if no model is currently selected
        if (!selectedModel) {
          // Use the model from the API key if available, otherwise use the stored default
          const modelToUse = groqKey.model || "llama3-8b-8192"
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
    if (!apiKey) {
      setShowApiSetup(true)
    }
    
    setSettingsLoaded(true)
  }

  // Load messages for current conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const conversationMessages = await conversationService.getMessages(conversationId)
      const formattedMessages: ChatMessage[] = conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.createdAt,
        metadata: {}
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error("Failed to load conversation messages:", error)
      setMessages([])
    }
  }, [])

  // Handle conversation selection
  const handleConversationSelect = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    await loadConversationMessages(conversationId)
  }, [loadConversationMessages])

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const newConvo = await conversationService.createConversation()
      setCurrentConversationId(newConvo.id)
      setMessages([])
      setInput("")
      setFiles([])
      
      // Trigger a custom event to refresh the sidebar
      window.dispatchEvent(new CustomEvent('conversation-created'))
      
      toast.success("New conversation started")
    } catch (error) {
      console.error("Failed to create new conversation:", error)
      toast.error("Failed to create new conversation")
    }
  }, [])

  // Handle mobile sidebar close
  useEffect(() => {
    const handleMobileSidebarClose = () => {
      // This will be handled by the sidebar component itself
      console.log("Mobile sidebar close requested")
    }

    window.addEventListener('close-mobile-sidebar', handleMobileSidebarClose)
    return () => window.removeEventListener('close-mobile-sidebar', handleMobileSidebarClose)
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return
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

    // Prepare user message with proper file handling for vision models
    let messageContent: any = userInput;
    
    // If we have files and a vision model, format them properly for Groq API
    if (files.length > 0 && isVisionModel(selectedModel)) {
      const fileContents = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            // Convert image to base64 for vision models
            const base64 = await fileToBase64(file);
            return {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`
              }
            };
          } else {
            // For non-image files, just include metadata
            return {
              type: "text",
              text: `[File: ${file.name}]`
            };
          }
        })
      );
      
      messageContent = [
        { type: "text", text: userInput },
        ...fileContents
      ];
    }
    
    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
      metadata: files.length > 0 ? { files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined,
    }
    
    // Update messages immediately for instant feedback
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    
    // Create conversation if none exists, or store message in existing conversation
    if (!currentConversationId) {
      const newConvo = await conversationService.createConversation()
      setCurrentConversationId(newConvo.id)
      
      // Store the user message in the new conversation
      await conversationService.addMessage(newConvo.id, {
        conversationId: newConvo.id,
        role: "user",
        content: typeof messageContent === 'string' ? messageContent : userInput
      })
      
      // Trigger a custom event to refresh the sidebar
      window.dispatchEvent(new CustomEvent('conversation-created'))
    } else {
      // Store message in existing conversation
      await conversationService.addMessage(currentConversationId, {
        conversationId: currentConversationId,
        role: "user",
        content: typeof messageContent === 'string' ? messageContent : userInput
      })
    }
    
    // Clear files after sending (they're now part of the message content)
    setFiles([])

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
        
        // Handle both text and multimodal content when adding memory context
        if (typeof firstUserMessage.content === 'string') {
          firstUserMessage.content += memoryContext;
        } else if (Array.isArray(firstUserMessage.content)) {
          // For multimodal messages, add memory context to the text part
          const textItem = firstUserMessage.content.find(item => item.type === "text");
          if (textItem && textItem.text) {
            textItem.text += memoryContext;
          }
        }
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
          model: selectedModel,
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

      // Store assistant message in conversation
      if (currentConversationId) {
        await conversationService.addMessage(currentConversationId, {
          conversationId: currentConversationId,
          role: "assistant",
          content: completeMessage
        })
      }

      // Performance monitoring
      const responseTime = performance.now() - startTime
      console.log(`[zen0] Response time: ${responseTime.toFixed(2)}ms`)

      // Memory operations in background - don't block the UI
      if (mem0Service) {
        // Check if this message contains personal information that should be stored as profile
        const userMessage = finalMessages.find(msg => msg.role === "user");
        if (userMessage && userMessage.content) {
          // Handle both text-only and multimodal content
          let textContent = "";
          if (Array.isArray(userMessage.content)) {
            // For multimodal messages, extract text content
            textContent = userMessage.content
              .filter(item => item.type === "text")
              .map(item => item.text)
              .join(" ");
          } else {
            // For text-only messages
            textContent = userMessage.content;
          }
          
          if (textContent && (
              textContent.toLowerCase().includes("my name is") || 
              textContent.toLowerCase().includes("i am") || 
              textContent.toLowerCase().includes("i'm"))) {
            // Store as user profile for future reference (only if service is available)
            if (mem0Service && mem0Service.isReady()) {
              mem0Service.storeUserProfile(textContent, { 
                conversation_id: "default",
                type: "user_introduction"
              });
            }
          }
        }
        
        // Mem0 operations in background - non-blocking (only if service is available)
        if (mem0Service && mem0Service.isReady()) {
          // Convert multimodal messages to text-only for Mem0 storage
          const textOnlyMessages = finalMessages.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' 
              ? msg.content 
              : msg.content
                  .filter(item => item.type === "text" && item.text)
                  .map(item => item.text)
                  .join(" ") || "[Image message]"
          }));
          
          Promise.all([
            // Store current conversation memories (now global)
            mem0Service.storeConversation("default", textOnlyMessages)
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
    } finally {
      setIsStreaming(false)
      setIsProcessing(false)
      setStreamingMessage("")
      setShowReasoning(false)
      setReasoningText("")
      setFiles([]) // Clear files after sending
    }
  }, [input, isStreaming, apiKey, messages, mem0Service, files, currentConversationId, selectedModel])

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
            setSelectedModel(modelMap.groq || "llama3-8b-8192")

            if (keyMap.groq) {
              setShowApiSetup(false)
            }
          }
        }}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onRefresh={() => {
            // Refresh current conversation
            if (currentConversationId) {
              loadConversationMessages(currentConversationId)
            }
          }}
        />
        
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatMessages 
            messages={messages}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
            isProcessing={isProcessing}
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
            onModelChange={(model) => setSelectedModel(model)}
          />
        </div>
      </main>
    </div>
  )
}
