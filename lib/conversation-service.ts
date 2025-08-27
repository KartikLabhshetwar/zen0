export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

class ConversationService {
  private readonly STORAGE_KEY = "zen0-conversations"
  private readonly MESSAGES_STORAGE_KEY = "zen0-conversation-messages"

  private generateValidDate(): string {
    try {
      const now = new Date()
      // Ensure we have a valid date
      if (isNaN(now.getTime())) {
        throw new Error("Invalid date generated")
      }
      return now.toISOString()
    } catch (error) {
      console.error("Failed to generate valid date, using fallback:", error)
      // Fallback to a known valid date
      return new Date(0).toISOString()
    }
  }

  private validateDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string found, using current time:", dateString)
        return this.generateValidDate()
      }
      return dateString
    } catch (error) {
      console.warn("Date validation failed, using current time:", error)
      return this.generateValidDate()
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      if (typeof window === 'undefined') return []
      
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return []
      }
      
      const conversations = JSON.parse(stored) as Conversation[]
      console.log(`[zen0] Loaded ${conversations.length} conversations from localStorage`)
      
      // Validate and fix any invalid dates
      const validatedConversations = conversations.map(conv => ({
        ...conv,
        createdAt: this.validateDate(conv.createdAt),
        updatedAt: this.validateDate(conv.updatedAt)
      }))
      
      return validatedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } catch (error) {
      console.error("Failed to get conversations:", error)
      return []
    }
  }

  async createConversation(title?: string): Promise<Conversation> {
    try {
      if (typeof window === 'undefined') {
        throw new Error("Cannot create conversation on server side")
      }
      
      const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = this.generateValidDate()
      
      const conversation: Conversation = {
        id,
        title: title || "New Chat",
        createdAt: now,
        updatedAt: now,
        messageCount: 0
      }

      const conversations = await this.getConversations()
      conversations.unshift(conversation)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
      
      return conversation
    } catch (error) {
      console.error("Failed to create conversation:", error)
      throw error
    }
  }

  // Get the most recent conversation (only if one exists)
  async getMostRecentConversation(): Promise<Conversation | null> {
    try {
      const conversations = await this.getConversations()
      
      // Only return the most recent conversation if one exists
      return conversations.length > 0 ? conversations[0] : null
    } catch (error) {
      console.error("Failed to get most recent conversation:", error)
      return null
    }
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const conversations = await this.getConversations()
      const index = conversations.findIndex(c => c.id === id)
      
      if (index !== -1) {
        conversations[index] = { 
          ...conversations[index], 
          ...updates, 
          updatedAt: this.generateValidDate() 
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
      }
    } catch (error) {
      console.error("Failed to update conversation:", error)
      throw error
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const conversations = await this.getConversations()
      const filtered = conversations.filter(c => c.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      
      // Also delete associated messages
      const messagesKey = `${this.MESSAGES_STORAGE_KEY}_${id}`
      localStorage.removeItem(messagesKey)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      throw error
    }
  }

  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    try {
      if (typeof window === 'undefined') return []
      
      const key = `${this.MESSAGES_STORAGE_KEY}_${conversationId}`
      const stored = localStorage.getItem(key)
      if (!stored) return []
      
      const messages = JSON.parse(stored) as ConversationMessage[]
      
      // Validate and fix any invalid dates in messages
      const validatedMessages = messages.map(msg => ({
        ...msg,
        createdAt: this.validateDate(msg.createdAt)
      }))
      
      return validatedMessages
    } catch (error) {
      console.error("Failed to get messages:", error)
      return []
    }
  }

  async addMessage(conversationId: string, message: Omit<ConversationMessage, 'id' | 'createdAt'>): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const messages = await this.getMessages(conversationId)
      const newMessage: ConversationMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: this.generateValidDate()
      }
      
      messages.push(newMessage)
      
      const key = `${this.MESSAGES_STORAGE_KEY}_${conversationId}`
      localStorage.setItem(key, JSON.stringify(messages))
      
      // Update conversation metadata
      const conversations = await this.getConversations()
      const conversation = conversations.find(c => c.id === conversationId)
      
      if (conversation) {
        conversation.messageCount = messages.length
        conversation.lastMessage = message.content.substring(0, 100)
        conversation.updatedAt = this.generateValidDate()
        
        // Update title if it's still the default
        if (conversation.title === "New Chat" && message.role === "user") {
          conversation.title = message.content.substring(0, 50) + (message.content.length > 50 ? "..." : "")
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
      }
    } catch (error) {
      console.error("Failed to add message:", error)
      throw error
    }
  }

  async clearConversations(): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      localStorage.removeItem(this.STORAGE_KEY)
      
      // Clear all message storage keys
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.MESSAGES_STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Failed to clear conversations:", error)
      throw error
    }
  }

  // Helper method to check if service is available
  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  // Clean up corrupted data
  async cleanupCorruptedData(): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      // Clean up conversations
      const conversations = await this.getConversations()
      const validConversations = conversations.filter(conv => {
        try {
          // Check if conversation has valid structure
          if (!conv.id || !conv.title || !conv.createdAt || !conv.updatedAt) {
            console.warn("Removing conversation with invalid structure:", conv)
            return false
          }
          
          // Check if dates are valid
          const createdAt = new Date(conv.createdAt)
          const updatedAt = new Date(conv.updatedAt)
          
          if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
            console.warn("Removing conversation with invalid dates:", conv)
            return false
          }
          
          return true
        } catch (error) {
          console.warn("Removing conversation due to validation error:", error, conv)
          return false
        }
      })
      
      if (validConversations.length !== conversations.length) {
        console.log(`Cleaned up ${conversations.length - validConversations.length} corrupted conversations`)
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validConversations))
      }
      
      // Clean up messages for each conversation
      for (const conv of validConversations) {
        const messages = await this.getMessages(conv.id)
        const validMessages = messages.filter(msg => {
          try {
            if (!msg.id || !msg.conversationId || !msg.role || !msg.content || !msg.createdAt) {
              console.warn("Removing message with invalid structure:", msg)
              return false
            }
            
            const createdAt = new Date(msg.createdAt)
            if (isNaN(createdAt.getTime())) {
              console.warn("Removing message with invalid date:", msg)
              return false
            }
            
            return true
          } catch (error) {
            console.warn("Removing message due to validation error:", error, msg)
            return false
          }
        })
        
        if (validMessages.length !== messages.length) {
          const key = `${this.MESSAGES_STORAGE_KEY}_${conv.id}`
          localStorage.setItem(key, JSON.stringify(validMessages))
          console.log(`Cleaned up ${messages.length - validMessages.length} corrupted messages for conversation ${conv.id}`)
        }
      }
    } catch (error) {
      console.error("Failed to cleanup corrupted data:", error)
    }
  }
}

export const conversationService = new ConversationService()
