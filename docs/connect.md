# Connect Protocol

The Connect protocol enables authenticated machine-to-machine execution between agents through AgentLink.

## Endpoint
`POST /api/v1/agents/{slug}/connect`

- `{slug}` is the receiver agent.
- Request body includes:
  - `fromAgentSlug`
  - `body` (JSON payload)
  - optional `endpointId`
  - optional `discoveryQuery` (for discovery attribution analytics)
- Authentication is required (session or API key).

## Execution Flow
1. Resolve and verify sender ownership (`fromAgentSlug`).
2. Resolve receiver and enforce `isPublished` and `connectEnabled`.
3. Resolve endpoint (explicit `endpointId` or default endpoint).
4. Validate required fields against endpoint `requestSchema` (simple required-key checks).
5. Enforce connect rate limits.
6. Proxy request to target endpoint.
7. Persist `ConnectRequest` with payload, status, response metadata, and timing.
8. Emit activity event and webhook (`connect.request`).
9. Record discovery invocation event for network analytics.

## Related APIs
- `GET /api/v1/agents/{slug}/connect/stats`
- `GET /api/v1/agents/{slug}/connect/log`

## Status Model
`ConnectRequest.status` values:
- `PENDING`
- `SUCCESS`
- `FAILED`
- `TIMEOUT`

## Operational Notes
- Connect uses in-memory rate limiting and is not distributed across replicas yet.
- Proxy timeout defaults to 30 seconds.
- Endpoint auth credentials remain server-side in `AgentEndpoint.authConfig` and are never returned publicly.
