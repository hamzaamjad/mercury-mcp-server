/**
 * Unit tests for validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import { 
  ChatCompletionSchema, 
  FIMCompletionSchema,
  validateInput 
} from '../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('ChatCompletionSchema', () => {
    it('should validate valid chat completion request', () => {
      const validRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' }
        ],
        model: 'mercury-coder-small',
        temperature: 0.7,
        max_tokens: 100
      };

      const result = validateInput(ChatCompletionSchema, validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid message roles', () => {
      const invalidRequest = {
        messages: [
          { role: 'invalid', content: 'Test' }
        ]
      };

      const result = validateInput(ChatCompletionSchema, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('messages.0.role: Invalid enum value');
    });

    it('should reject empty messages array', () => {
      const invalidRequest = {
        messages: []
      };

      const result = validateInput(ChatCompletionSchema, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('At least one message is required');
    });

    it('should validate diffusion-specific parameters', () => {
      const request = {
        messages: [{ role: 'user', content: 'Test' }],
        diffusion_steps: 30,
        noise_schedule: 'cosine'
      };

      const result = validateInput(ChatCompletionSchema, request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.diffusion_steps).toBe(30);
        expect(result.data.noise_schedule).toBe('cosine');
      }
    });
  });

  describe('FIMCompletionSchema', () => {
    it('should validate valid FIM request', () => {
      const validRequest = {
        prompt: 'def add(a, b):',
        suffix: '    return result',
        max_middle_tokens: 50,
        alternative_completions: 3
      };

      const result = validateInput(FIMCompletionSchema, validRequest);
      expect(result.success).toBe(true);
    });

    it('should require both prompt and suffix', () => {
      const invalidRequest = {
        prompt: 'def add(a, b):'
      };

      const result = validateInput(FIMCompletionSchema, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('suffix');
    });

    it('should validate alternative completions range', () => {
      const invalidRequest = {
        prompt: 'test',
        suffix: 'test',
        alternative_completions: 10
      };

      const result = validateInput(FIMCompletionSchema, invalidRequest);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('alternative_completions');
    });
  });
});