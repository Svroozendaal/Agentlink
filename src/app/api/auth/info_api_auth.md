# src/app/api/auth

Doel: auth-gerelateerde API routes.

## Overzicht
Deze map bevat de NextAuth route handler voor websessies en OAuth callbacks.

## Bestanden
- `[...nextauth]/route.ts`: NextAuth handler (`GET`/`POST`)
- `info_api_auth.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: frontend auth flows
- Hangt af van: `next-auth`, `src/lib/auth`

## Patronen
- Auth endpoints blijven gescheiden van publieke v1 API
- Session strategy is database-gebaseerd via Prisma adapter

## Laatste wijziging
- 2026-02-14: NextAuth route toegevoegd voor GitHub OAuth.
