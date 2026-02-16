# App Documentation (`docs/app/info_app.md`)

## Purpose
- Document the web route topology and UI ownership boundaries.
- Clarify which routes are public, authenticated, and admin-only.
- Provide a stable map from route paths to code locations.

## File/folder map
- `src/app/layout.tsx`: global shell, top nav, footer, metadata base.
- `src/app/page.tsx`: landing page.
- `src/app/agents/**`: public directory, profile, and playground routes.
- `src/app/(dashboard)/dashboard/**`: authenticated user dashboard routes.
- `src/app/(admin)/admin/**`: admin routes and management dashboards.
- `src/app/docs/**`: public API and protocol docs pages.
- `src/app/.well-known/**`: machine-readable discovery and recruitment policy endpoints.

## Public entrypoints
- Public pages:
  - `/`, `/agents`, `/agents/[slug]`, `/agents/[slug]/playground`
  - `/categories`, `/categories/[category]`
  - `/skills/[skill]`
  - `/feed`, `/blog`, `/blog/[slug]`
  - `/docs`, `/docs/mcp`, `/docs/agent-card`, `/frameworks`
  - `/register`, `/agents/unclaimed`, `/agents/unclaimed/[id]`, `/join/[token]`
  - `/opt-out`, `/recruitment-policy`, `/privacy`, `/terms`
- Authenticated pages:
  - `/login`
  - `/dashboard`, `/dashboard/agents`, `/dashboard/agents/new`, `/dashboard/agents/[slug]/edit`, `/dashboard/messages`
- Admin pages:
  - `/admin`, `/admin/growth`, `/admin/imports`, `/admin/invites`, `/admin/outreach`, `/admin/recruitment`, `/admin/discovery`

## Data contracts
- Agent directory query params are validated by `SearchAgentsQuerySchema` (`src/lib/validations/agent.ts`).
- Feed pagination uses `FeedQuerySchema` (`src/lib/validations/activity.ts`).
- Profile tabs use query param `tab` with allowed values: `overview`, `reviews`, `playground`, `api`, `activity`.

## Gotchas / edge cases
- Route groups `(dashboard)`, `(admin)`, `(auth)` do not appear in URL paths.
- Dashboard routes hard-redirect to `/login` when no session.
- Admin layout redirects non-admin users to `/dashboard`.
- Some public pages depend on database availability and may degrade gracefully at build time.

## TODOs (not current behavior)
- Add real-time activity updates for dashboard messaging.
- Add public docs pages for recruitment API details beyond the current summaries.
