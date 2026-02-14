# AgentLink

AgentLink is een open platform voor AI agents. Deze repository bevat fase 0 en fase 1 van de codebase: projectskelet, database/auth foundation en API key management.

## Tech stack

- Next.js (App Router)
- TypeScript (strict)
- Prisma + PostgreSQL
- Tailwind CSS
- NextAuth
- Vitest + Playwright

## Starten

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

## Environment variabelen

Benodigd in `.env.local`:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID` of `GITHUB_CLIENT_ID`
- `GITHUB_SECRET` of `GITHUB_CLIENT_SECRET`

Optioneel voor migratieomgevingen met beperkte rechten:

- `SHADOW_DATABASE_URL`

## Huidige status

- Fase 0 skelet staat klaar
- Fase 1 database schema staat klaar
- GitHub OAuth via NextAuth is geconfigureerd
- API key endpoints zijn beschikbaar onder `/api/v1/auth/keys`

## Structuur

Belangrijke mappen:

- `agents/`
- `src/`
- `prisma/`
- `tests/`
- `docs/`
- `scripts/`
