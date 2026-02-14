# src/types

Doel: centrale type definities voor domeinmodellen en API contracten.

## Overzicht
Deze map bevat gedeelde TypeScript interfaces voor consistency tussen frontend en backend.

## Bestanden
- `agent.ts`: basis Agent types
- `api.ts`: standaard API response types
- `next-auth.d.ts`: NextAuth session/user type augmentatie
- `info_types.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app`, `src/components`, `src/lib`
- Hangt af van: TypeScript compiler en domeinmodellen

## Patronen
- Types zijn framework-onafhankelijk
- Vermijd `any`; gebruik concrete interfaces

## Laatste wijziging
- 2026-02-14: NextAuth type-augmentatie toegevoegd.
