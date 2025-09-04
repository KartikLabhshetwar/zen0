import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the agent state
const AgentState = MessagesAnnotation;

// Web search tool using Tavily
const webSearchTool = new TavilySearch({
  maxResults: 5,
  apiKey: process.env.TAVILY_API_KEY!,
} as any);

// Additional web scraping tool for detailed content
const webScrapingTool = tool(
  async (input: unknown) => {
    const { url } = input as { url: string };
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return `Failed to fetch content from ${url}: ${response.statusText}`;
      }
      
      const html = await response.text();
      // Basic text extraction (you might want to use a proper HTML parser)
      const textContent = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000); // Limit content length
      
      return `Content from ${url}:\n${textContent}`;
    } catch (error) {
      return `Error scraping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
  {
    name: "scrape_webpage",
    description: "Scrape the content of a specific webpage for detailed information",
    schema: z.object({
      url: z.string().describe("The URL of the webpage to scrape")
    })
  }
);

// Tools array
const tools = [webSearchTool, webScrapingTool];

// Initialize the LLM with Groq
const llm = new ChatGroq({
  model: "qwen/qwen3-32b",
  temperature: 0.1,
  maxTokens: 4000,
  apiKey: process.env.GROQ_API_KEY,
});

// Create the React agent
const agent = createReactAgent({
  llm,
  tools,
  prompt: (state) => [
    {
      role: "system",
      content: `You are a web search agent specialized in finding and analyzing information from the internet. 

Your capabilities:
- Search the web using Tavily search for current information
- Scrape specific web pages for detailed content
- Provide comprehensive answers based on web search results
- Always cite your sources with URLs
- If you find conflicting information, present both sides
- Be thorough but concise in your responses

When searching:
1. Use specific, targeted search queries
2. Look for authoritative sources (news sites, official websites, academic sources)
3. If initial results aren't sufficient, refine your search terms
4. For detailed analysis, scrape the most relevant URLs

Always provide sources and be transparent about the limitations of web search results.

IMPORTANT: Always think through your search strategy and reasoning process. Use <think> tags to show your thought process before providing the final answer.`
    },
    ...state.messages
  ]
});

// Create the workflow
const workflow = new StateGraph(AgentState)
  .addNode("agent", agent)
  .addEdge(START, "agent")
  .addEdge("agent", END);

// Compile the workflow
const webSearchAgent = workflow.compile();

export class WebSearchAgentService {
  private agent = webSearchAgent;

  async search(query: string, conversationHistory: BaseMessage[] = []): Promise<{
    response: string;
    sources: string[];
    toolCalls: any[];
    reasoning?: string;
  }> {
    try {
      const messages: BaseMessage[] = [
        ...conversationHistory,
        new HumanMessage(query)
      ];

      const result = await this.agent.invoke({ messages });
      
      // Extract sources and tool calls from the conversation
      const sources: string[] = [];
      const toolCalls: any[] = [];
      let reasoning = "";
      
      result.messages.forEach((message: BaseMessage) => {
        if (message instanceof AIMessage && message.tool_calls) {
          toolCalls.push(...message.tool_calls);
        }
        
        // Extract URLs from tool results
        if (message.content && typeof message.content === 'string') {
          const urlMatches = message.content.match(/https?:\/\/[^\s]+/g);
          if (urlMatches) {
            sources.push(...urlMatches);
          }
        }
      });

      // Extract reasoning from the conversation
      const reasoningMessages = result.messages.filter(msg => 
        msg instanceof AIMessage && 
        msg.content && 
        typeof msg.content === 'string' && 
        msg.content.includes('<think>')
      );
      
      if (reasoningMessages.length > 0) {
        const reasoningContent = reasoningMessages[0].content as string;
        const thinkMatch = reasoningContent.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          reasoning = thinkMatch[1].trim();
        } else {
          // Fallback: if no closing tag, take everything after <think>
          const partialMatch = reasoningContent.match(/<think>([\s\S]*)/);
          if (partialMatch) {
            reasoning = partialMatch[1].trim();
          }
        }
      }
      
      // If no reasoning found in <think> tags, create a summary from tool calls
      if (!reasoning && toolCalls.length > 0) {
        reasoning = `Tools used: ${toolCalls.map(tc => tc.name || tc.tool).join(', ')}`;
      }

      // Get the final response
      const finalMessage = result.messages[result.messages.length - 1];
      const response = finalMessage?.content || "No response generated";

      return {
        response: typeof response === 'string' ? response : JSON.stringify(response),
        sources: [...new Set(sources)], // Remove duplicates
        toolCalls,
        reasoning: reasoning || undefined
      };
    } catch (error) {
      console.error("Web search agent error:", error);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async streamSearch(query: string, conversationHistory: BaseMessage[] = []): Promise<AsyncGenerator<{
    type: 'content' | 'tool_call' | 'source' | 'done';
    data: any;
  }>> {
    const messages: BaseMessage[] = [
      ...conversationHistory,
      new HumanMessage(query)
    ];

    const stream = await this.agent.stream({ messages }, { streamMode: "values" });

    return (async function* () {
      for await (const chunk of stream) {
        const lastMessage = chunk.messages[chunk.messages.length - 1];
        
        if (lastMessage instanceof AIMessage) {
          if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            yield {
              type: 'tool_call' as const,
              data: {
                tool: lastMessage.tool_calls[0].name,
                input: lastMessage.tool_calls[0].args
              }
            };
          } else if (lastMessage.content) {
            yield {
              type: 'content' as const,
              data: lastMessage.content
            };
          }
        }
        
        // Extract sources from content
        if (lastMessage?.content && typeof lastMessage.content === 'string') {
          const urlMatches = lastMessage.content.match(/https?:\/\/[^\s]+/g);
          if (urlMatches) {
            for (const url of urlMatches) {
              yield {
                type: 'source' as const,
                data: url
              };
            }
          }
        }
      }
      
      yield { type: 'done' as const, data: null };
    })();
  }
}

export const webSearchAgentService = new WebSearchAgentService();
