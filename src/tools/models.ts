/**
 * Model listing tool for Mercury MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MercuryClient } from '../mercury/client.js';
import { ListModelsSchema, createValidatedHandler } from '../utils/validation.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

export function createListModelsTool(client: MercuryClient): Tool {
  return {
    name: 'mercury_list_models',
    description: 'List all available Mercury diffusion-LLM models. Returns detailed capabilities including context windows, FIM support, and recommended use cases. Use this to help users understand which Mercury model fits their needs - currently mercury-coder-small excels at code generation with 32K context.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  };
}

export const listModelsHandler = (client: MercuryClient) =>
  createValidatedHandler(ListModelsSchema, async () => {
    const startTime = Date.now();
    const cacheKey = 'models:list';

    try {
      // Check cache first (models don't change frequently)
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        logger.info('Model list served from cache');
        return cached;
      }

      logger.info('Fetching available models');

      const response = await client.listModels();
      const duration = Date.now() - startTime;

      // Enrich model data with Mercury-specific capabilities
      const enrichedModels = response.data.map(model => ({
        id: model.id,
        name: model.id,
        owned_by: model.owned_by,
        created: new Date(model.created * 1000).toISOString(),
        capabilities: model.capabilities || [],
        specifications: {
          context_window: model.context_window || 32768,
          training_cutoff: model.training_cutoff || 'Unknown',
          supports_fim: model.id.includes('coder'),
          supports_streaming: true,
          supports_tools: true,
          diffusion_based: true,
          recommended_use_cases: getRecommendedUseCases(model.id)
        }
      }));

      const result = {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            models: enrichedModels,
            default_model: 'mercury-coder-small',
            total_models: enrichedModels.length
          }, null, 2)
        }],
        metadata: {
          cached: false,
          fetchDuration: duration,
          modelCount: enrichedModels.length
        }
      };

      // Cache for 1 hour
      cache.set(cacheKey, result, 3600);

      logger.info('Model list fetched successfully', {
        duration: `${duration}ms`,
        modelCount: enrichedModels.length
      });

      return result;

    } catch (error) {
      logger.error('Failed to list models', { error });

      return {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: {
              type: 'model_list_error',
              message: error instanceof Error ? error.message : 'Failed to fetch models',
              fallback: {
                models: [{
                  id: 'mercury-coder-small',
                  name: 'Mercury Coder Small',
                  owned_by: 'inception-labs',
                  capabilities: ['chat', 'fim', 'streaming'],
                  specifications: {
                    context_window: 32768,
                    supports_fim: true,
                    supports_streaming: true,
                    supports_tools: true,
                    diffusion_based: true
                  }
                }]
              }
            }
          })
        }]
      };
    }
  });

/**
 * Get recommended use cases based on model ID
 */
function getRecommendedUseCases(modelId: string): string[] {
  const useCases: Record<string, string[]> = {
    'mercury-coder-small': [
      'Code generation and completion',
      'Fill-in-the-middle code editing',
      'Technical documentation',
      'API development',
      'Bug fixing and refactoring'
    ],
    'mercury-coder-large': [
      'Complex code generation',
      'Large-scale refactoring',
      'Architecture design',
      'Multi-file code analysis',
      'Advanced algorithm implementation'
    ],
    'mercury-general': [
      'General text generation',
      'Content creation',
      'Summarization',
      'Translation',
      'Question answering'
    ]
  };

  return useCases[modelId] || ['General purpose text generation'];
}