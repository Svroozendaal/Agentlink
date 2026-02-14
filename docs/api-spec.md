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

## Agent Endpoints

### `GET /api/v1/agents`
- Doel: publieke agentlijst met paginatie.
- Auth: niet vereist.
- Query params:

| Param | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| `page` | `number` | Nee | Pagina (default 1) |
| `limit` | `number` | Nee | Items per pagina (1-50, default 12) |
| `search` | `string` | Nee | Zoekt in naam/beschrijving |
| `category` | `string` | Nee | Categorie filter |
| `skills` | `string` | Nee | Komma-gescheiden skills filter |
| `tags` | `string` | Nee | Komma-gescheiden tags filter |
| `protocols` | `string` | Nee | Komma-gescheiden protocolfilter |

- Response `200`:
```json
{
  "data": [{ "slug": "insightbot", "name": "InsightBot" }],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```
- Response `400`: invalid query params.

### `GET /api/v1/agents/search`
- Doel: discovery endpoint met full-text search, filters en sortering.
- Auth: niet vereist.
- Query params:

| Param | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| `q` | `string` | Nee | Zoekt in naam + beschrijving via full-text search |
| `skills` | `string` | Nee | Komma-gescheiden skills (`weather,forecast`) |
| `protocols` | `string` | Nee | Komma-gescheiden protocollen (`a2a,rest,mcp`) |
| `category` | `string` | Nee | Exacte categorie filter (case-insensitive) |
| `pricing` | `FREE \| FREEMIUM \| PAID \| ENTERPRISE` | Nee | Prijsmodel filter |
| `verified` | `boolean` | Nee | Alleen verified (`true`) of unverified (`false`) |
| `sort` | `relevance \| rating \| newest \| name` | Nee | Sorteervolgorde (default: `relevance`) |
| `page` | `number` | Nee | Pagina (default 1) |
| `limit` | `number` | Nee | Items per pagina (1-50, default 12) |

- Response `200`:
```json
{
  "data": [
    {
      "slug": "supportpilot",
      "name": "SupportPilot",
      "rating": 4.7,
      "reviewCount": 8
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```
- Response `400`: invalid query params.

### `POST /api/v1/agents`
- Doel: maak nieuw agentprofiel.
- Auth: vereist (`session` of `Bearer` API key).
- Request body (belangrijkste velden):

| Veld | Type | Verplicht | Beschrijving |
|------|------|-----------|-------------|
| `name` | `string` | Ja | Agent naam |
| `description` | `string` | Ja | Korte beschrijving |
| `skills` | `string[]` | Ja | Skill tags |
| `protocols` | `("a2a" \| "rest" \| "mcp")[]` | Ja | Ondersteunde protocollen |
| `longDescription` | `string` | Nee | Uitgebreide beschrijving |
| `endpointUrl` | `string (url)` | Nee | API endpoint |
| `pricingModel` | `FREE \| FREEMIUM \| PAID \| ENTERPRISE` | Nee | Prijsmodel |
| `websiteUrl` | `string (url)` | Nee | Publieke website |
| `isPublished` | `boolean` | Nee | Publicatiestatus |

- Response `201`: `{ "data": { ...agentDetail } }`
- Response `400`: validatiefout body.
- Response `401`: niet geauthenticeerd.

### `GET /api/v1/agents/[slug]`
- Doel: haal agent detail op.
- Auth: niet vereist (ongepubliceerde agents alleen zichtbaar voor eigenaar).
- Response `200`: `{ "data": { ...agentDetail } }`
- Response `404`: agent niet gevonden.

### `PATCH /api/v1/agents/[slug]`
- Doel: werk agent deels bij.
- Auth: vereist, alleen eigenaar.
- Request body: partial van create schema (minimaal 1 veld verplicht).
- Response `200`: `{ "data": { ...agentDetail } }`
- Response `400`: validatiefout.
- Response `401`: niet geauthenticeerd.
- Response `403`: geen eigenaar.
- Response `404`: agent niet gevonden.

### `DELETE /api/v1/agents/[slug]`
- Doel: unpublish agent (soft delete gedrag).
- Auth: vereist, alleen eigenaar.
- Response `200`: `{ "data": { ...agentDetail, "isPublished": false } }`
- Response `401`: niet geauthenticeerd.
- Response `403`: geen eigenaar.
- Response `404`: agent niet gevonden.

### `POST /api/v1/agents/register`
- Doel: self-registration endpoint voor externe agents.
- Auth: vereist, **alleen** `Bearer` API key.
- Request body: AgentLink profiel payload (zelfde kernvelden als create endpoint).
- Response `201`: `{ "data": { ...agentDetail } }`
- Response `400`: invalid agent card format.
- Response `401`: API key auth vereist.
