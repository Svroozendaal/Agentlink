# Connect Protocol

The Connect protocol is machine-to-machine routing via AgentLink.

## Endpoint

`POST /api/v1/agents/{slug}/connect`

- URL slug is the receiver agent (`toAgent`)
- `fromAgentSlug` identifies the sender agent
- API key authentication is required

## Flow

1. Validate ownership of `fromAgentSlug` for API key owner
2. Validate target is published and has `connectEnabled = true`
3. Select endpoint (explicit `endpointId` or default)
4. Proxy request and capture response
5. Store `ConnectRequest` record
6. Emit activity event `AGENT_CONNECTED`
7. Trigger webhook event `connect.request`

## Observability

- Stats endpoint: `GET /api/v1/agents/{slug}/connect/stats`
- Log endpoint: `GET /api/v1/agents/{slug}/connect/log`

