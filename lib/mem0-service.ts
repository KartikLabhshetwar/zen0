export interface Mem0Memory {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  user_id: string;
  metadata?: Record<string, any>;
}

// Singleton instance to prevent multiple initializations
let mem0Instance: Mem0Service | null = null;

export class Mem0Service {
  private apiKey: string = "";
  private isInitialized: boolean = false;
  private batchQueue: Mem0Memory[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isProcessingBatch: boolean = false;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private readonly MAX_BATCH_SIZE = 10;
  private globalUserId: string = "zen0-user"; // Global user ID for all conversations

  constructor(apiKey: string) {
    // Only initialize if not already done
    if (!mem0Instance) {
      this.apiKey = apiKey;
      this.isInitialized = true;
      mem0Instance = this;
    }
  }

  // Get singleton instance
  static getInstance(apiKey?: string): Mem0Service {
    if (!mem0Instance && apiKey) {
      mem0Instance = new Mem0Service(apiKey);
    }
    return mem0Instance!;
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  // Set global user ID (can be customized per user)
  setGlobalUserId(userId: string): void {
    this.globalUserId = userId;
  }

  // Get current global user ID
  getGlobalUserId(): string {
    return this.globalUserId;
  }

  // Add to batch queue (non-blocking)
  private addToBatch(memory: Mem0Memory): void {
    this.batchQueue.push(memory);
    
    // Process batch if it reaches max size
    if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
      this.processBatch();
      return;
    }

    // Set timeout for delayed processing
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    }
  }

  // Process batch asynchronously
  private async processBatch(): Promise<void> {
    if (this.isProcessingBatch || this.batchQueue.length === 0) {
      return;
    }

    this.isProcessingBatch = true;
    
    try {
      const batch = [...this.batchQueue];
      this.batchQueue = [];
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      // Process each memory individually using our proxy API
      for (const memory of batch) {
        try {
          await this.storeMemoryViaProxy(memory);
        } catch (error) {
          console.error("Failed to store individual memory:", error);
          // Continue processing other memories even if one fails
        }
      }
    } catch (error) {
      console.error("Batch processing failed:", error);
    } finally {
      this.isProcessingBatch = false;
    }
  }

  // Store memory via our proxy API (no ping, no CORS)
  private async storeMemoryViaProxy(memory: Mem0Memory): Promise<void> {
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
        const errorText = await response.text();
        console.error(`Failed to store memory: ${response.status} - ${errorText}`);
        // Don't throw - just log the error to avoid blocking
        return;
      }

      const result = await response.json();
    } catch (error) {
      console.error("Proxy API call failed:", error);
      // Don't throw - just log the error to avoid blocking
      return;
    }
  }

  // Store memories from conversation (non-blocking) - NOW GLOBAL
  async storeMemories(conversationId: string, messages: Array<{ role: string; content: string }>): Promise<void> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return;
    }

    try {
      // Use the last 4 messages for context
      const recentMessages = messages.slice(-4);
      
      const memory: Mem0Memory = {
        messages: recentMessages as Array<{ role: "user" | "assistant"; content: string }>,
        user_id: this.globalUserId, // Use global user ID instead of conversation-specific
        metadata: { 
          source: "zen0-chat",
          conversation_id: conversationId, // Keep conversation ID in metadata for reference
          timestamp: new Date().toISOString(),
          type: "conversation_memory"
        }
      };
      
      // Add to batch queue (non-blocking)
      this.addToBatch(memory);
    } catch (error) {
      console.error("Failed to add memory to batch:", error);
    }
  }

  // Store user profile information (persistent across all conversations)
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
      
      // Add to batch queue (non-blocking)
      this.addToBatch(memory);
    } catch (error) {
      console.error("Failed to add user profile to batch:", error);
    }
  }

  // Search memories using our proxy API (no ping, no CORS) - NOW GLOBAL
  async searchMemories(query: string, userId?: string, limit: number = 5): Promise<string[]> {
    if (!this.isReady()) {
      console.error("Mem0 service not ready");
      return [];
    }

    try {
      // Use global user ID if no specific userId provided
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
            AND: [
              {
                user_id: searchUserId
              }
            ]
          },
          limit
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search failed:", response.status, errorText);
        
        // Try to parse error details for better debugging
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.details) {
            console.error("Error details:", errorData.details);
          }
          if (errorData.suggestion) {
            console.error("Suggestion:", errorData.suggestion);
          }
        } catch (parseError) {
          // Error text is not JSON, use as is
        }
        
        // Return empty array on failure - don't throw to avoid blocking
        return [];
      }

      const results = await response.json();

      // Handle v2 search response format
      if (results && results.memories && Array.isArray(results.memories)) {
        return results.memories.map((result: any) => {
          if (result.memory) return result.memory;
          if (result.text) return result.text;
          if (typeof result === 'string') return result;
          return JSON.stringify(result);
        });
      }

      // Handle v2 search response format (alternative structure)
      if (results && results.results && Array.isArray(results.results)) {
        return results.results.map((result: any) => {
          if (result.memory) return result.memory;
          if (result.text) return result.text;
          if (typeof result === 'string') return result;
          return JSON.stringify(result);
        });
      }

      // Fallback for other response formats
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
    } catch (error) {
      console.error("Memory search failed:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Return empty array on failure - don't throw to avoid blocking
      return [];
    }
  }

  // Get all memories for a user using our proxy API - NOW GLOBAL
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
        const errorText = await response.text();
        console.error("Get all failed:", response.status, errorText);
        return [];
      }

      const memories = await response.json();
      return memories || [];
    } catch (error) {
      console.error("Failed to get all memories:", error);
      return [];
    }
  }

  // Delete all memories for a user using our proxy API - NOW GLOBAL
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
        const errorText = await response.text();
        console.error("Delete all failed:", response.status, errorText);
        return false;
      }

      console.log("All memories deleted for user:", searchUserId);
      return true;
    } catch (error) {
      console.error("Failed to delete memories:", error);
      return false;
    }
  }

  // Force process any remaining batch
  async flushBatch(): Promise<void> {
    if (this.batchQueue.length > 0) {
      await this.processBatch();
    }
  }

  // Cleanup method
  cleanup(): void {
    try {
      // Process any remaining batch before cleanup
      this.flushBatch();
      
      this.apiKey = "";
      this.isInitialized = false;
      mem0Instance = null;
    } catch (error) {
      console.error("Failed to cleanup Mem0 service:", error);
    }
  }
}







