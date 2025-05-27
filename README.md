# Mercury MCP Server

[![npm version](https://badge.fury.io/js/@hamzaamjad%2Fmercury-mcp-server.svg)](https://www.npmjs.com/package/@hamzaamjad/mercury-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Mercury Powered](https://img.shields.io/badge/Mercury-10x%20Faster-orange)](https://inceptionlabs.ai)

A production-ready Model Context Protocol (MCP) server that integrates Mercury diffusion-LLM capabilities into AI assistants like Claude, Cursor, and other MCP-compatible clients.

## ✅ Verified and Tested

This implementation has been tested against the actual Mercury API and all features are confirmed working:
- ✅ Chat completions with mercury-coder-small and mercury-coder-large
- ✅ Fill-in-the-Middle (FIM) completions
- ✅ Streaming responses
- ✅ Model listing
- ✅ Proper error handling and retry logic
- ✅ API structure compatibility verified

## Features

- 🚀 **Full Mercury API Integration**: Chat completions, streaming, and Fill-in-the-Middle (FIM)
- 🔄 **Diffusion Model Support**: Specialized handling for Mercury's diffusion-based architecture
- 🛡️ **Enterprise Security**: API key management, rate limiting, and input validation
- 📊 **Performance Optimized**: Intelligent caching, retry logic, and connection pooling
- 🔍 **Comprehensive Logging**: Structured logging with Winston
- ✅ **Type Safety**: Full TypeScript implementation with Zod validation

## Quick Start

### Prerequisites

- Node.js 18+ 
- Mercury API key from [Inception Labs](https://inceptionlabs.ai)
- An MCP-compatible client (Claude Desktop, Cursor, etc.)

### Installation

```bash
# Clone the repository (or download the source)
cd mercury-mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# Set your API key
export MERCURY_API_KEY="your-api-key-here"

# Test the server is working
npm start
```

### Build and Run

```bash
# Build the TypeScript code
npm run build

# Run the server
npm start
```

## Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Required
MERCURY_API_KEY=sk_your_api_key_here
MERCURY_API_URL=https://api.inceptionlabs.ai/v1

# Optional (with defaults)
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=300
DIFFUSION_DEFAULT_STEPS=20
DIFFUSION_STABILITY_THRESHOLD=0.85
```

### Claude Desktop Integration

Add the following to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mercury": {
      "command": "node",
      "args": ["/path/to/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "sk_your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### 1. `mercury_chat_completion`

Generate chat completions using Mercury's diffusion-LLM.

**Parameters:**
- `messages`: Array of conversation messages
- `model`: Model to use (default: mercury-coder-small)
- `temperature`: Sampling temperature (0-2)
- `max_tokens`: Maximum tokens to generate
- `diffusion_steps`: Number of diffusion steps

### 2. `mercury_chat_stream`

Stream chat completions for real-time responses.

**Parameters:** Same as chat completion

### 3. `mercury_fim_completion`

Generate code completions using Fill-in-the-Middle.

**Parameters:**
- `prompt`: Code before the cursor
- `suffix`: Code after the cursor
- `max_middle_tokens`: Maximum tokens for the middle section
- `alternative_completions`: Number of alternatives (1-5)

### 4. `mercury_list_models`

List all available Mercury models with their capabilities.

**Parameters:** None

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test -- --coverage
```

### Using MCP Inspector

Test your server with the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Development Mode

```bash
# Run with auto-reload
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

## Architecture

```
mercury-mcp-server/
├── src/
│   ├── mercury/          # Mercury API client
│   ├── tools/           # MCP tool implementations
│   ├── utils/           # Utilities (logging, cache, validation)
│   ├── config/          # Configuration management
│   ├── server.ts        # MCP server setup
│   └── index.ts         # Entry point
├── tests/               # Test suites
└── docs/               # Additional documentation
```

## Error Handling

The server implements comprehensive error handling for:

- **Validation Errors**: Invalid input parameters
- **API Errors**: Mercury API failures
- **Diffusion Errors**: Model convergence issues
- **Rate Limiting**: Automatic retry with backoff

## Security

- API keys are never logged or exposed
- All inputs are validated with Zod schemas
- Rate limiting prevents abuse
- Supports secure environment variable management

## Troubleshooting

### Common Issues

1. **"MERCURY_API_KEY is required"**
   - Ensure your `.env` file contains a valid API key
   - Check that the environment variable is loaded

2. **"Failed to connect to Mercury API"**
   - Verify your internet connection
   - Check if the API URL is correct
   - Ensure your API key is valid

3. **"Low confidence score detected"**
   - Increase `diffusion_steps` for better quality
   - Adjust temperature for more deterministic outputs

## Documentation for AI Agents

This server includes special documentation to help AI models understand Mercury's capabilities:

- [AI Agent Guide](docs/AI_AGENT_GUIDE.md) - Comprehensive guide for AI models
- [Quick Reference](docs/QUICK_REFERENCE_FOR_AI.md) - Decision trees and cheat sheets
- Enhanced tool descriptions with context about diffusion models

These resources help AI agents make intelligent decisions about when and how to use Mercury's unique features.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- [Inception Labs](https://inceptionlabs.ai) for Mercury API
- [Anthropic](https://anthropic.com) for Model Context Protocol
- The MCP community for tools and inspiration