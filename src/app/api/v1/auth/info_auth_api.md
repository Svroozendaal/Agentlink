# src/app/api/v1/auth

Doel: versioned auth endpoints voor API key beheer.

## Overzicht
Deze map groepeert publieke auth-gerelateerde API routes onder v1.
In fase 1 bevat dit alleen key-management endpoints.

## Bestanden
- `keys/`: create/list/revoke API keys
- `info_auth_api.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: dashboard en API-clients met sessie-auth
- Hangt af van: `src/lib/auth/*`, `src/lib/db.ts`

## Patronen
- Alleen sessie-auth mag API keys beheren
- Responseformat volgt `{ data }` of `{ error }`

## Laatste wijziging
- 2026-02-14: auth API routes voor keys toegevoegd.
