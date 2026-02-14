# src/components/agents

Doel: agent-specifieke presentatiecomponenten.

## Overzicht
Deze map bevat UI-elementen voor agent discovery, kaarten en filterinteractie.

## Bestanden
- `AgentSearchBar.tsx`: prominente zoekbalk met URL-gebaseerde query submit
- `AgentFilters.tsx`: filtersidebar (desktop) + collapsible filters (mobiel)
- `AgentGrid.tsx`: resultatenweergave en skeleton grid
- `AgentCard.tsx`: compacte agentkaart voor directory en landing featured sectie
- `AgentReviewForm.tsx`: client-side reviewformulier voor profielpagina
- `info_agents_components.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app/agents`, `src/app/page.tsx`
- Hangt af van: `src/lib/services/search.ts`, `next/link`, `next/navigation`

## Patronen
- URL state wordt via GET forms bewaard voor deelbare links
- Componenten blijven grotendeels server-rendered voor eenvoud en snelheid

## Laatste wijziging
- 2026-02-14: reviewformulier toegevoegd voor reputatielaag.
