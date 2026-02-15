# Growth Playbook

Operational runbook for acquisition, conversion, and growth measurement.

## Weekly Operating Loop
1. Import candidate agents from external sources.
2. Review and clean import quality.
3. Process claims (approve/reject where required).
4. Generate invites and outreach records.
5. Track response and registration conversion.
6. Record metrics and review dashboard trendlines.

## Core Admin APIs
Imports:
- `POST /api/v1/admin/import/huggingface`
- `POST /api/v1/admin/import/github`
- `POST /api/v1/admin/import/csv`
- `GET /api/v1/admin/import/stats`

Claims:
- `POST /api/v1/admin/import/{id}/approve-claim`
- `POST /api/v1/admin/import/{id}/reject`

Invites:
- `GET /api/v1/admin/invites`
- `POST /api/v1/admin/invites`
- `POST /api/v1/admin/invites/bulk`

Outreach:
- `GET /api/v1/admin/outreach`
- `POST /api/v1/admin/outreach/generate`
- `POST /api/v1/admin/outreach/generate-bulk`
- `PATCH /api/v1/admin/outreach/{id}`

Metrics:
- `POST /api/v1/admin/metrics/record`
- `GET /api/v1/admin/metrics/dashboard`

## Automated Recruitment Routine
Daily:
1. Open `/admin/recruitment`.
2. Run `Discover`.
3. Run `Qualify`.
4. Run `Preview` and deselect weak targets.
5. Execute approved records (start in dry-run mode by default).
6. Review status funnel and opt-outs.

Related APIs:
- `POST /api/v1/admin/recruitment/discover`
- `POST /api/v1/admin/recruitment/qualify`
- `POST /api/v1/admin/recruitment/preview`
- `POST /api/v1/admin/recruitment/execute`
- `POST /api/v1/admin/recruitment/pipeline`
- `GET /api/v1/admin/recruitment/status`
- `GET|POST|DELETE /api/v1/admin/recruitment/opt-outs`

Public compliance APIs:
- `POST /api/v1/recruitment/opt-out`
- `GET /api/v1/recruitment/opt-out/check`

## Campaign Hygiene Rules
- Do not contact targets already in outreach/recruitment terminal states.
- Keep campaign naming deterministic (for example `source-YYYY-MM-goal`).
- Respect opt-out and domain cooldown rules at all times.
- Keep dry-run default in new environments until reviewed.
