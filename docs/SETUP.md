# Mercury MCP Server Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **Operating System**: macOS, Linux, or Windows
- **Memory**: At least 512MB available RAM

### API Access
- Mercury API key from [Inception Labs](https://inceptionlabs.ai)
- Valid API subscription with sufficient quota

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hamzaamjad/mercury-mcp-server.git
cd mercury-mcp-server
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Runtime validation
- `winston` - Logging
- `dotenv` - Environment configuration
- `node-cache` - Caching layer
- `p-retry` - Retry logic

### 3. Configure Environment

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
MERCURY_API_KEY=sk_your_actual_api_key_here

# Optional - Defaults shown
MERCURY_API_URL=https://api.inceptionlabs.ai/v1
LOG_LEVEL=info
CACHE_TTL=300
DIFFUSION_DEFAULT_STEPS=20
```

### 4. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 5. Test the Installation

Run the MCP Inspector to verify setup:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

You should see:
- Server connection established
- Tools listed: `mercury_chat_completion`, `mercury_fim_completion`, etc.
- No error messages in the console

## Client Integration

### Claude Desktop

1. Locate your Claude Desktop configuration:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the Mercury server configuration:

```json
{
  "mcpServers": {
    "mercury": {
      "command": "node",
      "args": ["/absolute/path/to/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "sk_your_api_key_here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. Restart Claude Desktop

4. Look for the MCP icon in Claude's interface to verify connection

### Cursor

1. Open Cursor settings
2. Navigate to "MCP Servers"
3. Add new server with:
   - **Name**: Mercury
   - **Command**: `node /path/to/mercury-mcp-server/dist/index.js`
   - **Environment**: Add your MERCURY_API_KEY

### VS Code with Continue

1. Install the Continue extension
2. Open Continue settings
3. Add MCP server configuration:

```json
{
  "mcpServers": [
    {
      "name": "mercury",
      "command": "node",
      "args": ["/path/to/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "your_key"
      }
    }
  ]
}
```

## Verification

### Basic Health Check

Run the server directly:

```bash
MERCURY_API_KEY=your_key node dist/index.js
```

You should see:
```
2024-01-27 10:00:00 [info]: Starting Mercury MCP Server...
2024-01-27 10:00:00 [info]: Mercury MCP Server initialized
Mercury MCP Server is ready for connections
```

### Test Tool Execution

Using MCP Inspector:

1. Connect to the server
2. Navigate to "Tools" tab
3. Select `mercury_list_models`
4. Click "Execute"
5. Verify you receive a list of available models

## Advanced Configuration

### Custom Model Defaults

Set default model parameters:

```env
# Custom diffusion parameters
DIFFUSION_DEFAULT_STEPS=30
DIFFUSION_MAX_STEPS=50
DIFFUSION_STABILITY_THRESHOLD=0.9
DIFFUSION_DEFAULT_TEMPERATURE=0.5
```

### Performance Tuning

```env
# Caching
CACHE_ENABLED=true
CACHE_TTL=600
CACHE_MAX_SIZE=200

# Timeouts
REQUEST_TIMEOUT=60000
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_DELAY=2000
```

### Security Hardening

```env
# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW_MS=60000

# Request size limits
MAX_REQUEST_SIZE=2mb
```

## Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t mercury-mcp-server .
docker run -e MERCURY_API_KEY=your_key mercury-mcp-server
```

## Next Steps

1. Review the [API Documentation](API.md) for detailed tool usage
2. Check [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
3. Explore example integrations in the `examples/` directory