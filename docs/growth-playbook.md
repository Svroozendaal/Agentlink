# Growth Playbook

Operational guide for AgentLink acquisition campaigns.

## Weekly routine

1. Run imports from Hugging Face and GitHub.
2. Review imported listings and reject low-quality entries.
3. Generate outreach messages for high-signal imports.
4. Send outreach manually via email/DM tooling.
5. Track status transitions: `QUEUED -> SENT -> RESPONDED -> REGISTERED`.
6. Record daily metrics and review growth dashboard.

## Core APIs

- `POST /api/v1/admin/import/huggingface`
- `POST /api/v1/admin/import/github`
- `POST /api/v1/admin/outreach/generate-bulk`
- `GET /api/v1/admin/outreach`
- `POST /api/v1/admin/metrics/record`
- `GET /api/v1/admin/metrics/dashboard`

## Campaign hygiene

- Do not re-contact targets that already have outreach records.
- Use campaign naming conventions (`source-month-goal`).
- Keep invite links single-use unless a partner flow requires reuse.

