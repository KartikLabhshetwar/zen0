export interface Conversation {
  id: string
  title: string
  provider: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, any>
  created_at: string
}

export interface UserSettings {
  api_keys: Record<string, string>
  default_provider: string
  default_model: string
  memory_enabled: boolean
}

class LocalStorageService {
  private readonly CONVERSATIONS_KEY = "zen0-conversations"
  private readonly MESSAGES_PREFIX = "zen0-messages-"
  private readonly SETTINGS_KEY = "zen0-settings"
  private readonly MEMORY_KEY = "zen0-memory"

  // Conversation management
  getConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.CONVERSATIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations))
    } catch (error) {
      console.error("Failed to save conversations:", error)
    }
  }

  createConversation(conversation: Omit<Conversation, "id" | "created_at" | "updated_at">): Conversation {
    const newConversation: Conversation = {
      ...conversation,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const conversations = this.getConversations()
    conversations.unshift(newConversation)
    this.saveConversations(conversations)
    
    return newConversation
  }

  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    const conversations = this.getConversations()
    const index = conversations.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    this.saveConversations(conversations)
    return conversations[index]
  }

  deleteConversation(id: string): void {
    const conversations = this.getConversations()
    const filtered = conversations.filter(c => c.id !== id)
    this.saveConversations(filtered)
    
    // Also delete associated messages
    localStorage.removeItem(`${this.MESSAGES_PREFIX}${id}`)
  }

  // Message management
  getMessages(conversationId: string): Message[] {
    try {
      const stored = localStorage.getItem(`${this.MESSAGES_PREFIX}${conversationId}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  saveMessages(conversationId: string, messages: Message[]): void {
    try {
      localStorage.setItem(`${this.MESSAGES_PREFIX}${conversationId}`, JSON.stringify(messages))
      
      // Update conversation's updated_at
      const conversations = this.getConversations()
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        this.updateConversation(conversationId, { updated_at: new Date().toISOString() })
      }
    } catch (error) {
      console.error("Failed to save messages:", error)
    }
  }

  addMessage(conversationId: string, message: Omit<Message, "id" | "created_at">): Message {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    
    const messages = this.getMessages(conversationId)
    messages.push(newMessage)
    this.saveMessages(conversationId, messages)
    
    return newMessage
  }

  // Settings management
  getSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Fallback to default settings
    }
    
    return {
      api_keys: {},
      default_provider: "groq",
      default_model: "llama-3.1-8b-instant",
      memory_enabled: true,
    }
  }

  saveSettings(settings: Partial<UserSettings>): void {
    try {
      const current = this.getSettings()
      const updated = { ...current, ...settings }
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  updateApiKey(provider: string, key: string): void {
    const settings = this.getSettings()
    settings.api_keys[provider] = key
    this.saveSettings(settings)
  }

  updateDefaultModel(model: string): void {
    const settings = this.getSettings()
    settings.default_model = model
    this.saveSettings(settings)
  }

  updateMemoryEnabled(enabled: boolean): void {
    const settings = this.getSettings()
    settings.memory_enabled = enabled
    this.saveSettings(settings)
  }

  // Memory management (simplified local storage version)
  storeMemory(conversationId: string, messages: Array<{ role: string; content: string }>): void {
    try {
      const memory = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        messages,
        created_at: new Date().toISOString(),
      }
      
      const existing = this.getMemories()
      existing.push(memory)
      
      // Keep only last 100 memories to prevent storage bloat
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100)
      }
      
      localStorage.setItem(this.MEMORY_KEY, JSON.stringify(existing))
    } catch (error) {
      console.error("Failed to store memory:", error)
    }
  }

  getMemories(): Array<{ id: string; conversation_id: string; messages: Array<{ role: string; content: string }>; created_at: string }> {
    try {
      const stored = localStorage.getItem(this.MEMORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  searchMemories(query: string, limit = 5): Array<{ id: string; conversation_id: string; messages: Array<{ role: string; content: string }>; created_at: string }> {
    const memories = this.getMemories()
    
    // Simple text search - in production you'd want more sophisticated search
    const relevant = memories.filter(memory => 
      memory.messages.some(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
    )
    
    return relevant.slice(0, limit)
  }

  // Utility methods
  clearAllData(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith("zen0-")) {
        localStorage.removeItem(key)
      }
    })
  }

  exportData(): string {
    const data = {
      conversations: this.getConversations(),
      settings: this.getSettings(),
      memories: this.getMemories(),
      timestamp: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.conversations) {
        this.saveConversations(data.conversations)
      }
      
      if (data.settings) {
        this.saveSettings(data.settings)
      }
      
      if (data.memories) {
        localStorage.setItem(this.MEMORY_KEY, JSON.stringify(data.memories))
      }
      
      return true
    } catch (error) {
      console.error("Failed to import data:", error)
      return false
    }
  }
}

export const localStorageService = new LocalStorageService()
