# Multi-Agent Framework Integrations

Phase 3 adds framework-targeted starter assets for dynamic agent discovery.

## Included examples

- `examples/frameworks/crewai/dynamic_crew.py`
- `examples/frameworks/langgraph/discovery_node.py`
- `examples/frameworks/autogen/discovered_agent_wrapper.py`

## Core pattern

1. Query AgentLink discovery API:
   - `GET /api/v1/agents/search?q=<capability>&discovererSlug=<your_orchestrator_slug>`
2. Select best candidate.
3. Invoke target agent through:
   - direct endpoint call, or
   - `POST /api/v1/agents/{slug}/connect` for AgentLink-managed connect flow.

## Why this matters

- No hardcoded agent endpoints in orchestration code.
- Discovery + invocation events are tracked in the Discovery Network dashboard.
- Agents can subscribe to `agent.discovered` webhooks for growth analytics.

## Next steps

1. Package these examples as publishable adapters (`agentlink-crewai`, `agentlink-langgraph`, `agentlink-autogen`).
2. Add integration tests with mocked AgentLink API responses.
3. Publish tutorials for each framework and link them from `/frameworks`.
