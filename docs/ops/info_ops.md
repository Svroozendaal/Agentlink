# Operations Documentation (`docs/ops/info_ops.md`)

## Purpose
- Document local and production operational workflows.
- Capture required environment configuration and deployment behavior.
- Define verification and quality gates for releases.

## File/folder map
- `.env.example`: baseline environment variable contract.
- `README.md`: setup and command quick-start.
- `docs/growth-playbook.md`: admin growth operations.
- `docs/recruitment-system.md`: recruitment execution and compliance.
- `docs/ops/domain-cutover-agent-l-ink.md`: production domain migration checklist.
- `docs/ops/google-and-agent-discovery.md`: Google Search Console + crawler discoverability runbook.
- `tests/**`: unit/integration/e2e test suites.

## Public entrypoints
- Runtime scripts:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm start`
  - `pnpm test`
  - `pnpm test:unit`
  - `pnpm test:integration`
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate`

## Data contracts
- Required env vars:
  - `DATABASE_URL`, `SHADOW_DATABASE_URL`
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Optional but operationally important:
  - `GITHUB_TOKEN`
  - `RECRUITMENT_ENABLED`
  - `RECRUITMENT_MAX_PER_HOUR`
  - `RECRUITMENT_MAX_PER_DAY`
  - `RECRUITMENT_DRY_RUN`

## Gotchas / edge cases
- OAuth callback must exactly match deployed domain callback URL.
- In-memory rate limiting does not synchronize across multiple app instances.
- Build-time DB access may fail in environments lacking direct DB network access; some routes already use safe fallbacks.

## TODOs (not current behavior)
- Add scheduled jobs for health checks and metrics in production.
- Add centralized logging/monitoring and alerting for admin pipelines.
- Add CI workflow enforcing lint + build + tests before merge.
