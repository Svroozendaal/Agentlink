# src/app/(auth)/login

Doel: web loginpagina voor OAuth authenticatie.

## Overzicht
Deze map bevat de loginpagina die gebruikers doorstuurt naar GitHub OAuth via NextAuth.
Er is bewust geen email/password flow in fase 1.

## Bestanden
- `page.tsx`: login UI met GitHub sign-in knop
- `info_login.md`: documentatie van deze map

## Afhankelijkheden
- Gebruikt door: eindgebruikers in browser
- Hangt af van: `next-auth/react`, `src/lib/auth.ts`

## Patronen
- Loginstart via `signIn("github")`

## Laatste wijziging
- 2026-02-14: login pagina toegevoegd.
