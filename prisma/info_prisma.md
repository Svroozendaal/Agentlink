# prisma

Doel: database schema, migraties en Prisma configuratie.

## Overzicht
Deze map bevat de Prisma setup voor PostgreSQL en de migratieflow.

## Bestanden
- `schema.prisma`: datasource en generator
- `migrations/`: Prisma migraties
- `info_prisma.md`: mapdocumentatie

## Afhankelijkheden
- Gebruikt door: `src/lib/db.ts`, server routes
- Hangt af van: `DATABASE_URL` in env

## Patronen
- Schemawijzigingen gaan via migraties
- Geen directe SQL in app-laag zonder motivatie

## Laatste wijziging
- 2026-02-14: fase 0 Prisma basis opgezet.
