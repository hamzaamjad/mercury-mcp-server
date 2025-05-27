/**
 * Configuration management for Mercury MCP Server
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema with Zod validation
const ConfigSchema = z.object({
  mercury: z.object({
    apiKey: z.string().min(1, 'MERCURY_API_KEY is required'),
    baseUrl: z.string().url().default('https://api.inceptionlabs.ai/v1'),
    timeout: z.number().positive().default(30000),
    maxRetries: z.number().int().positive().default(3),
    retryDelay: z.number().positive().default(1000)
  }),
  server: z.object({
    port: z.number().int().positive().default(3000),
    host: z.string().default('localhost'),
    transport: z.enum(['stdio', 'http']).default('stdio')
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('json')
  }),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().positive().default(300),
    maxSize: z.number().positive().default(100)
  }),
  security: z.object({
    rateLimiting: z.object({
      enabled: z.boolean().default(true),
      max: z.number().positive().default(100),
      windowMs: z.number().positive().default(60000)
    }),
    maxRequestSize: z.string().default('1mb')
  }),
  diffusion: z.object({
    defaultSteps: z.number().int().positive().default(20),
    maxSteps: z.number().int().positive().default(50),
    stabilityThreshold: z.number().min(0).max(1).default(0.85),
    defaultTemperature: z.number().min(0).max(2).default(0.7)
  })
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const rawConfig = {
    mercury: {
      apiKey: process.env.MERCURY_API_KEY || '',
      baseUrl: process.env.MERCURY_API_URL || 'https://api.inceptionlabs.ai/v1',
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000')
    },
    server: {
      port: parseInt(process.env.MCP_SERVER_PORT || '3000'),
      host: process.env.MCP_SERVER_HOST || 'localhost',
      transport: (process.env.MCP_TRANSPORT || 'stdio') as 'stdio' | 'http'
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as any,
      format: (process.env.LOG_FORMAT || 'json') as any
    },
    cache: {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL || '300'),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100')
    },
    security: {
      rateLimiting: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
      },
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '1mb'
    },
    diffusion: {
      defaultSteps: parseInt(process.env.DIFFUSION_DEFAULT_STEPS || '20'),
      maxSteps: parseInt(process.env.DIFFUSION_MAX_STEPS || '50'),
      stabilityThreshold: parseFloat(process.env.DIFFUSION_STABILITY_THRESHOLD || '0.85'),
      defaultTemperature: parseFloat(process.env.DIFFUSION_DEFAULT_TEMPERATURE || '0.7')
    }
  };

  // Validate configuration
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export singleton config instance
export const config = loadConfig();