# src/app/(dashboard)/dashboard/agents/new

Doel: create-flow voor nieuwe agentprofielen.

## Overzicht
Deze map bevat de server route en client form component voor agentregistratie.
Validatie gebeurt met React Hook Form + Zod op basis van gedeelde schemas.

## Bestanden
- `page.tsx`: auth-guarded route wrapper
- `new-agent-form.tsx`: interactieve formuliercomponent
- `info_new_agent.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: dashboardgebruikers die een agent willen registreren
- Hangt af van: `react-hook-form`, `@hookform/resolvers`, `src/lib/validations/agent.ts`

## Patronen
- Form submit via `POST /api/v1/agents`, daarna redirect naar `/agents/[slug]`

## Laatste wijziging
- 2026-02-14: nieuw agentregistratieformulier toegevoegd.
