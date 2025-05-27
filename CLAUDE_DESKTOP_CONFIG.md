# Claude Desktop Configuration for Mercury MCP Server

## Configuration File Location

On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Step 1: Open Configuration

```bash
open ~/Library/Application\ Support/Claude/
```

## Step 2: Edit claude_desktop_config.json

Add the Mercury server to your configuration:

```json
{
  "mcpServers": {
    "mercury": {
      "command": "node",
      "args": ["/Users/hamzaamjad/.digital_twin/mercury-mcp-server/dist/index.js"],
      "env": {
        "MERCURY_API_KEY": "YOUR_MERCURY_API_KEY_HERE"
      }
    }
  }
}
```

⚠️ Replace `YOUR_MERCURY_API_KEY_HERE` with your actual Mercury API key!

## Step 3: Restart Claude Desktop

1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. The Mercury server should connect automatically

## Step 4: Test Mercury Features

Try these prompts in Claude:

1. **Basic Code Generation**: 
   "Using Mercury, write a Python function to calculate fibonacci numbers"

2. **FIM Completion**:
   "Using Mercury FIM, complete this function:
   ```python
   def binary_search(arr, target):
       left, right = 0, len(arr) - 1
       while left <= right:
           mid = 
   ```"

3. **Speed Comparison**:
   "Generate a complete REST API with Mercury (compare the speed with regular generation)"

## Verification

Check the Mercury MCP Server logs:
```bash
tail -f ~/.mercury-mcp-server.log
```

## Troubleshooting

If Mercury doesn't appear:
1. Check Claude Desktop logs: `~/Library/Logs/Claude/`
2. Verify server starts: `cd /Users/hamzaamjad/.digital_twin/mercury-mcp-server && npm start`
3. Ensure API key is set correctly