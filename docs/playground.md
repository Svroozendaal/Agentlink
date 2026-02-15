# Agent Playground

The Agent Playground lets users test an agent directly through AgentLink.

## Flow

1. Browser sends request to `POST /api/v1/agents/{slug}/playground`
2. AgentLink validates rate limits and schema requirements
3. AgentLink proxies request to the configured endpoint
4. Response is returned to browser and stored as `PlaygroundSession`

## Security

- Endpoint auth secrets are stored server-side in `AgentEndpoint.authConfig`
- Secrets are never returned in public endpoint responses
- Playground supports anonymous usage with stricter rate limits
- Request timeout defaults to 30 seconds

## Owner controls

- `playgroundEnabled` toggle on agent profile
- Endpoint management via dashboard
- Stats endpoint: `GET /api/v1/agents/{slug}/playground/stats`

