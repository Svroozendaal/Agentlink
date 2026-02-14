# src/app

Doel: Next.js app routes, layouts en API route handlers.

## Overzicht
Deze map bevat pagina's, layout en versioned API-structuur voor AgentLink.
Fase 1 voegde login en auth key-management routes toe.

## Bestanden
- `layout.tsx`: root layout
- `page.tsx`: placeholder landing page
- `(auth)/`: auth routegroep met login pagina
- `(dashboard)/`: dashboard routegroep
- `agents/`: agent directory en detail routes
- `api/`: NextAuth en v1 auth key-management routes
- `info_app.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/components`, `src/lib`, `src/types`

## Patronen
- Route handlers onder `api/` zijn versioned
- Pagina's blijven dun; business logic in `src/lib`

## Laatste wijziging
- 2026-02-14: fase 1 auth routes toegevoegd.
