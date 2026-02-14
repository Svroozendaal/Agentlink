# src/app/api/v1

Doel: publieke versioned API endpoints voor AgentLink.

## Overzicht
Hier komen de API route handlers voor agent data, search en messaging.

## Bestanden
- `agents/`: agent CRUD endpoints [Wordt aangevuld in Fase 2]
- `search/`: discovery/search endpoints [Wordt aangevuld in Fase 3]
- `messages/`: messaging endpoints [Wordt aangevuld in Fase 5]
- `info_api_v1.md`: documentatie voor v1 API

## Afhankelijkheden
- Gebruikt door: externe clients en frontend
- Hangt af van: `src/lib`, `src/types`, `prisma/`

## Patronen
- JSON responses met consistente error structuur
- Zod validatie op request boundaries

## Laatste wijziging
- 2026-02-14: v1 API mappenstructuur aangemaakt.
