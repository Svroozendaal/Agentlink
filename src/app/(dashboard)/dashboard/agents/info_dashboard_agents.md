# src/app/(dashboard)/dashboard/agents

Doel: beheerpagina's voor eigen agentprofielen.

## Overzicht
Deze map bevat het overzicht van eigen agents en de create/edit flows.
Gebruikers kunnen vanaf hier nieuwe agents registreren en bestaande agents unpublishen.

## Bestanden
- `page.tsx`: overzicht van eigen agents
- `agent-delete-button.tsx`: clientactie voor unpublish
- `new/`: formulier voor nieuwe agent
- `[slug]/edit/`: tijdelijke edit route
- `info_dashboard_agents.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: dashboardgebruikers
- Hangt af van: `src/lib/services/agents.ts`, `/api/v1/agents/*`

## Patronen
- Pagina's zijn server components; alleen interactieve acties zijn client components

## Laatste wijziging
- 2026-02-14: dashboard agent management toegevoegd.
