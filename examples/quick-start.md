# Mercury MCP Server - Quick Start Guide

## Prerequisites
- Node.js 18+
- MERCURY_API_KEY environment variable set

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mercury-mcp-server

# Install dependencies
npm install

# Build the server
npm run build
```

## Basic Usage

### 1. Start the MCP Server

```bash
# Set your API key
export MERCURY_API_KEY="your-api-key-here"

# Start the server
npm start
```

### 2. Test with MCP Inspector

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run inspector pointing to your server
npx @modelcontextprotocol/inspector dist/index.js
```

### 3. Integrate with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mercury": {
      "command": "node",
      "args": ["/path/to/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Quick Examples

### Chat Completion
```typescript
await client.callTool({
  name: 'mercury_chat_completion',
  arguments: {
    messages: [
      { role: 'user', content: 'Write a hello world in Python' }
    ],
    model: 'mercury-coder-small',
    max_tokens: 100
  }
});
```

### Fill-in-the-Middle (FIM)
```typescript
await client.callTool({
  name: 'mercury_fim_completion',
  arguments: {
    prefix: 'def add(a, b):\n    return ',
    suffix: '\n\n# Test the function',
    model: 'mercury-coder-small',
    max_tokens: 20
  }
});
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| MERCURY_API_KEY | Yes | Your Mercury API key | - |
| MERCURY_BASE_URL | No | API base URL | https://api.mercury.ai/v1 |
| LOG_LEVEL | No | Logging level | info |
| CACHE_TTL | No | Cache duration (seconds) | 300 |
| MAX_RETRIES | No | API retry attempts | 3 |

## Troubleshooting

1. **API Key Issues**
   ```bash
   # Verify your API key is set
   echo $MERCURY_API_KEY
   ```

2. **Connection Issues**
   ```bash
   # Test direct API connection
   curl -H "Authorization: Bearer $MERCURY_API_KEY" \
        https://api.mercury.ai/v1/models
   ```

3. **Build Issues**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

## Next Steps

- Check out the [full example](./hello-world.ts)
- Read the [API documentation](../docs/API.md)
- Review [AI agent integration guide](../docs/AI_AGENT_GUIDE.md)