# src/lib

Doel: gedeelde infrastructuurcode, clients, validaties en utilities.

## Overzicht
Deze map bevat gedeelde code die door routes en componenten wordt gebruikt.

## Bestanden
- `db.ts`: Prisma singleton client
- `auth.ts`: auth configuratie placeholder
- `validations/`: Zod schemas [Wordt aangevuld in Fase 1]
- `utils/`: helper functies [Wordt aangevuld in Fase 1]
- `info_lib.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app`, `src/components`
- Hangt af van: dependencies zoals Prisma en NextAuth

## Patronen
- Geen framework-specifieke renderinglogica in lib
- Type-safe helpers met expliciete export

## Laatste wijziging
- 2026-02-14: gedeelde lib basis toegevoegd.
