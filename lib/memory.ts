// Mem0 Memory Integration for zen0
interface MemoryConfig {
  apiKey: string
  baseUrl?: string
}

interface Memory {
  id: string
  memory: string
  user_id?: string
  agent_id?: string
  run_id?: string
  created_at: string
  updated_at: string
}

interface CreateMemoryRequest {
  messages: Array<{ role: string; content: string }>
  user_id?: string
  agent_id?: string
  run_id?: string
  metadata?: Record<string, any>
}

interface SearchMemoryRequest {
  query: string
  user_id?: string
  agent_id?: string
  run_id?: string
  limit?: number
}

class Mem0Client {
  private apiKey: string
  private baseUrl: string

  constructor(config: MemoryConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://api.mem0.ai"
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Token ${this.apiKey}`,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createMemory(data: CreateMemoryRequest): Promise<Memory> {
    return this.makeRequest("/v1/memories/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getMemories(userId?: string, limit = 100): Promise<Memory[]> {
    const params = new URLSearchParams()
    if (userId) params.append("user_id", userId)
    params.append("limit", limit.toString())

    const response = await this.makeRequest(`/v1/memories/?${params}`)
    return response.results || []
  }

  async searchMemories(data: SearchMemoryRequest): Promise<Memory[]> {
    const response = await this.makeRequest("/v1/memories/search/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.results || []
  }

  async updateMemory(memoryId: string, data: { memory: string }): Promise<Memory> {
    return this.makeRequest(`/v1/memories/${memoryId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await this.makeRequest(`/v1/memories/${memoryId}/`, {
      method: "DELETE",
    })
  }

  async deleteAllMemories(userId?: string): Promise<void> {
    const params = new URLSearchParams()
    if (userId) params.append("user_id", userId)

    await this.makeRequest(`/v1/memories/?${params}`, {
      method: "DELETE",
    })
  }
}

// Memory service for zen0
export class MemoryService {
  private client: Mem0Client | null = null

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Mem0Client({ apiKey })
    }
  }

  isEnabled(): boolean {
    return this.client !== null
  }

  async storeConversationMemory(
    messages: Array<{ role: string; content: string }>,
    userId: string,
    conversationId: string,
  ): Promise<void> {
    if (!this.client) return

    try {
      await this.client.createMemory({
        messages,
        user_id: userId,
        run_id: conversationId,
        metadata: {
          type: "conversation",
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Failed to store memory:", error)
    }
  }

  async getRelevantMemories(query: string, userId: string, limit = 5): Promise<Memory[]> {
    if (!this.client) return []

    try {
      return await this.client.searchMemories({
        query,
        user_id: userId,
        limit,
      })
    } catch (error) {
      console.error("Failed to retrieve memories:", error)
      return []
    }
  }

  async getUserMemories(userId: string, limit = 50): Promise<Memory[]> {
    if (!this.client) return []

    try {
      return await this.client.getMemories(userId, limit)
    } catch (error) {
      console.error("Failed to get user memories:", error)
      return []
    }
  }

  async clearUserMemories(userId: string): Promise<void> {
    if (!this.client) return

    try {
      await this.client.deleteAllMemories(userId)
    } catch (error) {
      console.error("Failed to clear memories:", error)
    }
  }

  // Generate memory-enhanced system prompt
  generateSystemPrompt(memories: Memory[], userQuery: string): string {
    if (memories.length === 0) {
      return "You are zen0, a helpful AI assistant. Provide accurate and helpful responses."
    }

    const relevantMemories = memories
      .slice(0, 3) // Limit to top 3 most relevant memories
      .map((memory) => memory.memory)
      .join("\n")

    return `You are zen0, a helpful AI assistant with memory of previous conversations.

Here's what you remember about this user:
${relevantMemories}

Use this context to provide more personalized and relevant responses. If the current query relates to previous conversations, reference that context naturally. If not, respond normally without forcing connections to past conversations.

Current user query: ${userQuery}`
  }
}

// Singleton instance
let memoryService: MemoryService | null = null

export function getMemoryService(apiKey?: string): MemoryService {
  if (!memoryService) {
    memoryService = new MemoryService(apiKey)
  }
  return memoryService
}

export function initializeMemoryService(apiKey: string): void {
  memoryService = new MemoryService(apiKey)
}
