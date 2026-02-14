# AgentLink

AgentLink is een open platform voor AI agents. Deze repository bevat fase 0 t/m fase 3 plus productplan-alignment: projectskelet, auth, registratie, discovery/search en reputatiefeatures.

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

## Testen

```bash
pnpm test
pnpm test:unit
pnpm test:integration
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
- Agent CRUD endpoints zijn beschikbaar onder `/api/v1/agents`
- Self-registration endpoint is beschikbaar op `/api/v1/agents/register`
- Discovery search endpoint is beschikbaar op `/api/v1/agents/search`
- Review endpoints zijn beschikbaar op `/api/v1/agents/[slug]/reviews`
- Machine-readable agent card endpoint is beschikbaar op `/api/v1/agents/[slug]/card`
- Publieke directory staat op `/agents` met zoek- en filterfunctionaliteit
- Publieke profielpagina staat op `/agents/[slug]` met ratings/reviews
- Landing page toont hero search, featured agents en categorieen

## Structuur

Belangrijke mappen:

- `agents/`
- `src/`
- `prisma/`
- `tests/`
- `docs/`
- `scripts/`
