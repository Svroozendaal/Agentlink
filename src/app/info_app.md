# src/app

Doel: Next.js app routes, layouts en API route handlers.

## Overzicht
Deze map bevat pagina's, layout en versioned API-structuur voor AgentLink.

## Bestanden
- `layout.tsx`: root layout
- `page.tsx`: placeholder landing page
- `(auth)/`: auth routegroep
- `(dashboard)/`: dashboard routegroep
- `agents/`: agent directory en detail routes
- `api/`: API routes
- `info_app.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/components`, `src/lib`, `src/types`

## Patronen
- Route handlers onder `api/` zijn versioned
- Pagina's blijven dun; business logic in `src/lib`

## Laatste wijziging
- 2026-02-14: fase 0 app skelet toegevoegd.
