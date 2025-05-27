# MCP Registry Submission Guide

## Overview

Currently, there are multiple MCP registries and directories. This guide walks through submitting your Mercury MCP Server to all major ones.

## 1. Official MCP Server List (Primary)

**URL**: https://github.com/modelcontextprotocol/servers

**Process**:
1. Fork the repository
2. Add your server to the appropriate section in README.md
3. Create a Pull Request

**Entry Format**:
```markdown
### Mercury MCP Server
Model Context Protocol server for Mercury diffusion-LLM - 10x faster code generation
- GitHub: https://github.com/hamzaamjad/mercury-mcp-server
- NPM: https://www.npmjs.com/package/@hamjad-pathpoint/mercury-mcp-server
```

## 2. Cline MCP Marketplace

**URL**: https://github.com/cline/mcp-marketplace

**Process**:
1. Create a new issue in the repository
2. Use title: "Add Mercury MCP Server"
3. Include in the issue:

```markdown
**GitHub Repo URL**: https://github.com/hamzaamjad/mercury-mcp-server

**Logo Image**: [Attach a 400x400 PNG logo]

**Reason for Addition**: 
Mercury MCP Server brings 10x faster code generation to Cline users through diffusion-based LLM technology. It offers:
- Blazing fast code completion
- Superior Fill-in-the-Middle (FIM) capabilities with bidirectional context
- Streaming responses for real-time feedback
- Optimized for code generation tasks

Tested with Cline using README.md - successfully auto-installs and configures.
```

## 3. Community Registries

### mcp.so
- **URL**: https://mcp.so
- **Process**: Submit via their submission form or GitHub
- **Note**: Appears to be the largest community directory

### Smithery AI
- **URL**: https://smithery.ai
- **API**: https://smithery.ai/docs/registry
- **Process**: Contact them for inclusion or use their API

### MCP Registry Online
- **URL**: https://www.mcpregistry.online/
- **Process**: Submit through their website

### mcpserver.cloud
- **URL**: https://mcpserver.cloud/
- **Process**: Community maintained, check for submission process

## 4. NPM Registry (Already Done ✓)

Once published to npm, your server is automatically discoverable:
- https://www.npmjs.com/package/@hamjad-pathpoint/mercury-mcp-server

## 5. Future Official Registry

According to the GitHub discussion (#159), an official registry is planned with:
- Global public API
- Security scanning
- Unified runtime support
- Official browser

Keep an eye on: https://github.com/orgs/modelcontextprotocol/discussions/159

## Submission Template

Use this template when submitting to registries:

```markdown
# Mercury MCP Server

**Description**: Model Context Protocol server for Mercury diffusion-LLM, providing 10x faster code generation capabilities to MCP-compatible AI assistants.

**Key Features**:
- 🚀 10x faster code generation than traditional LLMs
- 🔄 Full Mercury API integration (chat, FIM, streaming)
- 🛡️ Enterprise-ready with security and error handling
- 📊 Intelligent caching and performance optimization
- 🤖 AI-agent friendly documentation

**Installation**:
```bash
npm install @hamjad-pathpoint/mercury-mcp-server
```

**Configuration** (Claude Desktop):
```json
{
  "mcpServers": {
    "mercury": {
      "command": "node",
      "args": ["node_modules/@hamjad-pathpoint/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Links**:
- GitHub: https://github.com/hamzaamjad/mercury-mcp-server
- NPM: https://www.npmjs.com/package/@hamjad-pathpoint/mercury-mcp-server
- Documentation: https://github.com/hamzaamjad/mercury-mcp-server#readme

**Categories**: AI, Code Generation, Development Tools, LLM, Diffusion Models

**Tags**: #mcp #mercury #diffusion-llm #code-generation #ai #typescript
```

## Priority Order

1. **Cline MCP Marketplace** - Largest user base
2. **Official MCP Servers List** - Primary reference
3. **mcp.so** - Popular community directory
4. **Others** - Additional visibility

## Timeline

- Week 1: Submit to Cline and official list
- Week 2: Submit to community registries
- Ongoing: Monitor for official registry launch