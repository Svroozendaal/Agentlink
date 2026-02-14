# prisma

Doel: database schema, migraties en Prisma configuratie.

## Overzicht
Deze map bevat de Prisma setup voor PostgreSQL en de migratieflow.

## Bestanden
- `schema.prisma`: kernschema met User/Auth/API key/AgentProfile modellen
- `seed.ts`: deterministische seed met 5 voorbeeldagents
- `migrations/`: Prisma migraties
- `info_prisma.md`: mapdocumentatie

## Afhankelijkheden
- Gebruikt door: `src/lib/db.ts`, server routes
- Hangt af van: `DATABASE_URL` in env

## Patronen
- Schemawijzigingen gaan via migraties
- Geen directe SQL in app-laag zonder motivatie
- Seed data gebruikt `upsert` zodat herhaald uitvoeren veilig blijft

## Laatste wijziging
- 2026-02-14: fase 1 schema, migratie en seed toegevoegd.
