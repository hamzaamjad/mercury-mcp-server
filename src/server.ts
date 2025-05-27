/**
 * Mercury MCP Server implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { MercuryClient } from './mercury/client.js';
import { createToolRegistry } from './tools/index.js';
import { logger, logRequest, logResponse } from './utils/logger.js';
import { config } from './config/index.js';

export class MercuryMCPServer {
  private server: Server;
  private mercuryClient: MercuryClient;
  private toolRegistry: ReturnType<typeof createToolRegistry>;

  constructor() {
    // Initialize Mercury client
    this.mercuryClient = new MercuryClient({
      apiKey: config.mercury.apiKey,
      baseUrl: config.mercury.baseUrl,
      timeout: config.mercury.timeout,
      maxRetries: config.mercury.maxRetries,
      retryDelay: config.mercury.retryDelay
    });

    // Create tool registry
    this.toolRegistry = createToolRegistry(this.mercuryClient);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'mercury-mcp-server',
        version: '0.1.0'
      },
      {
        capabilities: {
          tools: {},
          // Resources and prompts can be added in future versions
        }
      }
    );

    // Set up request handlers
    this.setupHandlers();

    logger.info('Mercury MCP Server initialized', {
      name: 'mercury-mcp-server',
      version: '0.1.0',
      transport: config.server.transport,
      toolCount: this.toolRegistry.tools.length
    });
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const startTime = Date.now();
      logRequest('tools/list', {});

      try {
        const result = {
          tools: this.toolRegistry.tools
        };

        logResponse('tools/list', result, Date.now() - startTime);
        return result;
      } catch (error) {
        logger.error('Failed to list tools', { error });
        throw error;
      }
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startTime = Date.now();
      const { name: toolName, arguments: args } = request.params;
      
      logRequest('tools/call', { toolName, arguments: args });

      try {
        const handler = this.toolRegistry.handlers.get(toolName);
        
        if (!handler) {
          logger.error('Tool not found', { toolName });
          return {
            isError: true,
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: {
                  type: 'tool_not_found',
                  message: `Unknown tool: ${toolName}`,
                  available_tools: Array.from(this.toolRegistry.handlers.keys())
                }
              })
            }]
          };
        }

        // Execute tool handler
        const result = await handler(args);
        
        logResponse('tools/call', { toolName, hasError: !!result.isError }, Date.now() - startTime);
        return result;

      } catch (error) {
        logger.error('Tool execution failed', { 
          toolName, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });

        return {
          isError: true,
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: {
                type: 'execution_error',
                message: error instanceof Error ? error.message : 'Tool execution failed',
                tool: toolName
              }
            })
          }]
        };
      }
    });

    // Handle initialization
    this.server.onerror = (error) => {
      logger.error('MCP server error', { error });
    };
  }

  /**
   * Get the MCP server instance
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Shutdown the server gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Mercury MCP Server');
    await this.server.close();
  }
}