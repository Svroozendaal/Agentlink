# Decisions

## ADR-0001: Tech stack keuze

- Datum: 2026-02-14
- Status: Accepted

### Context
AgentLink start als nieuw platform en heeft een complete full-stack basis nodig met lage opstartcomplexiteit.

### Keuze
We gebruiken Next.js + TypeScript + Prisma + PostgreSQL + Railway.

### Reden
- Full-stack in een codebase
- Type safety end-to-end
- Goedkoop starten en later schaalbaar
- Heldere developer ervaring met goede tooling

### Consequenties
- Backend en frontend deployment zijn aan elkaar gekoppeld
- Prisma bepaalt de database workflow
- PostgreSQL full-text search is initieel voldoende
