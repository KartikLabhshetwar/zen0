import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpWebSearchTool } from '../mcp-web-search-tool';

class WebSearchMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "web-search-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: mcpWebSearchTool.name,
            description: mcpWebSearchTool.description,
            inputSchema: mcpWebSearchTool.inputSchema,
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === mcpWebSearchTool.name) {
        try {
          const result = await mcpWebSearchTool.execute(args as any);
          return {
            content: [
              {
                type: "text",
                text: result,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error executing web search: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Web Search MCP server running on stdio");
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  const server = new WebSearchMCPServer();
  server.run().catch(console.error);
}

export { WebSearchMCPServer };
