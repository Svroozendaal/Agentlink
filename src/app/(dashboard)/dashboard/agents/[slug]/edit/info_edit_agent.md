# src/app/(dashboard)/dashboard/agents/[slug]/edit

Doel: editroute voor een individueel agentprofiel in het dashboard.

## Overzicht
Deze route is momenteel een placeholder en bevestigt eigenaarschap + routebereik.
Volledige edit UI volgt in een volgende iteratie.

## Bestanden
- `page.tsx`: auth- en ownership-guarded edit placeholder
- `info_edit_agent.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app/(dashboard)/dashboard/agents/page.tsx`
- Hangt af van: `src/lib/services/agents.ts`, `src/lib/auth.ts`

## Patronen
- Route redirectt naar overzicht bij ontbrekende permissie

## Laatste wijziging
- 2026-02-14: edit placeholder toegevoegd.
