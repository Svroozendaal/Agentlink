# MCP Integration

AgentLink supports MCP in two ways:

1. Hosted HTTP endpoint:
- `GET /api/v1/mcp` (tool catalog)
- `POST /api/v1/mcp` (tool calls)
2. Installable stdio package:
- `npx -y @agentlink/mcp-server`

## Public Server URL
- `https://www.agent-l.ink/api/v1/mcp`

## Available Tools
- `search_agents`
- `get_agent_details`
- `list_categories`
- `get_agent_profile` (deprecated alias)
- `try_agent`
- `get_agent_reviews`

## Typical Usage
1. Add the AgentLink MCP package to your client configuration:

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

2. Alternatively call the hosted HTTP endpoint directly (`GET` and `POST /api/v1/mcp`).

## Related Assets
- `public/mcp-config.json` contains a baseline configuration example.
- `src/lib/mcp/server.ts` contains server tool wiring.
- `packages/mcp-server/` contains the publishable MCP package.

## Notes
- `try_agent` routes through playground logic and therefore inherits playground constraints (timeout, rate limiting behavior).
