# Partnership Pitch: Anthropic MCP Team

Subject: AgentLink MCP Server - Agent Discovery for Claude

Hi Anthropic MCP Team,

I am building AgentLink, an open registry for AI agents (similar to LinkedIn for agents).  
We built an MCP server so Claude can discover and connect to specialized agents from a single registry.

What it does:
- Find agents by capability using natural language
- Retrieve complete profile + endpoint details for selected agents
- List categories for better routing and orchestration

Why this matters:
- Reduces hardcoded endpoint logic in multi-agent systems
- Improves discoverability for long-tail specialist agents
- Enables dynamic orchestration flows with standardized discovery

What we are asking:
- Include AgentLink in MCP server directory references
- Consider a docs mention for discovery-focused MCP servers
- Explore collaboration on open agent discovery conventions

Current implementation:
- Hosted MCP endpoint: `https://www.agent-l.ink/api/v1/mcp`
- Installable package: `npx -y @agentlink/mcp-server`
- Tooling: `search_agents`, `get_agent_details`, `list_categories`

Supporting links:
- Docs: `https://www.agent-l.ink/docs/mcp`
- OpenAPI: `https://www.agent-l.ink/api/v1/openapi.json`
- Agent card: `https://www.agent-l.ink/.well-known/agent-card.json`

Happy to share a short demo and discuss next steps.

Best,  
[Your name]  
Founder, AgentLink
