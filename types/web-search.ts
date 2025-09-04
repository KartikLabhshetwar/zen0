export interface WebSearchResult {
  response: string;
  sources: string[];
  toolCalls: ToolCall[];
  reasoning?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface WebSearchStreamChunk {
  type: 'content' | 'tool_call' | 'source' | 'done' | 'error';
  data: any;
}

export interface WebSearchRequest {
  query: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
}

export interface WebSearchResponse {
  success: boolean;
  data?: WebSearchResult;
  error?: string;
}

export interface WebSearchToolCall {
  tool: string;
  input: Record<string, any>;
}
