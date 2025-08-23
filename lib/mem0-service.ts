interface Mem0Memory {
  messages: Array<{
    role: string;
    content: string;
  }>;
  user_id: string;
  metadata: Record<string, any>;
}

interface Mem0BatchResponse {
  message: string;
  memories_created?: number;
}

class Mem0Service {
  private apiKey: string;
  private baseUrl = "https://api.mem0.ai/v1";
  private batchKey = "mem0-batch";
  private contextKey = "mem0-context";
  private batchSize = 5; // Optimal batch size for Mem0
  private maxRetries = 3;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Add memory to batch (non-blocking)
  addToBatch(memory: Mem0Memory): void {
    try {
      const batch = this.getBatch();
      batch.push(memory);
      this.saveBatch(batch);

      // Send batch if it reaches optimal size
      if (batch.length >= this.batchSize) {
        this.sendBatchAsync();
      }
    } catch (error) {
      console.error("Failed to add memory to batch:", error);
    }
  }

  // Send batch asynchronously (non-blocking)
  private async sendBatchAsync(): Promise<void> {
    setTimeout(async () => {
      await this.sendBatch();
    }, 100); // Small delay to ensure UI is not blocked
  }

  // Send batch to Mem0 API
  private async sendBatch(): Promise<void> {
    try {
      const batch = this.getBatch();
      if (batch.length === 0) return;

      const response = await fetch(`${this.baseUrl}/memories/batch/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${this.apiKey}`
        },
        body: JSON.stringify({
          memories: batch.map(item => ({
            messages: item.messages,
            user_id: item.user_id,
            metadata: item.metadata
          }))
        })
      });

      if (response.ok) {
        const result: Mem0BatchResponse = await response.json();
        console.log(`Mem0 batch success: ${result.message}`);
        this.clearBatch();
      } else {
        const errorText = await response.text();
        console.error("Mem0 batch failed:", response.status, errorText);
        
        // Retry logic for failed batches
        if (this.shouldRetry()) {
          setTimeout(() => this.sendBatch(), 1000);
        }
      }
    } catch (error) {
      console.error("Mem0 batch send error:", error);
      
      // Retry logic for network errors
      if (this.shouldRetry()) {
        setTimeout(() => this.sendBatch(), 2000);
      }
    }
  }

  // Search memories (non-blocking)
  async searchMemories(query: string, userId?: string, limit: number = 3): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/memories/search/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${this.apiKey}`
        },
        body: JSON.stringify({
          query,
          user_id: userId || "default",
          limit
        })
      });

      if (response.ok) {
        const memories = await response.json();
        return memories.map((mem: any) => mem.memory);
      }
    } catch (error) {
      console.error("Mem0 search failed:", error);
    }
    
    return [];
  }

  // Store memories from conversation (non-blocking)
  async storeMemories(conversationId: string, messages: Array<{ role: string; content: string }>): Promise<void> {
    try {
      // Prepare messages for Mem0 (last 4 messages for context)
      const recentMessages = messages.slice(-4);
      const mem0Memory: Mem0Memory = {
        messages: recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        user_id: `zen0-user-${conversationId}`,
        metadata: { 
          source: "zen0-chat",
          conversation_id: conversationId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Add to batch (will auto-send when batch is full)
      this.addToBatch(mem0Memory);
    } catch (error) {
      console.error("Failed to prepare memory for batch:", error);
    }
  }

  // Store context in session storage for faster access
  storeContext(conversationId: string, context: string): void {
    try {
      sessionStorage.setItem(`${this.contextKey}-${conversationId}`, context);
    } catch (error) {
      console.error("Failed to store context:", error);
    }
  }

  // Get cached context
  getContext(conversationId: string): string | null {
    try {
      return sessionStorage.getItem(`${this.contextKey}-${conversationId}`);
    } catch (error) {
      console.error("Failed to get context:", error);
      return null;
    }
  }

  // Process final batch on cleanup
  async processFinalBatch(): Promise<void> {
    try {
      const batch = this.getBatch();
      if (batch.length > 0) {
        await this.sendBatch();
      }
    } catch (error) {
      console.error("Failed to process final batch:", error);
    }
  }

  // Private helper methods
  private getBatch(): Mem0Memory[] {
    try {
      const stored = sessionStorage.getItem(this.batchKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveBatch(batch: Mem0Memory[]): void {
    try {
      sessionStorage.setItem(this.batchKey, JSON.stringify(batch));
    } catch (error) {
      console.error("Failed to save batch:", error);
    }
  }

  private clearBatch(): void {
    try {
      sessionStorage.removeItem(this.batchKey);
    } catch (error) {
      console.error("Failed to clear batch:", error);
    }
  }

  private shouldRetry(): boolean {
    // Simple retry logic - could be enhanced with exponential backoff
    return Math.random() < 0.5; // 50% chance to retry
  }
}

export { Mem0Service, type Mem0Memory };
