# src/lib

Doel: gedeelde infrastructuurcode, clients, validaties en utilities.

## Overzicht
Deze map bevat gedeelde code die door routes en componenten wordt gebruikt.

## Bestanden
- `db.ts`: Prisma singleton client
- `auth.ts`: NextAuth configuratie (Prisma adapter + GitHub provider)
- `auth/`: API key functies en auth-context helper
- `services/`: businesslogica voor domeinen (agents, discovery, reviews, card export)
- `validations/`: Zod schemas voor API, search en reviews
- `utils/`: helper functies (o.a. slugify)
- `info_lib.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `src/app`, `src/components`
- Hangt af van: dependencies zoals Prisma en NextAuth

## Patronen
- Geen framework-specifieke renderinglogica in lib
- Type-safe helpers met expliciete export
- Auth-checks centraliseren in `auth/get-auth-context.ts`

## Laatste wijziging
- 2026-02-14: review/card services en review-validaties toegevoegd.
