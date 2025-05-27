# GitHub Repository Setup Guide

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `mercury-mcp-server`
3. Description: "Model Context Protocol server for Mercury diffusion-LLM - 10x faster code generation"
4. Make it **Public**
5. **DON'T** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push to GitHub

After creating the empty repository, run these commands:

```bash
cd /Users/hamzaamjad/.digital_twin/mercury-mcp-server

# Add the remote repository
git remote add origin https://github.com/hamzaamjad/mercury-mcp-server.git

# Push to GitHub
git push -u origin main
```

## Step 3: Configure Repository Settings

On GitHub, go to Settings and:

1. **About section**: 
   - Add topics: `mcp`, `mercury`, `diffusion-llm`, `ai`, `code-generation`, `typescript`
   - Website: Link to npm package once published

2. **Create Release**:
   - Go to Releases → Create new release
   - Tag: `v0.1.0`
   - Title: "Mercury MCP Server v0.1.0"
   - Description: Include highlights from COMPLETION_REPORT.md

## Step 4: Add GitHub Actions (Optional for Week 1)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - run: npm test
```

## Step 5: Add Badges to README

Add these badges to the top of README.md:

```markdown
[![npm version](https://badge.fury.io/js/@hamjad-pathpoint%2Fmercury-mcp-server.svg)](https://www.npmjs.com/package/@hamjad-pathpoint/mercury-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
```