# src/app/(auth)

Doel: routegroep voor authenticatie flows.

## Overzicht
Deze map bevat de authenticatiepagina's voor de webflow.
In fase 1 is de GitHub OAuth loginpagina toegevoegd.

## Bestanden
- `login/page.tsx`: inlogpagina met "Login met GitHub" knop
- `info_(auth).md`: documentatie van deze routegroep

## Afhankelijkheden
- Gebruikt door: Next.js router
- Hangt af van: `src/lib/auth`, `next-auth`

## Patronen
- Alleen auth-gerelateerde routes in deze groep
- Gebruik routegroep zodat URL schoon blijft (`/login` i.p.v. `/(auth)/login`)

## Laatste wijziging
- 2026-02-14: login route toegevoegd voor GitHub OAuth.
