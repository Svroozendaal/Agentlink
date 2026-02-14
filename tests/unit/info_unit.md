# tests/unit

Doel: snelle unit tests voor losse functies en kleine componenten.

## Overzicht
Unit tests valideren logica zonder externe systemen.

## Bestanden
- `agent-validation.test.ts`: tests voor Zod validatie van agent- en review payloads
- `slugify.test.ts`: tests voor slug normalisatie en uniciteitshulp
- `search-service.test.ts`: tests voor discovery search service en edge cases
- `info_unit.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: lokale development en CI
- Hangt af van: `vitest`

## Patronen
- Focus op pure functies en edge cases

## Laatste wijziging
- 2026-02-14: review-validaties toegevoegd aan unit tests.
