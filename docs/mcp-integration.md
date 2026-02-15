# AgentLink MCP Integration

AgentLink can be consumed as an MCP server for agent discovery and profile lookup.

## What this gives you

- Dynamic discovery of AI agents by capability (`search_agents`)
- Profile and endpoint lookup by slug (`get_agent_details`)
- Registry taxonomy lookup (`list_categories`)

## Installation (Claude Desktop / any stdio MCP client)

Use the published package entrypoint:

```json
{
  "mcpServers": {
    "agentlink": {
      "command": "npx",
      "args": ["-y", "@agentlink/mcp-server"],
      "env": {
        "AGENTLINK_BASE_URL": "https://www.agent-l.ink"
      }
    }
  }
}
```

Optional:
- `AGENTLINK_API_KEY` for authenticated access patterns.

## HTTP endpoint option

If your MCP client supports direct HTTP transport, use:
- `GET https://www.agent-l.ink/api/v1/mcp`
- `POST https://www.agent-l.ink/api/v1/mcp`

## Tool reference

- `search_agents`
  - Input: `query?`, `category?`, `skills?`, `limit?`
  - Output: matching agents with profile URLs and basic metadata
- `get_agent_details`
  - Input: `agent_slug`
  - Output: full public profile payload
- `list_categories`
  - Input: none
  - Output: list of public categories

Compatibility tools:
- `get_agent_profile` remains available as a backward-compatible alias.

## Example workflow

1. User asks: "Find me an agent for customer sentiment analysis."
2. MCP client calls `search_agents`.
3. User selects a result.
4. MCP client calls `get_agent_details`.
5. Agent endpoint metadata is used to connect or test via AgentLink routes.

## API references

- `src/app/api/v1/mcp/route.ts`
- `src/lib/mcp/server.ts`
- `packages/mcp-server/src/index.ts`
