/**
 * Hello World Example for Mercury MCP Server
 * 
 * This example demonstrates:
 * 1. Connecting to the MCP server
 * 2. Listing available models
 * 3. Using chat completion
 * 4. Using FIM completion
 * 5. Streaming responses
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  // Ensure MERCURY_API_KEY is set
  if (!process.env.MERCURY_API_KEY) {
    console.error('❌ Please set MERCURY_API_KEY environment variable');
    process.exit(1);
  }

  console.log('🚀 Mercury MCP Server - Hello World Example\n');

  // Create client transport - spawn the server process
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  // Create MCP client
  const client = new Client({
    name: 'mercury-example-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    console.log('📡 Connecting to Mercury MCP Server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // List available tools
    const tools = await client.listTools();
    console.log('🔧 Available Tools:');    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Example 1: List Models
    console.log('📋 Example 1: Listing Models');
    console.log('-'.repeat(40));
    
    const modelsResult = await client.callTool({
      name: 'mercury_list_models',
      arguments: {}
    });
    
    console.log('Available models:');
    if (modelsResult.content?.[0]?.type === 'text') {
      const models = JSON.parse(modelsResult.content[0].text);
      models.data.forEach((model: any) => {
        console.log(`  - ${model.id} (${model.owned_by})`);
      });
    }
    console.log();

    // Example 2: Chat Completion
    console.log('💬 Example 2: Chat Completion');
    console.log('-'.repeat(40));
    
    const chatResult = await client.callTool({
      name: 'mercury_chat_completion',
      arguments: {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coding assistant. Be concise.'
          },
          {
            role: 'user',
            content: 'Write a TypeScript function to calculate fibonacci numbers'
          }
        ],
        model: 'mercury-coder-small',
        max_tokens: 200,
        temperature: 0.3,
        diffusion_steps: 4  // Mercury-specific parameter
      }
    });    
    if (chatResult.content?.[0]?.type === 'text') {
      const response = JSON.parse(chatResult.content[0].text);
      console.log('Response:', response.choices[0].message.content);
      console.log(`\nTokens used: ${response.usage.total_tokens}`);
    }
    console.log();

    // Example 3: FIM Completion
    console.log('🔧 Example 3: Fill-in-the-Middle (FIM)');
    console.log('-'.repeat(40));
    
    const fimResult = await client.callTool({
      name: 'mercury_fim_completion',
      arguments: {
        prefix: 'def calculate_average(numbers: list[float]) -> float:\n    """Calculate the average of a list of numbers."""\n    if not numbers:\n        return 0.0\n    \n    total = ',
        suffix: '\n    return total / len(numbers)',
        model: 'mercury-coder-small',
        max_tokens: 50,
        temperature: 0.2,
        num_alternatives: 2  // Get multiple suggestions
      }
    });
    
    if (fimResult.content?.[0]?.type === 'text') {
      const response = JSON.parse(fimResult.content[0].text);
      console.log('Generated completions:');
      response.choices.forEach((choice: any, idx: number) => {
        console.log(`  ${idx + 1}. ${choice.text.trim()}`);
      });
    }
    console.log();    // Example 4: Streaming (simulated with regular completion)
    console.log('🌊 Example 4: Streaming Response');
    console.log('-'.repeat(40));
    
    const streamResult = await client.callTool({
      name: 'mercury_chat_stream',
      arguments: {
        messages: [
          {
            role: 'user',
            content: 'Count from 1 to 5 with brief explanations'
          }
        ],
        model: 'mercury-coder-small',
        max_tokens: 100,
        stream: true
      }
    });
    
    if (streamResult.content?.[0]?.type === 'text') {
      console.log('Stream simulation:', streamResult.content[0].text);
    }

    // Clean disconnect
    console.log('\n👋 Disconnecting...');
    await client.close();
    console.log('✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    await client.close();
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);