#!/usr/bin/env node
/**
 * Mercury MCP Server Entry Point
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MercuryMCPServer } from './server.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

async function main() {
  try {
    logger.info('Starting Mercury MCP Server...', {
      transport: config.server.transport,
      nodeVersion: process.version,
      platform: process.platform
    });

    // Create server instance
    const mercuryServer = new MercuryMCPServer();
    const server = mercuryServer.getServer();

    // Set up transport based on configuration
    if (config.server.transport === 'stdio') {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      
      logger.info('Mercury MCP Server running on stdio transport');
      console.error('Mercury MCP Server is ready for connections');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        await mercuryServer.shutdown();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        await mercuryServer.shutdown();
        process.exit(0);
      });

    } else if (config.server.transport === 'http') {
      // HTTP transport implementation (for future enhancement)
      logger.error('HTTP transport not yet implemented');
      process.exit(1);
    } else {
      logger.error('Unknown transport type', { transport: config.server.transport });
      process.exit(1);
    }

  } catch (error) {
    logger.error('Failed to start Mercury MCP Server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('MERCURY_API_KEY')) {
        console.error('\n❌ Error: Mercury API key not found');
        console.error('Please set the MERCURY_API_KEY environment variable:');
        console.error('  export MERCURY_API_KEY="your_api_key_here"');
        console.error('\nOr create a .env file with:');
        console.error('  MERCURY_API_KEY=your_api_key_here\n');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('\n❌ Error: Cannot connect to Mercury API');
        console.error('Please check:');
        console.error('  1. Your internet connection');
        console.error('  2. The MERCURY_API_URL environment variable');
        console.error('  3. Any firewall or proxy settings\n');
      } else {
        console.error(`\n❌ Error: ${error.message}\n`);
      }
    }
    
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});