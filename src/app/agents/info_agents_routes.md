# src/app/agents

Doel: publieke agent directory en detailroutes.

## Overzicht
Deze map bevat routes voor publieke agentweergave.
Fase 3 voegt een volledige directory met search/filter URL-state toe.

## Bestanden
- `page.tsx`: agent directory met zoekbalk, filters, grid en paginatie
- `loading.tsx`: skeletons voor directory loading state
- `[slug]/page.tsx`: publieke detailpagina
- `[id]/`: legacy placeholder map uit fase 0
- `info_agents_routes.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/components/agents`, `src/lib`

## Patronen
- Dynamische route via `[slug]`
- Detaildata komt uit de service-laag, niet via interne fetch naar API
- Directory gebruikt URL query params als bron voor zoek/filterstate

## Laatste wijziging
- 2026-02-14: directory discovery pagina + loading state toegevoegd in fase 3.
