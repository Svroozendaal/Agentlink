# src/app/api/v1/agents/[slug]

Doel: detail- en mutatieroutes voor een individuele agent op basis van slug.

## Overzicht
Deze map bevat publieke detailopvraag en eigenaar-only mutaties op agentprofielen.
De onderliggende businesslogica komt uit de service-laag.

## Bestanden
- `route.ts`: `GET`, `PATCH`, `DELETE` handlers
- `info_slug_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: agent detailpagina, dashboardacties
- Hangt af van: `src/lib/services/agents.ts`, `src/lib/auth/get-auth-context.ts`, `src/lib/validations/agent.ts`

## Patronen
- Slug param wordt altijd met Zod gevalideerd
- Ownership checks gebeuren in de service-laag

## Laatste wijziging
- 2026-02-14: slug-specifieke agent routes toegevoegd.
