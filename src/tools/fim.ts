/**
 * Fill-in-the-Middle (FIM) completion tool for Mercury MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MercuryClient } from '../mercury/client.js';
import { FIMCompletionSchema, createValidatedHandler } from '../utils/validation.js';
import { MercuryErrorFactory } from '../mercury/errors.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function createFIMCompletionTool(client: MercuryClient): Tool {
  return {
    name: 'mercury_fim_completion',
    description: 'Generate code completions using Fill-in-the-Middle (FIM) - Mercury\'s killer feature for code insertion. Unlike traditional models, Mercury\'s diffusion architecture understands bidirectional context exceptionally well. Perfect for: completing function bodies, adding logic between existing code, implementing missing methods, inserting error handling. Supports multiple alternatives for better code suggestions. This is where Mercury truly outperforms other models.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Code before the cursor (prefix context)'
        },
        suffix: {
          type: 'string',
          description: 'Code after the cursor (suffix context)'
        },
        model: {
          type: 'string',
          description: 'Model to use (default: mercury-coder-small)',
          default: 'mercury-coder-small'
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens to generate for the middle section',
          minimum: 1,
          maximum: 4096
        },
        temperature: {
          type: 'number',
          description: 'Sampling temperature (0-2)',
          minimum: 0,
          maximum: 2
        },
        max_middle_tokens: {
          type: 'number',
          description: 'Maximum tokens to generate between prefix and suffix. Mercury\'s parallel generation means this doesn\'t slow down linearly - 500 tokens is nearly as fast as 100.',
          minimum: 1,
          maximum: 2048,
          default: 256
        },
        diffusion_steps: {
          type: 'number',
          description: 'Number of diffusion steps for generation',
          minimum: 1,
          maximum: 100
        },
        alternative_completions: {
          type: 'number',
          description: 'Number of alternative completions. Mercury\'s diffusion process naturally generates multiple candidates internally, so requesting 3-5 alternatives has minimal performance impact while providing better options.',
          minimum: 1,
          maximum: 5,
          default: 3
        }
      },
      required: ['prompt', 'suffix']
    }
  };
}

export const fimCompletionHandler = (client: MercuryClient) =>
  createValidatedHandler(FIMCompletionSchema, async (params) => {
    const startTime = Date.now();

    try {
      // Validate context boundaries
      if (!params.prompt && !params.suffix) {
        return MercuryErrorFactory.fimBoundaryError(
          'At least one of prompt or suffix must be provided'
        ).toMCPError();
      }

      // Check cache for deterministic requests
      const cacheKey = cache.generateKey('fim', params);
      if (params.temperature === 0 || params.temperature === undefined) {
        const cached = cache.get<any>(cacheKey);
        if (cached) {
          logger.info('FIM completion served from cache');
          return cached;
        }
      }

      // Apply FIM-specific defaults and limits
      const request = {
        ...params,
        model: params.model || 'mercury-coder-small',
        max_tokens: params.max_middle_tokens || params.max_tokens || 256,
        diffusion_steps: params.diffusion_steps || config.diffusion.defaultSteps,
        temperature: params.temperature ?? 0.2, // Lower default for code
        alternative_completions: params.alternative_completions || 1
      };

      logger.info('Sending FIM completion request', {
        model: request.model,
        prefixLength: request.prompt.length,
        suffixLength: request.suffix.length,
        alternatives: request.alternative_completions
      });

      const response = await client.fimCompletion(request);
      const duration = Date.now() - startTime;

      // Process alternatives if requested
      const alternatives = response.choices.slice(0, request.alternative_completions);
      const bestChoice = alternatives.reduce((best, current) => 
        (current.confidence_score || 0) > (best.confidence_score || 0) ? current : best
      );

      // Check for context mismatch
      const fimMetadata = response.fim_metadata;
      if (fimMetadata && fimMetadata.best_confidence_score < 0.7) {
        logger.warn('Low FIM confidence detected', {
          score: fimMetadata.best_confidence_score,
          alternatives: fimMetadata.alternatives_generated
        });
      }

      const result = {
        content: [{
          type: 'text' as const,
          text: bestChoice.text
        }],
        metadata: {
          model: response.model,
          usage: response.usage,
          finishReason: bestChoice.finish_reason,
          confidence: bestChoice.confidence_score,
          alternatives: alternatives.map(alt => ({
            text: alt.text,
            confidence: alt.confidence_score
          })),
          performance: {
            latencyMs: duration,
            tokensPerSecond: response.usage.completion_tokens / (duration / 1000)
          },
          fim: fimMetadata
        }
      };

      // Cache successful high-confidence results
      if ((params.temperature === 0 || params.temperature === undefined) && 
          bestChoice.confidence_score && bestChoice.confidence_score > 0.8) {
        cache.set(cacheKey, result, config.cache.ttl * 2); // Longer TTL for code
      }

      logger.info('FIM completion successful', {
        duration: `${duration}ms`,
        tokens: response.usage.completion_tokens,
        confidence: bestChoice.confidence_score,
        alternativesGenerated: alternatives.length
      });

      return result;

    } catch (error) {
      logger.error('FIM completion failed', { error, params });

      // Handle FIM-specific errors
      if (error instanceof Error) {
        if (error.message.includes('boundary') || error.message.includes('context')) {
          return MercuryErrorFactory.fimBoundaryError(
            'Invalid context boundaries - ensure prefix and suffix form valid code structure'
          ).toMCPError();
        }
      }

      return {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: {
              type: 'fim_error',
              message: error instanceof Error ? error.message : 'FIM completion failed',
              suggestion: 'Try adjusting the prefix/suffix context or reducing max_tokens'
            }
          })
        }]
      };
    }
  });