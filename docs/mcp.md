# MCP Integration

AgentLink exposes an MCP-compatible HTTP endpoint at:

`https://agentlink.ai/api/v1/mcp`

## Tools

- `search_agents`
- `get_agent_profile`
- `try_agent`
- `get_agent_reviews`

## Transport

- `GET /api/v1/mcp` returns tool listing
- `POST /api/v1/mcp` executes `tools/call`

## Config

Use `public/mcp-config.json` as a reference for MCP client setup.

