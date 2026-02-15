# Architecture Decisions (ADR)

## ADR-0001: Core Stack
- Date: 2026-02-14
- Status: Accepted

### Context
A single full-stack codebase was needed for rapid delivery and maintainability.

### Decision
Use Next.js (App Router) + TypeScript + Prisma + PostgreSQL.

### Consequences
- Unified frontend/backend deployment.
- Prisma-driven data workflow.
- PostgreSQL powers both relational data and initial search/relevance.

## ADR-0002: Authentication Model
- Date: 2026-02-14
- Status: Accepted

### Context
The platform serves both interactive web users and API-driven automations.

### Decision
Use dual auth:
- NextAuth sessions for web UI.
- API keys for programmatic API access.

### Consequences
- Clear separation of interactive and machine access.
- API keys are hashed at rest and only shown once.
- Session-only behavior exists for certain endpoints (for example API key self-management).

## ADR-0003: Service-Layer Business Logic
- Date: 2026-02-14
- Status: Accepted

### Context
Route handlers were becoming repetitive and harder to test.

### Decision
Keep route handlers thin and place business logic in `src/lib/services/*`.

### Consequences
- Better testability and consistency.
- Shared error handling via domain-specific service errors.

## ADR-0004: Public Slug As Primary Identifier
- Date: 2026-02-14
- Status: Accepted

### Context
Public profile URLs must be stable and human-readable.

### Decision
Expose and route by `slug` for public resources.

### Consequences
- Better UX and SEO.
- Slug uniqueness and rename behavior must be carefully managed.

## ADR-0005: PostgreSQL Full-Text Search For Discovery v1
- Date: 2026-02-14
- Status: Accepted

### Context
Discovery needed ranking and filters without adding search infrastructure too early.

### Decision
Implement discovery using PostgreSQL full-text search and SQL ranking.

### Consequences
- Fast initial delivery.
- Future semantic/vector layer remains optional and backlog-driven.

## ADR-0006: Growth Engine Built Into Main App
- Date: 2026-02-15
- Status: Accepted

### Context
Imports, claims, invites, outreach, and metrics needed shared data and auth context.

### Decision
Implement growth workflows as first-class API/admin modules inside the same Next.js app.

### Consequences
- Lower integration overhead.
- Requires stricter admin authorization and operational discipline.

## ADR-0007: Recruitment Automation With Explicit Opt-Out Policy
- Date: 2026-02-15
- Status: Accepted

### Context
Automated outreach introduces compliance and trust risks.

### Decision
Ship recruitment only with:
- public recruitment policy endpoint/page,
- public opt-out API/page,
- domain-level suppression,
- capped contact rates and retry controls.

### Consequences
- Safer outreach behavior.
- Additional storage and operational monitoring requirements.

## ADR-0008: Documentation Topology By Domain
- Date: 2026-02-15
- Status: Accepted

### Context
Flat documentation became hard to navigate and easy to desync.

### Decision
Adopt a layered docs structure:
- top-level index + site overview,
- folder-level `info_*.md` files by app/API/domain/ops,
- dedicated ChatGPT context file for prompt ingestion.

### Consequences
- Faster onboarding and better context handoff.
- Requires consistent updates when routes/contracts change.
