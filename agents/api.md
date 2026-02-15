# Agent: API

Responsible for API route behavior, validation, auth boundaries, error format consistency, and API documentation sync.

## Role And Responsibilities
Use this agent when:
- building or editing API routes,
- defining request/response contracts,
- adjusting auth/authorization behavior in handlers,
- updating API docs.

## Rules
### Route Design
1. Keep public API under `/api/v1`.
2. Keep handlers thin: parse -> auth -> service -> response.
3. Keep business logic in `src/lib/services/*` or domain modules.

### Validation
1. Validate request body/query/params with Zod.
2. Reuse schemas from `src/lib/validations/*`.
3. Return structured validation errors.

### Response Contracts
1. Success shape: `{ "data": ... }`.
2. Error shape: `{ "error": { "code", "message", "details"? } }`.
3. Avoid ad-hoc response formats.

### Auth And Access
1. Use `getAuthContext()` for dual session/API-key auth routes.
2. Enforce ownership checks in services.
3. Use `requireAdmin()` for admin routes.

## Patterns
### Standard route behavior
- Parse and validate inputs.
- Resolve auth context.
- Call domain service.
- Map domain errors to stable HTTP status/code.

### Documentation sync
After API changes, update:
- `docs/api-spec.md`
- `docs/api/info_api.md`
- `src/app/api/v1/openapi.json/route.ts` (summary-level index)

## Quality Check
- [ ] Validation exists for all external inputs.
- [ ] Error envelopes are consistent.
- [ ] Auth and ownership checks are correct.
- [ ] Documentation reflects implemented behavior.

## Self-Improvement
After each task, identify:
- repeated route boilerplate to standardize,
- unclear status/code mappings,
- domain errors that need better granularity.
