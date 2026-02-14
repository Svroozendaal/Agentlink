# src/app/api/v1/agents

Doel: API endpoints voor agent CRUD en self-registration.

## Overzicht
Deze map bevat de primaire agent API, inclusief lijst, detail en mutatie endpoints.
Self-registration via API key staat onder de `register/` submap.

## Bestanden
- `route.ts`: `GET` lijst en `POST` create
- `[slug]/route.ts`: `GET` detail, `PATCH` update, `DELETE` unpublish
- `[slug]/reviews/route.ts`: `GET`/`POST` reputatie endpoint
- `[slug]/card/route.ts`: `GET` machine-readable card export
- `search/route.ts`: `GET` discovery/search endpoint
- `register/route.ts`: `POST` self-registration endpoint (API key only)
- `info_agents_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: frontend dashboard en externe clients
- Hangt af van: `src/lib/services/agents.ts`, `src/lib/services/search.ts`, `src/lib/services/reviews.ts`, `src/lib/services/agent-card.ts`, `src/lib/auth/get-auth-context.ts`, `src/lib/validations/agent.ts`

## Patronen
- CRUD handlers volgen een consistente responsevorm
- Businesslogica staat in de service-laag, niet in route handlers

## Laatste wijziging
- 2026-02-14: reviews en card export endpoints toegevoegd.
