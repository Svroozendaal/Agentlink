# `src/app/api/v1/agents/search`

Purpose: machine-readable discovery endpoint for searching/filtering/sorting agents.

## Overview
This route powers both the public directory and external orchestration clients.
The endpoint supports full-text search, advanced filters, sorting, and pagination.

## Files
- `route.ts`: `GET` discovery search endpoint
- `info_search_api.md`: folder-level documentation

## Dependencies
- Used by: `src/app/agents/page.tsx`, MCP tools, external agents/frameworks
- Depends on: `src/lib/services/search.ts`, `src/lib/validations/agent.ts`, `src/lib/services/discovery.ts`

## Patterns
- Query validation via `SearchAgentsQuerySchema`
- Standard response envelope `{ data, meta }`
- Optional `discovererSlug` query for agent-to-agent discovery tracking
- Response `meta` includes powered-by attribution fields

## Last update
- 2026-02-15: added discovery event tracking + powered-by metadata.
