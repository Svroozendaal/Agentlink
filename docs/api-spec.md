# API Specification

## Conventies

- Base path: `/api/v1`
- Response succes: `{ "data": ... }`
- Response fout: `{ "error": { "code": "...", "message": "...", "details"?: ... } }`

## Auth Endpoints

### `GET /api/auth/[...nextauth]`
- Doel: NextAuth session en OAuth flow.
- Auth: n.v.t.
- Opmerking: route wordt door NextAuth intern afgehandeld.

### `POST /api/auth/[...nextauth]`
- Doel: NextAuth OAuth callback flow.
- Auth: n.v.t.
- Opmerking: route wordt door NextAuth intern afgehandeld.

## API Key Endpoints

### `GET /api/v1/auth/keys`
- Doel: lijst eigen API keys (zonder plaintext key).
- Auth: vereist websessie.
- Response `200`:
```json
{
  "data": [
    {
      "id": "ck...",
      "name": "Automation Key",
      "keyPrefix": "al_12345ab",
      "scopes": ["agents:read"],
      "lastUsedAt": "2026-02-14T00:00:00.000Z",
      "expiresAt": null,
      "isActive": true,
      "createdAt": "2026-02-14T00:00:00.000Z"
    }
  ]
}
```
- Response `401`: niet geauthenticeerd.

### `POST /api/v1/auth/keys`
- Doel: maak nieuwe API key voor ingelogde gebruiker.
- Auth: vereist websessie.
- Request body:

| Veld | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| `name` | `string` | Ja | Naam van de key (2-80 chars) |
| `scopes` | `string[]` | Nee | Scope lijst |
| `expiresAt` | `string (ISO datetime)` | Nee | Vervaldatum |

- Response `201`:
```json
{
  "data": {
    "id": "ck...",
    "key": "al_...plaintext...",
    "keyPrefix": "al_12345ab",
    "name": "Automation Key",
    "scopes": ["agents:read"],
    "expiresAt": null,
    "createdAt": "2026-02-14T00:00:00.000Z"
  }
}
```
- Response `400`: validatiefout body.
- Response `401`: niet geauthenticeerd.

### `DELETE /api/v1/auth/keys/[id]`
- Doel: revoke een bestaande API key van de huidige gebruiker.
- Auth: vereist websessie.
- Route params:

| Param | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| `id` | `cuid` | Ja | API key id |

- Response `200`:
```json
{
  "data": {
    "id": "ck...",
    "revoked": true
  }
}
```
- Response `400`: ongeldige route parameter.
- Response `401`: niet geauthenticeerd.
- Response `404`: key niet gevonden of niet van gebruiker.
