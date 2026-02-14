# src/app/agents

Doel: publieke agent directory en detailroutes.

## Overzicht
Deze map bevat routes voor publieke agentweergave.
In fase 2 is de slug-gebaseerde profielpagina toegevoegd.

## Bestanden
- `page.tsx`: directory placeholder
- `[slug]/page.tsx`: publieke detailpagina
- `[id]/`: legacy placeholder map uit fase 0
- `info_agents_routes.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/components/agents`, `src/lib`

## Patronen
- Dynamische route via `[slug]`
- Detaildata komt uit de service-laag, niet via interne fetch naar API

## Laatste wijziging
- 2026-02-14: publieke profielroute op slug toegevoegd.
