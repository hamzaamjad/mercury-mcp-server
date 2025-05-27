/**
 * Mercury API Types
 * Based on Inception Labs Mercury diffusion-LLM API
 */

export interface MercuryMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface MercuryTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface MercuryToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface MercuryChatCompletionRequest {
  model: string;
  messages: MercuryMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  user?: string;
  tools?: MercuryTool[];
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
  // Diffusion-specific parameters
  diffusion_steps?: number;
  noise_schedule?: 'linear' | 'cosine' | 'exponential';
}

export interface MercuryChoice {
  index: number;
  message: MercuryMessage & {
    tool_calls?: MercuryToolCall[];
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'function_call';
  // Diffusion-specific metadata
  diffusion_metadata?: {
    steps_completed: number;
    noise_reduction_ratio: number;
    confidence_score: number;
  };
}

export interface MercuryUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface MercuryChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: MercuryChoice[];
  usage: MercuryUsage;
  // Additional diffusion model metadata
  performance_metrics?: {
    latency_ms: number;
    throughput_tokens_per_second: number;
  };
}

export interface MercuryStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<MercuryMessage> & {
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}

export interface MercuryFIMCompletionRequest {
  model: string;
  prompt: string;  // Code before the cursor
  suffix: string;  // Code after the cursor
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string | string[];
  // FIM-specific parameters
  max_middle_tokens?: number;
  diffusion_steps?: number;
  alternative_completions?: number;
}

export interface MercuryFIMCompletionResponse {
  id: string;
  object: 'fim.completion';
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    finish_reason: string;
    confidence_score?: number;
  }>;
  usage: MercuryUsage;
  // FIM-specific metadata
  fim_metadata?: {
    alternatives_generated: number;
    best_confidence_score: number;
    diffusion_steps_used: number;
  };
}

export interface MercuryModel {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  capabilities?: string[];
  context_window?: number;
  training_cutoff?: string;
}

export interface MercuryModelListResponse {
  object: 'list';
  data: MercuryModel[];
}

export interface MercuryError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}