# Agents Folder (`agents/`)

Instruction files for role-based execution workflows.

## Overview
These markdown files define how specialized agents should operate (architecture, API, auth, testing, documentation, and review).

## File map
- `architect.md`: structure, boundaries, dependency decisions.
- `database.md`: schema, migrations, persistence correctness.
- `api.md`: route contracts, validation, handler standards.
- `frontend.md`: UI/UX implementation patterns.
- `auth.md`: auth and authorization boundaries.
- `testing.md`: test strategy and regression coverage.
- `review.md`: quality and risk review process.
- `documentation.md`: documentation ownership and structure governance.
- `docs.md`: compatibility alias pointing to `documentation.md`.

## How to use
1. Select the minimal set of agents relevant to the task.
2. Follow their rules and checklists while implementing.
3. Run a final documentation pass through `documentation.md`.

## Conventions
- Keep instructions practical and implementation-focused.
- Keep agent files in English.
- Update the relevant agent file when standards evolve.
