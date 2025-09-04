import { webSearchAgentService } from './web-search-agent';
import { MCPTool } from './context/mcp-context';

export class MCPWebSearchTool implements MCPTool {
  name = 'web_search';
  description = 'Search the web for current information and provide comprehensive answers with sources';
  inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find information on the web'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of search results to return (default: 5)',
        default: 5
      }
    },
    required: ['query']
  };

  async execute(input: { query: string; maxResults?: number }): Promise<string> {
    try {
      const result = await webSearchAgentService.search(input.query);
      
      // Format the result for MCP consumption
      const formattedResult = {
        response: result.response,
        sources: result.sources,
        toolCalls: result.toolCalls.map(tc => ({
          name: tc.name,
          args: tc.args
        }))
      };

      return JSON.stringify(formattedResult, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        response: 'Web search failed',
        sources: [],
        toolCalls: []
      });
    }
  }
}

export const mcpWebSearchTool = new MCPWebSearchTool();
