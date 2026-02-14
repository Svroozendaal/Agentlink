# src/app/api/v1/auth/keys

Doel: API key management endpoints voor geauthenticeerde gebruikers.

## Overzicht
Deze map bevat routes om API keys aan te maken en op te vragen.
Revoke van individuele keys loopt via de `[id]` subroute.

## Bestanden
- `route.ts`: `GET` lijst eigen keys, `POST` nieuwe key
- `[id]/route.ts`: `DELETE` revoke specifieke key
- `info_keys_api.md`: documentatie voor deze map

## Afhankelijkheden
- Gebruikt door: instellingenpagina's en automation clients
- Hangt af van: `src/lib/auth/api-keys.ts`, `src/lib/auth/get-auth-context.ts`

## Patronen
- Plaintext key wordt alleen bij creatie teruggegeven
- Lijstendpoint geeft alleen prefix en metadata terug

## Laatste wijziging
- 2026-02-14: key create/list/revoke endpoints toegevoegd.
