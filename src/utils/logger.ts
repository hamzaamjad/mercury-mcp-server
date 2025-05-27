/**
 * Winston logger configuration for Mercury MCP Server
 */

import winston from 'winston';
import { config } from '../config/index.js';

// Custom format for pretty printing
const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// JSON format for production
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: config.logging.format === 'json' ? jsonFormat : prettyFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

// Log unhandled errors
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Helper function to mask sensitive data
export function maskSensitive(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const masked = { ...obj };
  const sensitiveKeys = ['apiKey', 'api_key', 'authorization', 'password', 'secret'];
  
  for (const key in masked) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitive(masked[key]);
    }
  }
  
  return masked;
}

// Request logging middleware
export function logRequest(method: string, params: any) {
  logger.info('MCP Request', {
    method,
    params: maskSensitive(params)
  });
}

// Response logging middleware
export function logResponse(method: string, result: any, duration: number) {
  logger.info('MCP Response', {
    method,
    duration: `${duration}ms`,
    hasError: !!result.isError
  });
}

// Error logging helper
export function logError(error: Error, context?: any) {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context: maskSensitive(context)
  });
}