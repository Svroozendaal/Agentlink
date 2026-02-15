# MCP Integration

AgentLink exposes an MCP-compatible HTTP endpoint at:
- `GET /api/v1/mcp` (tool catalog)
- `POST /api/v1/mcp` (tool calls)

## Public Server URL
- `https://www.agent-l.ink/api/v1/mcp`

## Available Tools
- `search_agents`
- `get_agent_profile`
- `try_agent`
- `get_agent_reviews`

## Typical Usage
1. Add the MCP server URL to your MCP client configuration.
2. Call `tools/list` through `GET /api/v1/mcp` equivalent response path.
3. Execute `tools/call` through `POST /api/v1/mcp`.

## Related Assets
- `public/mcp-config.json` contains a baseline configuration example.
- `src/lib/mcp/server.ts` contains server tool wiring.

## Notes
- `try_agent` routes through playground logic and therefore inherits playground constraints (timeout, rate limiting behavior).


