/**
 * Chat completion tool for Mercury MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { MercuryClient } from '../mercury/client.js';
import { MercuryAPIError, MercuryErrorFactory } from '../mercury/errors.js';
import { ChatCompletionSchema, createValidatedHandler } from '../utils/validation.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function createChatCompletionTool(client: MercuryClient): Tool {
  return {
    name: 'mercury_chat_completion',
    description: 'Generate chat completions using Mercury\'s diffusion-LLM - a revolutionary model that\'s 10x faster than traditional LLMs for code generation. Uses parallel token generation and iterative refinement. Best for: code generation, technical documentation, API implementations, and debugging. Set diffusion_steps higher (30-40) for better quality or lower (15-20) for speed.',
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
          description: 'Controls randomness in the diffusion process. Lower values (0.1-0.5) produce more deterministic code. Unlike traditional LLMs, this affects the noise schedule in diffusion. Recommended: 0.2-0.3 for code, 0.5-0.7 for creative tasks.',
          minimum: 0,
          maximum: 2,
          default: 0.3
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens to generate',
          minimum: 1
        },
        diffusion_steps: {
          type: 'number',
          description: 'Number of diffusion refinement iterations. More steps = higher quality but slower. Recommended: 15-20 for drafts, 25-35 for balanced (default), 40-50 for maximum quality. This is unique to diffusion models and directly impacts output quality.',
          minimum: 1,
          maximum: 100,
          default: 30
        }
      },
      required: ['messages']
    }
  };
}

export const chatCompletionHandler = (client: MercuryClient) =>
  createValidatedHandler(ChatCompletionSchema, async (params) => {
    const startTime = Date.now();

    try {
      // Check cache for non-creative requests
      if (params.temperature === 0 || params.temperature === undefined) {
        const cacheKey = cache.generateKey('chat', params);
        const cached = cache.get<any>(cacheKey);
        if (cached) {
          logger.info('Chat completion served from cache');
          return cached;
        }
      }

      // Apply diffusion-specific defaults
      const request = {
        ...params,
        model: params.model || 'mercury-coder-small',
        diffusion_steps: params.diffusion_steps || config.diffusion.defaultSteps,
        temperature: params.temperature ?? config.diffusion.defaultTemperature
      };

      logger.info('Sending chat completion request', {
        model: request.model,
        messageCount: request.messages.length,
        diffusionSteps: request.diffusion_steps
      });

      const response = await client.chatCompletion(request);
      const duration = Date.now() - startTime;

      // Extract diffusion metadata if available
      const choice = response.choices[0];
      const diffusionMetadata = choice.diffusion_metadata;

      // Check stability threshold
      if (diffusionMetadata && diffusionMetadata.confidence_score < config.diffusion.stabilityThreshold) {
        logger.warn('Low confidence score detected', {
          score: diffusionMetadata.confidence_score,
          threshold: config.diffusion.stabilityThreshold
        });
      }

      const result = {
        content: [{
          type: 'text' as const,
          text: choice.message.content
        }],
        metadata: {
          model: response.model,
          usage: response.usage,
          finishReason: choice.finish_reason,
          performance: {
            latencyMs: duration,
            tokensPerSecond: response.usage.completion_tokens / (duration / 1000)
          },
          diffusion: diffusionMetadata
        }
      };

      // Cache successful responses for deterministic requests
      if (params.temperature === 0 || params.temperature === undefined) {
        const cacheKey = cache.generateKey('chat', params);
        cache.set(cacheKey, result);
      }

      logger.info('Chat completion successful', {
        duration: `${duration}ms`,
        tokens: response.usage.total_tokens,
        finishReason: choice.finish_reason
      });

      return result;

    } catch (error) {
      logger.error('Chat completion failed', { error, params });

      if (error instanceof MercuryAPIError) {
        return error.toMCPError();
      }

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return MercuryErrorFactory.validationError(
            'Request timeout - try reducing max_tokens or simplifying the prompt'
          ).toMCPError();
        }
        
        if (error.message.includes('convergence')) {
          const suggestedSteps = Math.min(
            (params.diffusion_steps || config.diffusion.defaultSteps) * 1.5,
            config.diffusion.maxSteps
          );
          return MercuryErrorFactory.diffusionConvergenceError(
            params.diffusion_steps || config.diffusion.defaultSteps,
            0.5
          ).toMCPError();
        }
      }

      // Generic error fallback
      return {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: {
              type: 'internal_error',
              message: error instanceof Error ? error.message : 'Unknown error occurred'
            }
          })
        }]
      };
    }
  });