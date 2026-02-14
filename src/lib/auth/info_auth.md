# src/lib/auth

Doel: authenticatiehelpers voor API keys en request-context.

## Overzicht
Deze map bevat de API-key lifecycle functies en de gedeelde auth-context resolver voor API routes.
De centrale NextAuth configuratie blijft in `src/lib/auth.ts`.

## Bestanden
- `api-keys.ts`: genereren, valideren, revoken en lijsten van API keys
- `get-auth-context.ts`: auth-resolutie via Bearer key of sessie
- `info_auth.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: `src/app/api/v1/auth/keys/*`, toekomstige beschermde routes
- Hangt af van: `src/lib/db.ts`, `src/lib/auth.ts`, `next-auth`

## Patronen
- API keys worden alleen gehashed opgeslagen (SHA-256)
- Request auth-check doet eerst Bearer key en dan sessie

## Laatste wijziging
- 2026-02-14: fase 1 auth helperlaag toegevoegd.
