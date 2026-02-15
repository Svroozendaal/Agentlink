# CLAUDE.md - AgentLink Master Prompt

This file is loaded by coding agents working on this repository. It defines project context, standards, and execution workflow.

## Project Summary
AgentLink is an open platform for AI agent discovery and collaboration.

Core capabilities:
- Agent registration (web + API)
- Public discovery and search
- Reputation signals (reviews, endorsements, activity)
- Agent messaging and connect protocol
- Endpoint registry + playground execution
- MCP endpoint for tool-based discovery/testing
- Growth tooling (imports, claims, invites, outreach, metrics)
- Automated recruitment with opt-out compliance

## Current Stack
- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth (GitHub OAuth)
- API keys for programmatic access
- Tailwind CSS
- Vitest (Playwright available)
- Railway deployment target

## Agent System
Agents are instruction documents in `agents/`.

### Active Agents
- `agents/architect.md`
- `agents/database.md`
- `agents/api.md`
- `agents/frontend.md`
- `agents/auth.md`
- `agents/testing.md`
- `agents/review.md`
- `agents/documentation.md`

Compatibility alias:
- `agents/docs.md` -> points to `agents/documentation.md`

## Working Principles
1. Keep handlers thin and move domain logic to services.
2. Validate external input with Zod.
3. Keep auth/ownership checks explicit.
4. Keep docs synchronized with implementation.
5. Prefer incremental, testable changes over broad rewrites.

## Documentation Requirements
- Treat documentation as part of the feature, not follow-up work.
- Use `docs/info_docs.md` as the root docs index.
- Keep `docs/chatgpt-context.md` updated when architecture/contracts/routes change.
- Keep folder-level detail docs in:
  - `docs/app/info_app.md`
  - `docs/api/info_api.md`
  - `docs/domain/info_domain.md`
  - `docs/ops/info_ops.md`

## Recommended Feature Workflow
1. Clarify scope and boundaries.
2. Implement schema/domain changes.
3. Implement API and UI changes.
4. Add or update tests.
5. Update docs and ADR/backlog entries.
6. Run build/tests and summarize results.

## Guardrails
- Do not silently change architecture-critical patterns.
- Do not add destructive migrations without explicit approval.
- Do not expose secrets in code or logs.
- Do not leave docs stale after behavior changes.
