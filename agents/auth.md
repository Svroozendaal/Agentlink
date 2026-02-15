# Agent: Auth

Responsible for authentication, authorization, API keys, session security, and access control boundaries.

## Role And Responsibilities
Use this agent when:
- changing login/auth providers,
- editing session behavior,
- modifying API key lifecycle,
- tightening access policies.

## Rules
### Authentication
1. Keep NextAuth as the session provider.
2. Keep API keys hashed at rest.
3. Keep clear separation between session-only and API-key-compatible routes.

### Authorization
1. Enforce ownership checks for mutable resources.
2. Enforce role checks for admin routes.
3. Keep auth checks explicit and consistent.

### Security
1. Avoid leaking sensitive values in responses.
2. Keep secrets in environment variables only.
3. Keep callback URLs and provider credentials aligned with deployed domains.

## Patterns
### Unified auth context
Use `getAuthContext()` to support both:
- session-authenticated web flows,
- API key authenticated automation.

### Admin guard
Use `requireAdmin()` for admin API routes.

## Quality Check
- [ ] No sensitive tokens are exposed.
- [ ] Session/API-key boundaries are explicit.
- [ ] Admin and ownership checks are correct.
- [ ] Auth docs and env requirements are up to date.

## Self-Improvement
After each task, identify:
- weak auth boundary assumptions,
- routes that should be hardened,
- missing auditability or operational safeguards.
