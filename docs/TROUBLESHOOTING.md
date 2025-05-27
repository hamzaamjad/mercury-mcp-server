# Mercury MCP Server Troubleshooting Guide

## Common Issues and Solutions

### Authentication Errors

#### Error: "MERCURY_API_KEY is required"

**Symptoms:**
```
Configuration validation failed:
  - mercury.apiKey: MERCURY_API_KEY is required
```

**Solutions:**
1. Ensure `.env` file exists in the project root
2. Verify the API key is set correctly:
   ```bash
   echo $MERCURY_API_KEY
   ```
3. If using Claude Desktop, ensure the key is in the config:
   ```json
   "env": {
     "MERCURY_API_KEY": "sk_your_key_here"
   }
   ```

#### Error: "Authentication error: Invalid API key"

**Symptoms:**
- 401 errors in logs
- "Invalid API key" messages

**Solutions:**
1. Verify your API key is valid at [Inception Labs Dashboard](https://inceptionlabs.ai)
2. Check for extra spaces or characters in the key
3. Ensure the key starts with `sk_`

### Connection Issues

#### Error: "Failed to connect to Mercury API"

**Symptoms:**
```
Error: ECONNREFUSED
Error: getaddrinfo ENOTFOUND api.inceptionlabs.ai
```

**Solutions:**
1. Check internet connectivity
2. Verify firewall settings allow HTTPS connections
3. Test API directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
        https://api.inceptionlabs.ai/v1/models
   ```
4. Check proxy settings if behind corporate firewall

### Diffusion Model Errors

#### Error: "Low confidence score detected"

**Symptoms:**
- Warning logs about confidence scores
- Poor quality completions

**Solutions:**
1. Increase diffusion steps:
   ```env
   DIFFUSION_DEFAULT_STEPS=30
   DIFFUSION_MAX_STEPS=50
   ```
2. Adjust temperature for more deterministic outputs:
   ```json
   {
     "temperature": 0.3,
     "diffusion_steps": 40
   }
   ```

#### Error: "Diffusion model failed to converge"

**Symptoms:**
- Convergence errors
- Incomplete or garbled outputs

**Solutions:**
1. Simplify the prompt
2. Reduce max_tokens
3. Try a different noise schedule:
   ```json
   {
     "noise_schedule": "cosine"
   }
   ```

### FIM-Specific Issues

#### Error: "Invalid context boundaries"

**Symptoms:**
- FIM completion failures
- "Context mismatch" errors

**Solutions:**
1. Ensure prefix and suffix form valid code:
   ```json
   {
     "prompt": "def calculate(",
     "suffix": "):\n    return result"
   }
   ```
2. Provide more context in prefix/suffix
3. Check for syntax errors in surrounding code

### Performance Issues

#### Slow Response Times

**Symptoms:**
- High latency (>10s for simple requests)
- Timeout errors

**Solutions:**
1. Enable caching for repeated requests:
   ```env
   CACHE_ENABLED=true
   CACHE_TTL=600
   ```
2. Reduce token limits:
   ```json
   {
     "max_tokens": 500
   }
   ```
3. Use fewer diffusion steps for drafts

#### Memory Issues

**Symptoms:**
- "JavaScript heap out of memory"
- Server crashes after extended use

**Solutions:**
1. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=2048 dist/index.js
   ```
2. Reduce cache size:
   ```env
   CACHE_MAX_SIZE=50
   ```
3. Enable garbage collection logs:
   ```bash
   node --trace-gc dist/index.js
   ```

### MCP Client Integration Issues

#### Claude Desktop Not Showing Tools

**Symptoms:**
- MCP icon missing
- No Mercury tools available

**Solutions:**
1. Verify config file location is correct
2. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
3. Ensure absolute paths in config:
   ```json
   "args": ["/Users/username/mercury-mcp-server/dist/index.js"]
   ```
4. Restart Claude Desktop completely

#### Tool Execution Failures

**Symptoms:**
- "Tool not found" errors
- Tools listed but not working

**Solutions:**
1. Test with MCP Inspector first
2. Check server logs for errors
3. Verify tool names match exactly
4. Enable debug logging:
   ```env
   LOG_LEVEL=debug
   ```

## Debugging Techniques

### Enable Verbose Logging

Set environment variables:
```env
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### Use MCP Inspector

Test individual tools:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Monitor Server Logs

Watch logs in real-time:
```bash
MERCURY_API_KEY=your_key node dist/index.js 2>&1 | tee server.log
```

### Test API Directly

Verify Mercury API access:
```bash
curl -X POST https://api.inceptionlabs.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mercury-coder-small",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Getting Help

### Log Collection

When reporting issues, include:
1. Server logs with debug enabled
2. Environment configuration (without API key)
3. Error messages and stack traces
4. Steps to reproduce

### Support Channels

1. GitHub Issues: [mercury-mcp-server/issues](https://github.com/hamzaamjad/mercury-mcp-server/issues)
2. MCP Discord: [Model Context Protocol Community](https://discord.gg/mcp)
3. Inception Labs Support: support@inceptionlabs.ai

### Version Information

Include in bug reports:
```bash
node --version
npm --version
npm list @modelcontextprotocol/sdk
```