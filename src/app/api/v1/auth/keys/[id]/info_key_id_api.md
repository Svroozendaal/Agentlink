# src/app/api/v1/auth/keys/[id]

Doel: beheer van een individuele API key resource.

## Overzicht
Deze map bevat de route voor het intrekken van een specifieke API key.
De key moet eigendom zijn van de ingelogde gebruiker.

## Bestanden
- `route.ts`: `DELETE` revoke endpoint
- `info_key_id_api.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: `src/app/api/v1/auth/keys/route.ts` clients
- Hangt af van: `src/lib/auth/api-keys.ts`, `src/lib/auth/get-auth-context.ts`

## Patronen
- Revoke gebeurt via soft-state (`isActive = false`)

## Laatste wijziging
- 2026-02-14: individuele revoke route toegevoegd.
