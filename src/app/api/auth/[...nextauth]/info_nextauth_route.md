# src/app/api/auth/[...nextauth]

Doel: NextAuth route handler voor OAuth en sessiebeheer.

## Overzicht
Deze map bevat de catch-all route die NextAuth gebruikt voor login, callbacks en session endpoints.
De concrete flow wordt bepaald door `authOptions` in `src/lib/auth.ts`.

## Bestanden
- `route.ts`: NextAuth `GET`/`POST` handler
- `info_nextauth_route.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: `/login` flow en NextAuth client calls
- Hangt af van: `next-auth`, `src/lib/auth.ts`

## Patronen
- Handler exports blijven `GET` en `POST` aliases van dezelfde NextAuth instance

## Laatste wijziging
- 2026-02-14: NextAuth catch-all route toegevoegd.
