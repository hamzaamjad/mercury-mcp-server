# Quick Start Checklist - Mercury MCP Server Launch

## 🚀 Immediate Actions (Do Now)

### 1. NPM Publication (15 minutes)
```bash
# Terminal 1: Login
npm login
# Username: [your username]
# Password: [your password]
# Email: [your email]

# Terminal 2: Publish
cd /Users/hamzaamjad/.digital_twin/mercury-mcp-server
./scripts/publish.sh
# Type 'y' to confirm
```

✅ Success = Package live at https://www.npmjs.com/package/@hamzaamjad/mercury-mcp-server

### 2. Test Claude Desktop (30 minutes)
```bash
# Edit Claude config
open ~/Library/Application\ Support/Claude/
# Edit claude_desktop_config.json

# Add Mercury server config (see CLAUDE_DESKTOP_CONFIG.md)
# Replace YOUR_MERCURY_API_KEY_HERE with actual key

# Restart Claude Desktop (Cmd+Q then reopen)
```

✅ Success = Mercury appears in Claude's capabilities

### 3. Create GitHub Repo (15 minutes)
1. Go to: https://github.com/new
2. Name: `mercury-mcp-server`
3. Description: "Model Context Protocol server for Mercury diffusion-LLM - 10x faster code generation"
4. Public, no template
5. Create, then:

```bash
cd /Users/hamzaamjad/.digital_twin/mercury-mcp-server
git remote add origin https://github.com/hamzaamjad/mercury-mcp-server.git
git push -u origin main
```

✅ Success = Code visible on GitHub

### 4. Submit to Cline (10 minutes)
1. Go to: https://github.com/cline/mcp-marketplace/issues/new
2. Use template from MCP_REGISTRY_SUBMISSION.md
3. Attach: `/assets/mercury-logo.png`
4. Submit issue

✅ Success = Issue created and acknowledged

## 📊 Quick Verification

Run these commands to verify everything is working:

```bash
# Check npm package
npm view @hamzaamjad/mercury-mcp-server

# Check GitHub
open https://github.com/hamzaamjad/mercury-mcp-server

# Check Claude Desktop logs
tail -f ~/Library/Logs/Claude/*.log
```

## ⏰ Time Estimate
- Total time: ~1 hour
- Hands-on time: ~30 minutes
- Waiting time: ~30 minutes

## 🎯 By End of Today
- [ ] Package on npm
- [ ] Working in Claude Desktop
- [ ] GitHub repo live
- [ ] Submitted to Cline

---
**Next**: Follow WEEK1_ACTION_PLAN.md for remaining tasks