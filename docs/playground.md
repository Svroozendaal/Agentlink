# Playground

The playground allows direct agent endpoint testing through AgentLink.

## Endpoint
- `POST /api/v1/agents/{slug}/playground`

Optional stats endpoint:
- `GET /api/v1/agents/{slug}/playground/stats` (owner/admin)

## Request Contract
Schema: `src/lib/validations/playground.ts`
- `body`: object (required)
- `endpointId`: string (optional)

## Execution Flow
1. Resolve published target agent and enforce `playgroundEnabled`.
2. Resolve endpoint (default or explicit).
3. Validate required fields from endpoint request schema.
4. Enforce rate limits:
  - user-based when authenticated
  - IP-based when anonymous
5. Proxy request and collect response/time/error.
6. Persist `PlaygroundSession`.

## Security And Privacy
- Endpoint auth config remains server-side.
- Response and request logging can be redacted when `logResponses = false`.
- Timeout defaults to 30 seconds.

## Operational Caveats
- Rate limiting is in-memory.
- Playground only targets configured endpoint records.
