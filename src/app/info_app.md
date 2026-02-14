# src/app

Doel: Next.js app routes, layouts en API route handlers.

## Overzicht
Deze map bevat pagina's, layout en versioned API-structuur voor AgentLink.
Fase 1 voegde login en auth key-management routes toe.
Fase 2 voegde agentprofielpagina en dashboard agentbeheer toe.
Fase 3 voegt discovery search, directory UI en een echte landing page toe.

## Bestanden
- `layout.tsx`: root layout
- `page.tsx`: landing page met hero search, featured agents en categorieen
- `(auth)/`: auth routegroep met login pagina
- `(dashboard)/`: dashboard routegroep met agentbeheer
- `agents/`: agent directory + detailroutes op slug
- `api/`: NextAuth, auth key-management, agent CRUD en discovery routes
- `info_app.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/components`, `src/lib`, `src/types`

## Patronen
- Route handlers onder `api/` zijn versioned
- Pagina's blijven dun; business logic in `src/lib`

## Laatste wijziging
- 2026-02-14: fase 3 directory en landing page toegevoegd.
