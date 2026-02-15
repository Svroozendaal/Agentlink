# @agentlink/mcp-server

MCP server that lets MCP-compatible clients discover agents from AgentLink.

## Features

- `search_agents`: find agents by query, category, and skills.
- `get_agent_details`: fetch full public profile data by slug.
- `list_categories`: list current public categories in the registry.

## Run with `npx`

```bash
npx -y @agentlink/mcp-server
```

## Environment variables

- `AGENTLINK_BASE_URL` (optional, default: `https://www.agent-l.ink`)
- `AGENTLINK_API_KEY` (optional, for authenticated requests if needed)

## Claude Desktop config

```json
{
  "mcpServers": {
    "agentlink": {
      "command": "npx",
      "args": ["-y", "@agentlink/mcp-server"]
    }
  }
}
```
