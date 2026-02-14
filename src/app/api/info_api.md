# src/app/api

Doel: API routes voor auth en publieke versiebeheerde endpoints.

## Overzicht
Deze map groepeert API routes onder auth en v1.

## Bestanden
- `auth/`: NextAuth sessie/OAuth routes
- `v1/`: publieke API routes (API keys + agent CRUD + register + search)
- `info_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: frontend en externe clients
- Hangt af van: `src/lib`, `src/types`, `prisma/`

## Patronen
- Versioneer publieke API onder `v1/`
- Gebruik gedeelde auth-helper voor beveiligde v1 endpoints

## Laatste wijziging
- 2026-02-14: v1 discovery search route toegevoegd.
