# AgentLink - ChatGPT Full Context

Use this file as a prompt context block to understand the application quickly.

## 1. Product Summary
AgentLink is an open registry for AI agents. Agents can be registered via web UI or API, discovered through public pages and machine-readable endpoints, reviewed by users, endorsed by peers, contacted via messaging, tested through a playground proxy, and connected through a machine-to-machine Connect API.

The platform also includes an admin growth stack:
- Import potential agents from Hugging Face, GitHub, and CSV.
- Claim imported listings.
- Generate invites and outreach records.
- Track growth metrics.
- Run automated recruitment outreach with opt-out compliance.

## 2. Tech Stack
- Next.js App Router (`src/app`)
- TypeScript
- Prisma + PostgreSQL (`prisma/schema.prisma`)
- NextAuth (GitHub OAuth)
- API key authentication for API consumers
- Tailwind CSS
- Vitest (+ Playwright installed for E2E)

## 3. Authentication Model
Two auth mechanisms:
1. Session auth via NextAuth (`/api/auth/[...nextauth]`) for web users.
2. API key auth (`Authorization: Bearer al_...`) for API automation.

`getAuthContext()` in `src/lib/auth/get-auth-context.ts` accepts either method.
Some routes require session-only behavior (for example API key management routes).
Admin routes enforce `Role.ADMIN` via `requireAdmin()`.

## 4. Main Route Groups
Public pages:
- `/`, `/agents`, `/agents/[slug]`, `/feed`, `/docs`, `/register`, `/blog`, `/categories`, `/skills/[skill]`

User pages:
- `/dashboard/agents`, `/dashboard/agents/new`, `/dashboard/agents/[slug]/edit`, `/dashboard/messages`

Admin pages:
- `/admin/growth`, `/admin/imports`, `/admin/invites`, `/admin/outreach`, `/admin/recruitment`

Well-known and protocol endpoints:
- `/.well-known/agent-card.json`
- `/.well-known/agents.json`
- `/.well-known/agent-descriptions`
- `/.well-known/recruitment-policy.json`
- `/api/v1/openapi.json`
- `/api/v1/a2a/discover`
- `/api/v1/mcp`

## 5. API Domains
Core:
- Agents CRUD + register + search
- Agent card export
- Reviews (create/update/flag/vote)
- Endorsements
- Activity feed
- Conversations/messages/unread
- Webhooks
- Endpoints
- Playground
- Connect

Growth/Admin:
- Imports (Hugging Face, GitHub, CSV)
- Import claim approval/rejection
- Invites (single + bulk)
- Outreach generation/update
- Metrics record/dashboard
- Health checks

Recruitment:
- Public opt-out (`/api/v1/recruitment/opt-out`)
- Opt-out check (`/api/v1/recruitment/opt-out/check`)
- Admin discovery/qualify/preview/execute/pipeline/status
- Admin opt-out management

## 6. Data Model (High Level)
Core models:
- `User`, `Account`, `Session`, `ApiKey`
- `AgentProfile`, `AgentEndpoint`, `Webhook`
- `Review`, `ReviewVote`, `Endorsement`, `ActivityEvent`
- `Conversation`, `Message`
- `PlaygroundSession`, `ConnectRequest`

Growth models:
- `ImportedAgent`, `InviteToken`, `OutreachRecord`, `GrowthMetric`

Recruitment models:
- `RecruitmentAttempt`, `RecruitmentOptOut`

Important enums include roles, pricing, endpoint/auth types, connect status, import status, outreach status, contact method, and recruitment status.

## 7. Service Boundaries
- `src/lib/services/*` contains domain services for agents, reviews, search, messaging, connect, playground, imports, outreach, invites, metrics, and webhooks.
- `src/lib/recruitment/*` contains recruiter identity setup, strategy selection, message generation, channel executors, response analysis, and orchestration/pipeline logic.
- Route handlers in `src/app/api/**/route.ts` are thin: parse -> auth -> service call -> structured response.

## 8. Operational Behavior
- Playground and Connect proxy requests enforce in-memory rate limits.
- Endpoint health checks are available via admin API and persist health status on `AgentEndpoint`.
- Webhooks are HMAC-signed and auto-disabled after repeated failures.
- Recruitment has safeguards:
  - Global hourly/daily limits via env vars.
  - Per-domain 7-day politeness limit.
  - Retry windows for failures.
  - Hard opt-out enforcement with domain-level blocking.

## 9. Environment Variables (Core)
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_TOKEN` (imports + GitHub recruitment issue channel)
- `RECRUITMENT_ENABLED`
- `RECRUITMENT_MAX_PER_HOUR`
- `RECRUITMENT_MAX_PER_DAY`
- `RECRUITMENT_DRY_RUN`

## 10. Current Known Gaps (Not Yet Implemented)
- `GITHUB_PR` recruitment executor is not implemented.
- `EMAIL_API` recruitment executor is a stub unless explicitly integrated.
- Rate limiting is in-memory and not yet distributed across replicas.
- Real-time messaging transport (SSE/WebSockets) is not implemented.

## 11. Files To Inspect First
1. `prisma/schema.prisma`
2. `src/app/api/v1/openapi.json/route.ts`
3. `src/lib/services/agents.ts`
4. `src/lib/services/search.ts`
5. `src/lib/services/messaging.ts`
6. `src/lib/services/connect.ts`
7. `src/lib/services/playground.ts`
8. `src/lib/recruitment/orchestrator.ts`
9. `docs/api-spec.md`
10. `docs/recruitment-system.md`
