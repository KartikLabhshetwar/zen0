export interface Mem0Memory {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  user_id: string;
  metadata?: Record<string, any>;
}

export class Mem0Service {
  private apiKey: string = "";
  private isInitialized: boolean = false;
  private globalUserId: string = "zen0-user";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isInitialized = true;
  }

  isReady(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  setGlobalUserId(userId: string): void {
    this.globalUserId = userId;
  }

  getGlobalUserId(): string {
    return this.globalUserId;
  }

  // Intelligent query detection - only search for repeated/personal questions
  shouldSearchMemories(query: string): boolean {
    const personalKeywords = [
      'my', 'me', 'myself', 'name', 'who am i', 'what do you know about me',
      'remember', 'memory', 'personal', 'preference', 'like', 'love', 'hate',
      'background', 'history', 'conversation', 'previous', 'before', 'last time',
      'you said', 'you told me', 'we discussed', 'our conversation'
    ];
    
    const generalKnowledgeKeywords = [
      'what is', 'how to', 'explain', 'tell me about', 'define', 'give me',
      'interview questions', 'examples', 'tutorial', 'guide', 'steps', 'calculate',
      'solve', 'math', 'formula', 'equation', 'algorithm', 'code', 'programming'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check if query contains personal keywords (excluding single letter 'i' from general phrases)
    const hasPersonalKeywords = personalKeywords.some(keyword => {
      if (keyword === 'i') {
        // Only match standalone 'i' or 'i' followed by punctuation/space
        return /\bi\b/.test(queryLower);
      }
      return queryLower.includes(keyword);
    });
    
    // Check if query contains general knowledge keywords
    const hasGeneralKeywords = generalKnowledgeKeywords.some(keyword => queryLower.includes(keyword));
    
    // If it has personal keywords, always search Mem0
    if (hasPersonalKeywords) {
      return true;
    }
    
    // If it only has general knowledge keywords, skip Mem0
    if (hasGeneralKeywords && !hasPersonalKeywords) {
      return false;
    }
    
    // Default to searching Mem0 for ambiguous queries
    return true;
  }

  async storeConversation(
    conversationId: string, 
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return;
    }

    try {
      const recentMessages = messages.slice(-4);
      
      const memory: Mem0Memory = {
        messages: recentMessages as Array<{ role: "user" | "assistant"; content: string }>,
        user_id: this.globalUserId,
        metadata: { 
          source: "zen0-chat",
          conversation_id: conversationId,
          timestamp: new Date().toISOString(),
          type: "conversation_memory"
        }
      };
      
      await this.storeMemory(memory);
    } catch (error) {
      console.error("Failed to store conversation:", error);
    }
  }

  async storeUserProfile(profileInfo: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return;
    }

    try {
      const memory: Mem0Memory = {
        messages: [{ role: "user", content: profileInfo }],
        user_id: this.globalUserId,
        metadata: { 
          source: "zen0-chat",
          type: "user_profile",
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };
      
      await this.storeMemory(memory);
    } catch (error) {
      console.error("Failed to store user profile:", error);
    }
  }

  async searchMemories(
    query: string, 
    userId?: string, 
    limit: number = 5, 
    threshold: number = 0.3
  ): Promise<string[]> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return [];
    }

    // Only search if this query should use memories
    if (!this.shouldSearchMemories(query)) {
      return [];
    }

    try {
      const searchUserId = userId || this.globalUserId;
      
      const response = await fetch('/api/mem0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'search',
          query,
          version: 'v2',
          filters: {
            AND: [{ user_id: searchUserId }]
          },
          limit,
          threshold,
          rerank: true,
          keyword_search: true
        })
      });

      if (!response.ok) {
        console.error("Search failed:", response.status);
        return [];
      }

      const results = await response.json();
      const memories = this.extractMemoryText(results);
      return memories;
    } catch (error) {
      console.error("Memory search failed:", error);
      return [];
    }
  }

  async getAllMemories(userId?: string): Promise<any[]> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return [];
    }

    try {
      const searchUserId = userId || this.globalUserId;
      const response = await fetch('/api/mem0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'getAll',
          user_id: searchUserId
        })
      });

      if (!response.ok) {
        console.error("Get all failed:", response.status);
        return [];
      }

      const memories = await response.json();
      return memories || [];
    } catch (error) {
      console.error("Failed to get all memories:", error);
      return [];
    }
  }

  async deleteAllMemories(userId?: string): Promise<boolean> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return false;
    }

    try {
      const searchUserId = userId || this.globalUserId;
      const response = await fetch('/api/mem0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'deleteAll',
          user_id: searchUserId
        })
      });

      if (!response.ok) {
        console.error("Delete all failed:", response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete memories:", error);
      return false;
    }
  }

  private async storeMemory(memory: Mem0Memory): Promise<void> {
    try {
      const response = await fetch('/api/mem0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add',
          messages: memory.messages,
          user_id: memory.user_id,
          metadata: memory.metadata
        })
      });

      if (!response.ok) {
        console.error(`Failed to store memory: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to store memory:", error);
    }
  }

  private extractMemoryText(results: any): string[] {
    if (results?.memories && Array.isArray(results.memories)) {
      return results.memories.map((result: any) => {
        if (result.memory) return result.memory;
        if (result.text) return result.text;
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
      });
    }

    if (results?.results && Array.isArray(results.results)) {
      return results.results.map((result: any) => {
        if (result.memory) return result.memory;
        if (result.text) return result.text;
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
      });
    }

    if (results && Array.isArray(results)) {
      return results.map((result: any) => {
        if (result.memory) return result.memory;
        if (result.content) return result.content;
        if (result.text) return result.text;
        if (typeof result === 'string') return result;
        return JSON.stringify(result);
      });
    }

    return [];
  }

  cleanup(): void {
    this.apiKey = "";
    this.isInitialized = false;
  }
}







