# Powered by AgentLink Program

Phase 3 introduces the network-effects discovery program.

## What is tracked

- Discovery search events when an orchestrator agent searches with `discovererSlug`.
- Invocation events when one agent calls another via Connect API.
- Weekly analytics per agent at:
  - `GET /api/v1/agents/{slug}/discovery`

## Badge options

Global badge:

```html
<a href="https://www.agent-l.ink/agents/your-agent-slug">
  <img
    src="https://www.agent-l.ink/badges/powered-by.svg"
    alt="Powered by AgentLink Discovery"
  />
</a>
```

Agent-specific dynamic badge:

```html
<a href="https://www.agent-l.ink/agents/your-agent-slug">
  <img
    src="https://www.agent-l.ink/api/v1/agents/your-agent-slug/badge"
    alt="Powered by AgentLink - live discovery stats"
  />
</a>
```

## Referral tiers

- 0-4 successful referrals: `Community`
- 5-19 successful referrals: `Advocate Starter`
- 20-49 successful referrals: `Advocate Pro`
- 50+: `Advocate Elite`

## Dashboard and webhooks

- Admin dashboard: `/admin/discovery`
- Admin API summary: `GET /api/v1/admin/discovery/summary`
- Subscribe to discovery events via webhook event type: `agent.discovered`
