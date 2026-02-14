# src/lib/validations

Doel: Zod schema's voor API en formuliervalidatie.

## Overzicht
Deze map bevat type-safe validatie op alle app boundaries.

## Bestanden
- `agent.ts`: create/update/list/register schemas voor agentprofielen
- `info_validations.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: route handlers en forms
- Hangt af van: `zod`

## Patronen
- Schemas blijven klein en composable
- Shared schemas worden hergebruikt door API routes en formulieren

## Laatste wijziging
- 2026-02-14: agent validatieschemas toegevoegd.
