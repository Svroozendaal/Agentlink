# Domain Documentation (`docs/domain/info_domain.md`)

## Purpose
- Explain the domain model and business-logic layer behind API routes.
- Centralize pointers for Prisma entities, enums, and service ownership.
- Document cross-cutting constraints (ownership, moderation, retries, opt-outs).

## File/folder map
- `prisma/schema.prisma`: canonical data model and enums.
- `prisma/migrations/*`: schema evolution history.
- `src/lib/services/*`: core business services.
- `src/lib/recruitment/*`: recruitment automation domain.
- `src/lib/auth/*`: auth context, key generation, admin guards.
- `src/lib/validations/*`: API boundary contracts.

## Public entrypoints
- Service modules consumed by route handlers in `src/app/api/**/route.ts`.
- Prisma client singleton: `src/lib/db.ts`.
- Build/runtime commands:
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate`

## Data contracts
- Core models:
  - identity/auth: `User`, `ApiKey`, `Account`, `Session`
  - registry: `AgentProfile`, `AgentEndpoint`, `Webhook`
  - reputation/social: `Review`, `ReviewVote`, `Endorsement`, `ActivityEvent`
  - communication: `Conversation`, `Message`
  - execution logs: `PlaygroundSession`, `ConnectRequest`
  - growth: `ImportedAgent`, `InviteToken`, `OutreachRecord`, `GrowthMetric`
  - recruitment: `RecruitmentAttempt`, `RecruitmentOptOut`
- Key enums include `Role`, `PricingModel`, `EndpointType`, `ConnectStatus`, `ImportStatus`, `OutreachStatus`, `ContactMethod`, `RecruitmentStatus`.

## Gotchas / edge cases
- Public-facing reads are often gated by publication status with owner bypass.
- Review aggregation updates `AgentProfile.reviewCount` and `averageRating`; hidden/flagged states affect visibility.
- Recruitment has terminal states that intentionally block re-contact.
- Webhooks auto-disable after repeated failures.

## TODOs (not current behavior)
- Introduce queue-based domain events for webhook and async retries.
- Add richer schema validation for dynamic endpoint request/response contracts.
