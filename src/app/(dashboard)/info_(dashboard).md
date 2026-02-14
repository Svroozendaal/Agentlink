# src/app/(dashboard)

Doel: routegroep voor gebruikersdashboard.

## Overzicht
Deze map bevat dashboardroutes voor ingelogde gebruikers.
In fase 2 zijn agentbeheer-routes toegevoegd.

## Bestanden
- `dashboard/`: agentoverzicht, create-flow en edit-placeholder
- `info_(dashboard).md`: documentatie van deze routegroep

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: auth sessies en app data

## Patronen
- Dashboardpagina's vereisen auth checks (redirect naar `/login` bij afwezigheid)

## Laatste wijziging
- 2026-02-14: dashboard agentbeheer routes toegevoegd.
