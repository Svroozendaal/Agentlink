# Documentation Index (`docs/`)

## Purpose
- Keep product, architecture, API, and operational documentation aligned with the live codebase.
- Provide a single navigation layer so contributors can find the right document quickly.
- Define documentation ownership and update workflow.

## Documentation Routing
- Start here for orientation: `docs/site-overview.md`
- Full prompt-ready context for LLMs: `docs/chatgpt-context.md`
- API endpoint catalog and payloads: `docs/api-spec.md`
- Product-plan fit and delivery status: `docs/productplan-alignment.md`
- Recruitment automation details: `docs/recruitment-system.md`
- Growth operations runbook: `docs/growth-playbook.md`
- Protocol-specific references:
  - `docs/mcp.md`
  - `docs/mcp-integration.md`
  - `docs/connect.md`
  - `docs/playground.md`
- Partnership material:
  - `docs/partnerships/anthropic-mcp-pitch.md`
  - `docs/partnerships/mcp-directory-submission.md`
- Framework integration starter:
  - `docs/integrations/langchain-llamaindex.md`
- Domain cutover runbook:
  - `docs/ops/domain-cutover-agent-l-ink.md`
- Search and crawler discoverability runbook:
  - `docs/ops/google-and-agent-discovery.md`
- Architectural records and planning:
  - `docs/decisions.md`
  - `docs/backlog.md`
  - `docs/seo-checklist.md`

## Folder Map
- `docs/app/info_app.md`: web routes, route groups, UI entrypoints.
- `docs/api/info_api.md`: API domains, auth model, contracts by endpoint family.
- `docs/domain/info_domain.md`: Prisma model map, service boundaries, business logic.
- `docs/ops/info_ops.md`: environments, deployment, migrations, testing, monitoring.

## Update Workflow
1. Update code.
2. Update the matching `info_*.md` file first.
3. Update domain-specific docs (`api-spec`, `recruitment-system`, etc.).
4. Update `docs/chatgpt-context.md` when architecture, data contracts, or route topology changes.
5. Log major decisions in `docs/decisions.md` and follow-up work in `docs/backlog.md`.
