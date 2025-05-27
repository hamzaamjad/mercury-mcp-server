# Mercury MCP Server Design Document

## Architecture Overview

The Mercury MCP Server acts as a bridge between AI assistants (like Claude) and the Mercury diffusion-LLM API. It exposes Mercury's capabilities through standardized MCP tools, enabling seamless integration into agentic workflows.

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│  Mercury MCP     │────▶│  Mercury API    │
│ (Claude, etc.)  │◀────│     Server       │◀────│   (Inception)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │ JSON-RPC 2.0         │ Tool Execution         │ REST API
         │ over stdio/HTTP      │ Error Handling         │ Streaming
         │                      │ Retry Logic            │
```

## Directory Structure

```
mercury-mcp-server/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── server.ts               # MCP server setup
│   ├── tools/
│   │   ├── index.ts           # Tool registry
│   │   ├── chat.ts            # Chat completion tool
│   │   ├── streaming.ts       # Streaming chat tool
│   │   ├── fim.ts             # Fill-in-the-middle tool
│   │   └── models.ts          # Model listing tool
│   ├── mercury/
│   │   ├── client.ts          # Mercury API client wrapper
│   │   ├── types.ts           # TypeScript types
│   │   └── errors.ts          # Error handling
│   ├── utils/
│   │   ├── validation.ts      # Zod schemas
│   │   ├── logger.ts          # Winston logger setup
│   │   └── cache.ts           # Caching implementation
│   └── config/
│       └── index.ts           # Configuration management
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── TROUBLESHOOTING.md
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Tool Definitions

### 1. Chat Completion Tool

**Name**: `mercury_chat_completion`  
**Description**: Generate chat completions using Mercury's diffusion-LLM

**Input Schema**:
```typescript
{
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  model: z.string().default('mercury-coder-small'),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  user: z.string().optional()
}
```

**Response Format**:
```typescript
{
  content: [{
    type: "text",
    text: string  // The generated completion
  }],
  metadata: {
    model: string,
    usage: {
      prompt_tokens: number,
      completion_tokens: number,
      total_tokens: number
    },
    finish_reason: string
  }
}
```

### 2. Streaming Chat Tool

**Name**: `mercury_chat_stream`  
**Description**: Stream chat completions for real-time responses

**Input Schema**: Same as chat completion

**Response Format**: Progressive updates via MCP streaming protocol

### 3. Fill-in-the-Middle (FIM) Tool

**Name**: `mercury_fim_completion`  
**Description**: Generate code completions using fill-in-the-middle

**Input Schema**:
```typescript
{
  prompt: z.string().describe("Code before the cursor"),
  suffix: z.string().describe("Code after the cursor"),
  model: z.string().default('mercury-coder-small'),
  max_tokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stop: z.array(z.string()).optional()
}
```

### 4. List Models Tool

**Name**: `mercury_list_models`  
**Description**: List available Mercury models

**Input Schema**: None (empty object)

**Response Format**:
```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      models: [
        {
          id: string,
          owned_by: string,
          created: number,
          capabilities: string[]
        }
      ]
    })
  }]
}
```

## Request/Response Mapping

### MCP Request → Mercury API Call

1. **Receive MCP Request**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "mercury_chat_completion",
       "arguments": {...}
     },
     "id": 1
   }
   ```

2. **Validate & Transform**
   - Validate with Zod schema
   - Map to Mercury API format
   - Add authentication headers

3. **Execute API Call**
   - Use Mercury Client SDK
   - Handle retries with exponential backoff
   - Manage streaming if applicable

4. **Transform Response**
   - Map Mercury response to MCP format
   - Include metadata
   - Handle errors appropriately

## Error Handling Strategy

### Error Categories

1. **Validation Errors** (400)
   - Invalid input parameters
   - Missing required fields
   - Type mismatches

2. **Authentication Errors** (401)
   - Missing API key
   - Invalid API key
   - Expired credentials

3. **Rate Limit Errors** (429)
   - Too many requests
   - Quota exceeded
   - Retry with backoff

4. **Server Errors** (500+)
   - Mercury API errors
   - Network failures
   - Timeout errors

### Error Response Format

```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      error: {
        type: "validation_error" | "api_error" | "rate_limit" | "auth_error",
        message: "User-friendly error message",
        code: "ERROR_CODE",
        retry_after?: number  // For rate limits
      }
    })
  }],
  isError: true
}
```

### Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: [429, 502, 503, 504]
};
```

## Configuration Design

### Environment Variables

```bash
# Required
MERCURY_API_KEY=sk_...
MERCURY_API_URL=https://api.inceptionlabs.ai/v1

# Optional
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
LOG_LEVEL=info
CACHE_TTL=300
MAX_REQUEST_SIZE=1mb
REQUEST_TIMEOUT=30000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

### Configuration Schema

```typescript
interface Config {
  mercury: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    retryConfig: RetryConfig;
  };
  server: {
    port: number;
    host: string;
    transport: 'stdio' | 'http';
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  security: {
    rateLimiting: {
      enabled: boolean;
      max: number;
      windowMs: number;
    };
    maxRequestSize: string;
  };
}
```

## Security Considerations

### 1. API Key Management
- Store in environment variables only
- Never log or expose in responses
- Validate on server startup
- Support key rotation

### 2. Input Validation
- Comprehensive Zod schemas
- Sanitize all inputs
- Prevent injection attacks
- Validate file paths

### 3. Rate Limiting
- Per-client rate limits
- Global server limits
- Graceful degradation
- Clear error messages

### 4. Logging Security
- Never log sensitive data
- Mask API keys in logs
- Structured logging
- Audit trail support

## Performance Optimizations

### 1. Caching Strategy
- Cache model listings (TTL: 1 hour)
- Cache frequent completions (configurable)
- Memory-based cache with size limits
- Cache key based on request hash

### 2. Connection Management
- Reuse HTTP connections
- Connection pooling
- Graceful shutdown
- Health checks

### 3. Streaming Optimization
- Chunk size optimization
- Backpressure handling
- Memory management
- Progress tracking

## Testing Strategy

### 1. Unit Tests
- Tool validation logic
- Error handling
- Retry mechanism
- Cache operations

### 2. Integration Tests
- Mock Mercury API
- Test all tool types
- Error scenarios
- Streaming functionality

### 3. End-to-End Tests
- Real Mercury API (dev environment)
- MCP Inspector validation
- Client compatibility tests
- Load testing

### 4. Performance Tests
- Response time benchmarks
- Memory usage profiling
- Concurrent request handling
- Streaming performance

## Deployment Considerations

### 1. Package Structure
- Standalone npm package
- Docker container option
- Binary distribution
- Source distribution

### 2. Documentation
- README with quick start
- API documentation
- Configuration guide
- Troubleshooting guide
- Example usage

### 3. Monitoring
- Health endpoint
- Metrics collection
- Error tracking
- Performance monitoring

## Future Enhancements

1. **Additional Tools**
   - Embeddings generation
   - Function calling support
   - Batch processing
   - Model fine-tuning status

2. **Advanced Features**
   - WebSocket transport
   - Multi-tenant support
   - Custom model routing
   - Response caching

3. **Integration Improvements**
   - Plugin system
   - Webhook support
   - Event streaming
   - Metrics export