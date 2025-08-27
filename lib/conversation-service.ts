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
  content: string | Array<{
    type: "text" | "image_url"
    text?: string
    image_url?: { url: string }
  }>
  createdAt: string
  metadata?: Record<string, any>
}

class ConversationService {
  private readonly STORAGE_KEY = "zen0-conversations"
  private readonly MESSAGES_STORAGE_KEY = "zen0-conversation-messages"
  private readonly IMAGES_STORAGE_KEY = "zen0-conversation-images"

  async getConversations(): Promise<Conversation[]> {
    try {
      if (typeof window === 'undefined') return []
      
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return []
      }
      
      const conversations = JSON.parse(stored) as Conversation[]
      
      return conversations
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
      const now = new Date().toISOString()
      
      const conversation: Conversation = {
        id,
        title: title || "New Chat",
        createdAt: now,
        updatedAt: now,
        messageCount: 0
      }

      const conversations = await this.getConversations()
      const updatedConversations = [conversation, ...conversations]
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedConversations))
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('conversation-created'))
      }
      
      return conversation
    } catch (error) {
      console.error("Failed to create conversation:", error)
      throw error
    }
  }

  async getMostRecentConversation(): Promise<Conversation | null> {
    try {
      const conversations = await this.getConversations()
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
          updatedAt: new Date().toISOString()
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
      
      if (filtered.length === 0) {
        localStorage.removeItem(this.STORAGE_KEY)
      } else {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      }
      
      const messagesKey = `${this.MESSAGES_STORAGE_KEY}_${id}`
      localStorage.removeItem(messagesKey)
      
      await this.cleanupConversationImages(id)
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('conversation-deleted'))
      }
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
      
      const messagesWithImages = await Promise.all(
        messages.map(async (message) => {
          if (Array.isArray(message.content)) {
            const restoredContent = await Promise.all(
              message.content.map(async (item) => {
                if (item.type === "image_url" && item.image_url?.url) {
                  if (item.image_url.url.startsWith('data:')) {
                    return item
                  } else {
                    const restoredImage = await this.getStoredImage(conversationId, item.image_url.url)
                    if (restoredImage) {
                      return {
                        ...item,
                        image_url: { url: restoredImage }
                      }
                    }
                  }
                }
                return item
              })
            )
            return { ...message, content: restoredContent }
          }
          return message
        })
      )
      
      return messagesWithImages
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
        createdAt: new Date().toISOString()
      }
      if (Array.isArray(message.content)) {
        await this.storeMessageImages(conversationId, newMessage.id, message.content)
      }
      
      messages.push(newMessage)
      
      const key = `${this.MESSAGES_STORAGE_KEY}_${conversationId}`
      localStorage.setItem(key, JSON.stringify(messages))
      
      const conversations = await this.getConversations()
      const conversation = conversations.find(c => c.id === conversationId)
      
      if (conversation) {
        const titleChanged = conversation.title === "New Chat" && message.role === "user"
        
        conversation.messageCount = messages.length
        conversation.lastMessage = this.extractLastMessageText(message.content)
        conversation.updatedAt = new Date().toISOString()
        
        if (titleChanged) {
          conversation.title = this.extractLastMessageText(message.content).substring(0, 50) + 
            (this.extractLastMessageText(message.content).length > 50 ? "..." : "")
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations))
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('conversation-updated', { 
            detail: { conversationId, titleChanged } 
          }))
        }
      }
    } catch (error) {
      console.error("Failed to add message:", error)
      throw error
    }
  }

  private extractLastMessageText(content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>): string {
    if (typeof content === 'string') {
      return content
    }
    
    const textItems = content.filter(item => item.type === "text" && item.text)
    return textItems.map(item => item.text).join(" ") || "Image message"
  }

  private async storeMessageImages(conversationId: string, messageId: string, content: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>): Promise<void> {
    try {
      const imageItems = content.filter(item => item.type === "image_url" && item.image_url?.url)
      
      for (const item of imageItems) {
        if (item.image_url?.url && item.image_url.url.startsWith('data:')) {
          const imageKey = `${this.IMAGES_STORAGE_KEY}_${conversationId}_${messageId}_${Date.now()}`
          localStorage.setItem(imageKey, item.image_url.url)
        }
      }
    } catch (error) {
      console.error("Failed to store message images:", error)
    }
  }

  private async getStoredImage(conversationId: string, imageKey: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined') return null
      
      if (imageKey.startsWith('data:')) {
        return imageKey
      }
      
      if (imageKey.startsWith(this.IMAGES_STORAGE_KEY)) {
        return localStorage.getItem(imageKey)
      }
      
      return null
    } catch (error) {
      console.error("Failed to get stored image:", error)
      return null
    }
  }

  private async cleanupConversationImages(conversationId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const keys = Object.keys(localStorage)
      const imageKeys = keys.filter(key => 
        key.startsWith(`${this.IMAGES_STORAGE_KEY}_${conversationId}_`)
      )
      
      imageKeys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error("Failed to cleanup conversation images:", error)
    }
  }

  async clearConversations(): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      localStorage.removeItem(this.STORAGE_KEY)
      
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.MESSAGES_STORAGE_KEY) || key.startsWith(this.IMAGES_STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      })
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('conversation-deleted'))
      }
    } catch (error) {
      console.error("Failed to clear conversations:", error)
      throw error
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }
}

export const conversationService = new ConversationService()
