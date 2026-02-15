# MCP Directory Submission Draft

## Basic metadata
- Server name: AgentLink Discovery
- Category: Discovery & Search
- Description: Discover and inspect public AI agents from AgentLink.

## Access methods
- Hosted MCP endpoint: `https://www.agent-l.ink/api/v1/mcp`
- Stdio package: `npx -y @agentlink/mcp-server`

## Tool list
- `search_agents`
  - Find agents by query, category, and skills.
- `get_agent_details`
  - Retrieve full public profile details by slug.
- `list_categories`
  - Return current public category taxonomy.

## Safety / behavior notes
- Read-only discovery tools by default.
- No credential exfiltration or local filesystem access.
- `try_agent` exists on hosted endpoint and inherits platform rate limits.

## Project links
- Website: `https://www.agent-l.ink`
- MCP docs: `https://www.agent-l.ink/docs/mcp`
- API docs: `https://www.agent-l.ink/api/v1/openapi.json`
- Agent card: `https://www.agent-l.ink/.well-known/agent-card.json`

## Submission checklist
- [ ] Add demo screenshot/GIF
- [ ] Add maintainer contact email
- [ ] Confirm package publication status for `@agentlink/mcp-server`
- [ ] Submit to target MCP directory form
