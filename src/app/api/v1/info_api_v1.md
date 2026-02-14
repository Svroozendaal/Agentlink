# src/app/api/v1

Doel: publieke versioned API endpoints voor AgentLink.

## Overzicht
Hier staan de publieke versioned API route handlers.
Fase 1 bevat auth key-management.
Fase 2 voegt agent CRUD en self-registration endpoints toe.

## Bestanden
- `auth/`: API key management endpoints
- `agents/`: agent CRUD + register endpoints
- `search/`: discovery/search endpoints [Wordt aangevuld in Fase 3]
- `messages/`: messaging endpoints [Wordt aangevuld in Fase 5]
- `info_api_v1.md`: documentatie voor v1 API

## Afhankelijkheden
- Gebruikt door: externe clients en frontend
- Hangt af van: `src/lib`, `src/types`, `prisma/`

## Patronen
- JSON responses met consistente error structuur
- Zod validatie op request boundaries
- Sessiegebaseerde key-management routes onder `/api/v1/auth/*`

## Laatste wijziging
- 2026-02-14: agent CRUD en register endpoints toegevoegd.
