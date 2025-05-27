# NPM Publishing Guide for Mercury MCP Server

## Step 1: Login to npm

```bash
npm login
```

You'll be prompted for:
- Username: [your npm username]
- Password: [your npm password]
- Email: [your email]
- One-time password (if 2FA enabled)

## Step 2: Verify Package Details

Current package name: `@hamjad-pathpoint/mercury-mcp-server`
Current version: `0.1.0`

## Step 3: Publish

```bash
cd /Users/hamzaamjad/.digital_twin/mercury-mcp-server
./scripts/publish.sh
```

Or manually:
```bash
npm publish --access public
```

## After Publishing

Your package will be available at:
https://www.npmjs.com/package/@hamjad-pathpoint/mercury-mcp-server

Users can install with:
```bash
npm install @hamjad-pathpoint/mercury-mcp-server
```