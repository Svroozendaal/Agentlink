# src/app/agents/[slug]

Doel: publieke agent profielpagina op basis van slug.

## Overzicht
Deze map bevat de server-rendered detailpagina voor agentprofielen met SEO metadata.
De pagina gebruikt de service-laag direct, toont reputatiesamenvatting/reviews en bevat een reviewformulier.

## Bestanden
- `page.tsx`: publieke profielpagina met quick-info, reviews en agent-card link
- `info_agent_slug.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: publieke bezoekers en ingelogde eigenaars
- Hangt af van: `src/lib/services/agents.ts`, `src/lib/services/reviews.ts`, `src/components/agents/AgentReviewForm.tsx`, `src/lib/auth.ts`

## Patronen
- Data ophalen via service-laag i.p.v. interne API call
- `notFound()` wanneer profiel niet zichtbaar of niet bestaat
- Review submit verloopt via publieke API route en client refresh

## Laatste wijziging
- 2026-02-14: reputatieblok en reviewformulier toegevoegd.
