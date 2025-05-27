/**
 * Mercury API Client
 * Handles communication with Mercury diffusion-LLM API
 */

import pRetry from 'p-retry';
import { 
  MercuryChatCompletionRequest, 
  MercuryChatCompletionResponse,
  MercuryStreamChunk,
  MercuryFIMCompletionRequest,
  MercuryFIMCompletionResponse,
  MercuryModelListResponse,
  MercuryError
} from './types.js';

export interface MercuryClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class MercuryClient {
  private config: Required<MercuryClientConfig>;

  constructor(config: MercuryClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000
    };

    if (!this.config.apiKey) {
      throw new Error('Mercury API key is required');
    }
  }

  /**
   * Create a chat completion
   */
  async chatCompletion(
    request: MercuryChatCompletionRequest
  ): Promise<MercuryChatCompletionResponse> {
    return this.request<MercuryChatCompletionResponse>(
      '/chat/completions',
      'POST',
      request
    );
  }

  /**
   * Create a streaming chat completion
   */
  async *chatCompletionStream(
    request: MercuryChatCompletionRequest
  ): AsyncGenerator<MercuryStreamChunk, void, unknown> {
    const response = await this.rawRequest(
      '/chat/completions',
      'POST',
      { ...request, stream: true }
    );

    if (!response.body) {
      throw new Error('No response body for streaming request');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const chunk = JSON.parse(data) as MercuryStreamChunk;
              yield chunk;
            } catch (e) {
              console.error('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  /**
   * Create a FIM (Fill-in-the-Middle) completion
   */
  async fimCompletion(
    request: MercuryFIMCompletionRequest
  ): Promise<MercuryFIMCompletionResponse> {
    return this.request<MercuryFIMCompletionResponse>(
      '/fim/completions',
      'POST',
      request
    );
  }

  /**
   * List available models
   */
  async listModels(): Promise<MercuryModelListResponse> {
    return this.request<MercuryModelListResponse>(
      '/models',
      'GET'
    );
  }

  /**
   * Make a raw HTTP request with retry logic
   */
  private async rawRequest(
    path: string,
    method: string,
    body?: any
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'mercury-mcp-server/0.1.0'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Make an API request with retry logic and error handling
   */
  private async request<T>(
    path: string,
    method: string,
    body?: any
  ): Promise<T> {
    return pRetry(
      async () => {
        const response = await this.rawRequest(path, method, body);

        if (!response.ok) {
          const errorBody = await response.text();
          let error: MercuryError;
          
          try {
            error = JSON.parse(errorBody);
          } catch {
            error = {
              error: {
                message: errorBody || response.statusText,
                type: 'api_error',
                code: response.status.toString()
              }
            };
          }

          // Throw specific errors based on status code
          if (response.status === 401) {
            throw new Error(`Authentication error: ${error.error.message}`);
          } else if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const retryError = new Error(`Rate limit exceeded: ${error.error.message}`);
            (retryError as any).retryAfter = retryAfter ? parseInt(retryAfter) : undefined;
            throw retryError;
          } else if (response.status >= 500) {
            throw new Error(`Server error: ${error.error.message}`);
          } else {
            throw new Error(`API error: ${error.error.message}`);
          }
        }

        return response.json() as Promise<T>;
      },
      {
        retries: this.config.maxRetries,
        minTimeout: this.config.retryDelay,
        maxTimeout: this.config.retryDelay * 10,
        onFailedAttempt: (error: any) => {
          console.error(
            `Mercury API request failed (attempt ${error.attemptNumber}/${this.config.maxRetries}):`,
            error.message
          );
        },
        retryOptions: {
          // Retry on network errors and 5xx errors
          shouldRetry: (error: any) => {
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
              return true;
            }
            if (error.message?.includes('Server error')) {
              return true;
            }
            if (error.retryAfter) {
              // Wait for rate limit to reset
              return new Promise(resolve => 
                setTimeout(() => resolve(true), error.retryAfter * 1000)
              );
            }
            return false;
          }
        }
      } as any
    );
  }
}