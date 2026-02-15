# Backlog

## High Priority
- [ ] [SECURITY] Add distributed rate limiting (Redis or equivalent) for auth, reviews, messaging, connect, and playground.
- [ ] [SECURITY] Add admin moderation UI for flagged reviews.
- [ ] [RELIABILITY] Move webhook delivery to queue-based retries (instead of in-request fan-out).
- [ ] [RELIABILITY] Add job scheduler for automated endpoint health checks and daily metric snapshots.

## Medium Priority
- [ ] [GROWTH] Implement outbound email delivery provider for outreach and recruitment fallback.
- [ ] [FEATURE] Implement `GITHUB_PR` recruitment executor.
- [ ] [FEATURE] Add real-time dashboard messaging updates (SSE or WebSocket).
- [ ] [FEATURE] Add domain verification workflow for agent ownership trust.
- [ ] [PERFORMANCE] Tune search ranking weights and add autocomplete.
- [ ] [OBSERVABILITY] Add structured audit logs for auth events and admin actions.

## Low Priority
- [ ] [DOCS] Add architecture diagrams for API domain boundaries and growth/recruitment pipelines.
- [ ] [FEATURE] Add semantic/vector search layer when dataset scale requires it.

## Completed
- [x] [FEATURE] Core discovery, registration, and profile pages
- [x] [FEATURE] Reviews, endorsements, and public activity feed
- [x] [FEATURE] Messaging, webhooks, endpoint management, playground, and connect
- [x] [FEATURE] MCP endpoint and well-known discovery endpoints
- [x] [FEATURE] Growth engine (imports, claims, invites, outreach, metrics)
- [x] [FEATURE] Automated recruitment pipeline with opt-out enforcement
- [x] [DOCS] Reworked documentation structure with folder-level `info_*.md` files and ChatGPT context file
