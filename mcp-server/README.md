# About Time MCP Server

An MCP (Model Context Protocol) server for managing the about-time template library. This allows AI agents to read, create, and search templates while maintaining consistent variable naming.

## Tools

| Tool | Description |
|------|-------------|
| `get_vocabulary` | Get all unique variable names used across templates. Call this first to ensure consistent naming. |
| `get_templates` | List all templates, optionally filtered by type (`busy` or `lane`). |
| `get_template` | Get a specific template by ID. |
| `search_templates` | Search templates by intent (case-insensitive). |
| `create_busy_template` | Create an atomic activity with resource consumption/production. |
| `create_lane_template` | Create a workflow container that sequences other templates. |

## Usage

### Build

```bash
cd mcp-server
npm install
npm run build
```

### Run

The server uses stdio transport:

```bash
node mcp-server/build/index.js
```

### VS Code Integration

The server is pre-configured in `.vscode/mcp.json`. Once VS Code supports MCP, it will automatically connect.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "about-time": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/dev/about-time/mcp-server/build/index.js"]
    }
  }
}
```

## Template Types

### Busy Template
An atomic activity that consumes and produces resources:
- `estimatedDuration`: Time in milliseconds
- `willConsume`: Variables consumed (e.g., `{ "egg": 1, "clean_bowl": 1 }`)
- `willProduce`: Variables produced (e.g., `{ "egg_in_bowl": 1 }`)

### Lane Template
A container that sequences other templates:
- `segments`: Array of `{ templateId, offset }` pairs
- `offset`: Start time in milliseconds relative to lane start

## Agent Workflow

When converting a recipe/plan into templates:

1. **Get vocabulary first**: Call `get_vocabulary` to see existing variable names
2. **Check for reusable templates**: Call `search_templates` to find existing atomic actions
3. **Create busy templates**: For each atomic step, create a busy template reusing existing variable names
4. **Create lane templates**: Compose atomic templates into workflows
