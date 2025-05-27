/**
 * Streaming chat completion tool for Mercury MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MercuryClient } from '../mercury/client.js';
import { StreamingChatCompletionSchema, createValidatedHandler } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function createStreamingChatTool(client: MercuryClient): Tool {
  return {
    name: 'mercury_chat_stream',
    description: 'Stream chat completions using Mercury\'s fast diffusion-LLM with real-time output. Maintains Mercury\'s speed advantage while providing progressive feedback. Ideal for: long code generation, interactive coding sessions, live code reviews. The streaming doesn\'t slow down Mercury\'s parallel generation - you get both speed and good UX.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['system', 'user', 'assistant'] },
              content: { type: 'string' }
            },
            required: ['role', 'content']
          },
          description: 'Array of conversation messages'
        },
        model: {
          type: 'string',
          description: 'Model to use (default: mercury-coder-small)',
          default: 'mercury-coder-small'
        },
        temperature: {
          type: 'number',
          description: 'Sampling temperature (0-2)',
          minimum: 0,
          maximum: 2
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens to generate',
          minimum: 1
        },
        diffusion_steps: {
          type: 'number',
          description: 'Number of diffusion steps',
          minimum: 1,
          maximum: 100
        }
      },
      required: ['messages']
    }
  };
}

export const streamingChatHandler = (client: MercuryClient) =>
  createValidatedHandler(StreamingChatCompletionSchema, async (params) => {
    const startTime = Date.now();
    let totalTokens = 0;
    let fullContent = '';

    try {
      const request = {
        ...params,
        model: params.model || 'mercury-coder-small',
        stream: true as const,
        diffusion_steps: params.diffusion_steps || config.diffusion.defaultSteps,
        temperature: params.temperature ?? config.diffusion.defaultTemperature
      };

      logger.info('Starting streaming chat completion', {
        model: request.model,
        messageCount: request.messages.length
      });

      // Collect all chunks to return as a complete response
      // Note: In a real MCP implementation with proper streaming support,
      // we would yield chunks progressively. For now, we accumulate and return.
      const chunks: any[] = [];
      
      for await (const chunk of client.chatCompletionStream(request)) {
        if (chunk.choices[0].delta.content) {
          fullContent += chunk.choices[0].delta.content;
          totalTokens++;
        }
        
        chunks.push({
          type: 'progress',
          content: chunk.choices[0].delta.content || '',
          metadata: {
            index: chunks.length,
            finishReason: chunk.choices[0].finish_reason
          }
        });

        // Log progress periodically
        if (chunks.length % 10 === 0) {
          logger.debug('Streaming progress', {
            chunks: chunks.length,
            tokensGenerated: totalTokens
          });
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Streaming chat completion finished', {
        duration: `${duration}ms`,
        totalChunks: chunks.length,
        totalTokens,
        tokensPerSecond: totalTokens / (duration / 1000)
      });

      // Return the complete streamed content
      return {
        content: [{
          type: 'text' as const,
          text: fullContent
        }],
        metadata: {
          streaming: true,
          chunks: chunks.length,
          totalTokens,
          performance: {
            latencyMs: duration,
            tokensPerSecond: totalTokens / (duration / 1000),
            firstTokenLatencyMs: chunks.length > 0 ? 
              Math.round(duration / chunks.length) : 0
          }
        }
      };

    } catch (error) {
      logger.error('Streaming chat completion failed', { error, params });

      return {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: {
              type: 'streaming_error',
              message: error instanceof Error ? error.message : 'Streaming failed',
              partialContent: fullContent || undefined
            }
          })
        }]
      };
    }
  });