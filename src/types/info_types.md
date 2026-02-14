# src/types

Doel: centrale type definities voor domeinmodellen en API contracten.

## Overzicht
Deze map bevat gedeelde TypeScript interfaces voor consistency tussen frontend en backend.

## Bestanden
- `agent.ts`: gedeelde agent types incl. search sort/category modellen
- `api.ts`: gestandaardiseerde API success/error payloadtypes
- `next-auth.d.ts`: NextAuth session/user type augmentatie
- `info_types.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app`, `src/components`, `src/lib`
- Hangt af van: TypeScript compiler en domeinmodellen

## Patronen
- Types zijn framework-onafhankelijk
- Vermijd `any`; gebruik concrete interfaces

## Laatste wijziging
- 2026-02-14: search-gerelateerde agent types toegevoegd voor fase 3.
