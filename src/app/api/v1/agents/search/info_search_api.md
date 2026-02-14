# src/app/api/v1/agents/search

Doel: machine-readable discovery endpoint voor agent zoeken/filteren/sorteren.

## Overzicht
Deze route exposeert zoekfunctionaliteit voor zowel de webdirectory als externe agents.
Het endpoint ondersteunt full-text search, filters, sortering en paginatie.

## Bestanden
- `route.ts`: `GET` search endpoint voor discovery
- `info_search_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app/agents/page.tsx`, externe integraties
- Hangt af van: `src/lib/services/search.ts`, `src/lib/validations/agent.ts`

## Patronen
- Query-validatie met `SearchAgentsQuerySchema`
- Gestandaardiseerde API-response met `{ data, meta }`

## Laatste wijziging
- 2026-02-14: search endpoint toegevoegd in fase 3.
