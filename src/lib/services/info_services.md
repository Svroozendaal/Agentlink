# src/lib/services

Doel: service-laag met businesslogica voor domeinen zoals agents.

## Overzicht
Deze map bevat functies die routes en pagina's gebruiken voor agent CRUD, discovery search, reputatie en machine-readable agent cards.
Route handlers blijven hierdoor dun en focussen op validatie + HTTP responses.

## Bestanden
- `agents.ts`: agent businesslogica, slug generatie, ownership checks
- `search.ts`: discovery search, filters, sortering, featured agents en categorie aggregaties
- `reviews.ts`: review listing + upsert logica en rating samenvattingen
- `agent-card.ts`: machine-readable card payload op basis van agentprofiel
- `info_services.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app/api/v1/agents/*`, dashboard pagina's, profielpagina's
- Hangt af van: `src/lib/db.ts`, `src/lib/utils/slugify.ts`, `src/lib/validations/agent.ts`

## Patronen
- Servicefuncties gooien `AgentServiceError` voor gecontroleerde foutstatussen
- Data-access verloopt uitsluitend via `src/lib/db.ts`

## Laatste wijziging
- 2026-02-14: review- en card-services toegevoegd voor productplan alignment.
