# prisma/migrations

Doel: versiebeheer van databaseschema-migraties.

## Overzicht
Hier worden Prisma migratiebestanden bijgehouden zodra modellen worden toegevoegd.

## Bestanden
- `20260214004733_initial_schema/migration.sql`: fase 1 initiële database en auth tabellen
- `info_migrations.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: Prisma migrate workflow
- Hangt af van: `prisma/schema.prisma`

## Patronen
- Wijzig schema alleen via gecontroleerde migraties

## Laatste wijziging
- 2026-02-14: initiële schema migratie toegevoegd.
