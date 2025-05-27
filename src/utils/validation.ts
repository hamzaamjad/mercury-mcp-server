/**
 * Zod validation schemas for Mercury MCP tools
 */

import { z } from 'zod';

// Message schema
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
  name: z.string().optional()
});

// Tool schema
export const ToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.any())
  })
});

// Chat completion request schema
export const ChatCompletionSchema = z.object({
  messages: z.array(MessageSchema).min(1, 'At least one message is required'),
  model: z.string().default('mercury-coder-small'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().max(32000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  user: z.string().optional(),
  tools: z.array(ToolSchema).optional(),
  tool_choice: z.union([
    z.literal('none'),
    z.literal('auto'),
    z.object({
      type: z.literal('function'),
      function: z.object({ name: z.string() })
    })
  ]).optional(),
  // Diffusion-specific parameters
  diffusion_steps: z.number().int().positive().max(100).optional(),
  noise_schedule: z.enum(['linear', 'cosine', 'exponential']).optional()
});

// Streaming chat completion schema (extends base schema)
export const StreamingChatCompletionSchema = ChatCompletionSchema.extend({
  stream: z.literal(true)
});

// FIM completion request schema
export const FIMCompletionSchema = z.object({
  prompt: z.string().describe('Code before the cursor'),
  suffix: z.string().describe('Code after the cursor'),
  model: z.string().default('mercury-coder-small'),
  max_tokens: z.number().positive().max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  // FIM-specific parameters
  max_middle_tokens: z.number().positive().max(2048).optional(),
  diffusion_steps: z.number().int().positive().max(100).optional(),
  alternative_completions: z.number().int().min(1).max(5).optional()
});

// Model list request schema (empty for now)
export const ListModelsSchema = z.object({});

// Validate and transform input with detailed error messages
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

// Helper to create a validated tool handler
export function createValidatedHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<any>
) {
  return async (input: unknown) => {
    const validation = validateInput(schema, input);
    if (!validation.success) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: {
              type: 'validation_error',
              message: 'Invalid input parameters',
              errors: validation.errors
            }
          })
        }]
      };
    }
    return handler(validation.data);
  };
}