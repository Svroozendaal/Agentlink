# src/app/(dashboard)/dashboard/agents/[slug]

Doel: slug-specifieke dashboardroutes voor een agent.

## Overzicht
Deze map groepeert routes die op één specifieke agent van de gebruiker werken.

## Bestanden
- `edit/`: tijdelijke edit route
- `info_dashboard_agent_slug.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: dashboard agentoverzicht
- Hangt af van: `src/lib/services/agents.ts`

## Patronen
- Routes verifiëren eigenaarschap via `ownerId` checks

## Laatste wijziging
- 2026-02-14: slug-gebaseerde dashboardroute toegevoegd.
