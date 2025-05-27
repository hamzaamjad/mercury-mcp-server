/**
 * Cache implementation for Mercury MCP Server
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export class MCPCache {
  private cache: NodeCache;
  private hits = 0;
  private misses = 0;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.ttl * 0.2,
      useClones: true,
      maxKeys: config.cache.maxSize
    });

    // Log cache statistics periodically
    setInterval(() => {
      this.logStats();
    }, 60000); // Every minute
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(prefix: string, params: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    if (!config.cache.enabled) return undefined;

    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.hits++;
      logger.debug('Cache hit', { key });
    } else {
      this.misses++;
      logger.debug('Cache miss', { key });
    }
    return value;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (!config.cache.enabled) return false;

    try {
      const success = this.cache.set(key, value, ttl || config.cache.ttl);
      if (success) {
        logger.debug('Cache set', { key, ttl: ttl || config.cache.ttl });
      }
      return success;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.del(key);
    logger.debug('Cache delete', { key });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.cache.keys();
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      size: keys.length,
      maxSize: config.cache.maxSize,
      ttl: config.cache.ttl
    };
  }

  /**
   * Log cache statistics
   */
  private logStats(): void {
    const stats = this.getStats();
    logger.info('Cache statistics', stats);
  }
}

// Export singleton instance
export const cache = new MCPCache();