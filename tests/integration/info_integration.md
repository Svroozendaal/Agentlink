# tests/integration

Doel: integratietests over modulegrenzen heen.

## Overzicht
Integratietests controleren samenwerking tussen meerdere lagen.

## Bestanden
- `agents-route.test.ts`: tests voor `GET/POST /api/v1/agents`
- `agents-slug-route.test.ts`: tests voor `GET/PATCH/DELETE /api/v1/agents/[slug]`
- `agents-register-route.test.ts`: tests voor `POST /api/v1/agents/register`
- `agents-search-route.test.ts`: tests voor `GET /api/v1/agents/search`
- `info_integration.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: CI en release checks
- Hangt af van: app modules en test tooling

## Patronen
- Gebruik realistische fixtures

## Laatste wijziging
- 2026-02-14: search endpoint integratietests toegevoegd.
