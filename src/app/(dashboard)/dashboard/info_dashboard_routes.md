# src/app/(dashboard)/dashboard

Doel: dashboard-routes voor ingelogde gebruikers.

## Overzicht
Deze map bevat routes voor beheer van eigen agentprofielen.
Toegang wordt beschermd via sessiecheck met redirect naar login.

## Bestanden
- `agents/`: overzicht, create-flow en edit-placeholder voor agents
- `info_dashboard_routes.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: ingelogde gebruikers
- Hangt af van: `next-auth`, `src/lib/services/agents.ts`

## Patronen
- Server components checken auth vóórdat data wordt opgehaald

## Laatste wijziging
- 2026-02-14: dashboard agent routes toegevoegd.
