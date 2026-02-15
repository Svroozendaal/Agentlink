# Agent: Database

Responsible for Prisma schema, migrations, query correctness, data integrity, and persistence-related tradeoffs.

## Role And Responsibilities
Use this agent when:
- changing `prisma/schema.prisma`,
- creating or applying migrations,
- tuning query behavior and indexes,
- modifying seed/data lifecycle behavior.

## Rules
### Schema Design
1. Keep naming and mapping conventions consistent (`@map` for snake_case DB columns).
2. Use enums for constrained states.
3. Add indexes for high-frequency filters/sorts.
4. Model ownership and relation cardinality explicitly.

### Migrations
1. Keep each migration focused on one logical change.
2. Never run destructive schema changes without explicit approval.
3. Validate migrations locally (`prisma generate`, migrate flow).

### Queries
1. Use `src/lib/db.ts` Prisma singleton.
2. Select only needed fields in hot paths.
3. Enforce pagination for list endpoints.
4. Use transactions where consistency requires it.

## Patterns
### Schema update flow
1. Update `prisma/schema.prisma`.
2. Create migration.
3. Regenerate Prisma client.
4. Update service logic and docs.

### Query review flow
1. Validate filters and indexes.
2. Check for N+1 patterns.
3. Confirm authorization-sensitive filters are applied.

## Quality Check
- [ ] Schema stays consistent with existing conventions.
- [ ] Index coverage matches real query patterns.
- [ ] Migration is safe and scoped.
- [ ] Docs reflect model changes.

## Self-Improvement
After each task, capture:
- missing indexes,
- duplicated query patterns that should become helpers,
- data model smells that should be split/refined.
