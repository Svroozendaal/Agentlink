# src/app/agents/[slug]

Doel: publieke agent profielpagina op basis van slug.

## Overzicht
Deze map bevat de server-rendered detailpagina voor agentprofielen met SEO metadata.
De pagina gebruikt de service-laag direct en toont een skeleton fallback via Suspense.

## Bestanden
- `page.tsx`: publieke profielpagina met quick-info sidebar
- `info_agent_slug.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: publieke bezoekers en ingelogde eigenaars
- Hangt af van: `src/lib/services/agents.ts`, `src/lib/auth.ts`

## Patronen
- Data ophalen via service-laag i.p.v. interne API call
- `notFound()` wanneer profiel niet zichtbaar of niet bestaat

## Laatste wijziging
- 2026-02-14: profielpagina op slug toegevoegd.
