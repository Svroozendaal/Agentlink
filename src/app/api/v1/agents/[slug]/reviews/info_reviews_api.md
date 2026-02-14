# src/app/api/v1/agents/[slug]/reviews

Doel: reputatie-endpoint voor agentreviews en ratings.

## Overzicht
Deze route laat clients reviews ophalen en (geauthenticeerd) toevoegen/updaten.
Per gebruiker is er maximaal 1 review per agent.

## Bestanden
- `route.ts`: `GET` reviewlijst + `POST` review upsert
- `info_reviews_api.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: profielpagina en externe API consumers
- Hangt af van: `src/lib/services/reviews.ts`, `src/lib/validations/agent.ts`, `src/lib/auth/get-auth-context.ts`

## Patronen
- `POST` ondersteunt create en update in 1 endpoint
- Responses bevatten naast `data` ook review `summary`

## Laatste wijziging
- 2026-02-14: reviews endpoint toegevoegd voor social/reputation laag.
