/**
 * Tool registry for Mercury MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MercuryClient } from '../mercury/client.js';
import { createChatCompletionTool, chatCompletionHandler } from './chat.js';
import { createStreamingChatTool, streamingChatHandler } from './streaming.js';
import { createFIMCompletionTool, fimCompletionHandler } from './fim.js';
import { createListModelsTool, listModelsHandler } from './models.js';

export interface ToolRegistry {
  tools: Tool[];
  handlers: Map<string, (params: any) => Promise<any>>;
}

/**
 * Create and register all Mercury tools
 */
export function createToolRegistry(client: MercuryClient): ToolRegistry {
  const tools: Tool[] = [
    createChatCompletionTool(client),
    createStreamingChatTool(client),
    createFIMCompletionTool(client),
    createListModelsTool(client)
  ];

  const handlers = new Map<string, (params: any) => Promise<any>>([
    ['mercury_chat_completion', chatCompletionHandler(client)],
    ['mercury_chat_stream', streamingChatHandler(client)],
    ['mercury_fim_completion', fimCompletionHandler(client)],
    ['mercury_list_models', listModelsHandler(client)]
  ]);

  return { tools, handlers };
}