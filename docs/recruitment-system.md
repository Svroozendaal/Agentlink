# Recruitment System

Automated recruitment allows AgentLink to discover external agents and invite them to join the registry while enforcing explicit opt-out controls.

## Pipeline
1. Discover candidates from source imports.
2. Qualify candidates by score, contactability, and policy checks.
3. Preview generated invitation payloads.
4. Execute selected outreach attempts.
5. Track outcomes, retries, and funnel performance.

## Core Modules
- `src/lib/recruitment/pipeline.ts`: orchestration of discover/qualify/preview/execute/full pipeline.
- `src/lib/recruitment/orchestrator.ts`: attempt execution, status handling, retries, limits.
- `src/lib/recruitment/strategy.ts`: contact method prioritization.
- `src/lib/recruitment/messages.ts`: per-channel invitation payload builders.
- `src/lib/recruitment/opt-out.ts`: domain suppression lifecycle.
- `src/lib/recruitment/identity.ts`: recruiter user/agent/api-key bootstrap.

## Contact Methods
- `REST_ENDPOINT`
- `A2A_PROTOCOL`
- `MCP_INTERACTION`
- `WELL_KNOWN_CHECK`
- `GITHUB_ISSUE`
- `GITHUB_PR` (defined but not implemented)
- `WEBHOOK_PING`
- `EMAIL_API` (stub unless integrated)

## Data Model
- `RecruitmentAttempt`
  - unique by `(targetUrl, contactMethod)`
  - tracks request/response payloads, status, retries, campaign, invite token
- `RecruitmentOptOut`
  - unique by `domain`
  - blocks future attempts for matching domains

## Safeguards
- Global throughput limits (`RECRUITMENT_MAX_PER_HOUR`, `RECRUITMENT_MAX_PER_DAY`).
- Domain politeness rule: max one contact per domain every 7 days.
- Retry cap for failed attempts.
- Dry-run support (`RECRUITMENT_DRY_RUN=true`).
- Global kill switch (`RECRUITMENT_ENABLED=false`).
- Hard domain opt-out enforcement across attempts.

## Public Compliance Surface
- Policy endpoint: `/.well-known/recruitment-policy.json`
- Policy page: `/recruitment-policy`
- Opt-out page: `/opt-out`
- Opt-out API: `POST /api/v1/recruitment/opt-out`
- Opt-out check API: `GET /api/v1/recruitment/opt-out/check`

## Admin Control Surface
- `/admin/recruitment` UI
- Admin APIs:
  - `POST /api/v1/admin/recruitment/discover`
  - `POST /api/v1/admin/recruitment/qualify`
  - `POST /api/v1/admin/recruitment/preview`
  - `POST /api/v1/admin/recruitment/execute`
  - `POST /api/v1/admin/recruitment/pipeline`
  - `GET /api/v1/admin/recruitment/status`
  - `GET|POST|DELETE /api/v1/admin/recruitment/opt-outs`

## Known Limitations
- `GITHUB_PR` executor is currently a placeholder.
- `EMAIL_API` channel is a non-production stub until provider integration.
- No queue worker yet; execution occurs inline.
