# 🗄️ FASE 1: Database & Auth Foundation

> **Gebruik deze prompt nadat Fase 0 succesvol is afgerond.**
> Kopieer de tekst hieronder en plak het in Claude Code.

---

## Prompt voor Claude Code:

```
Lees CLAUDE.md en de relevante agents (database.md, auth.md, api.md, docs.md).
Voer Fase 1 uit: Database & Auth Foundation.

Dit is de eerste functionele fase. Bouw de database structuur en authenticatie zodat we in volgende fasen features kunnen bouwen op een solide basis.

### Stap 1: Database Schema (volg agents/database.md)

Maak het Prisma schema met de volgende modellen:

**User** — Platform gebruikers
- id, email (unique), name, image, role (enum: USER, PRO, ADMIN)
- emailVerified, createdAt, updatedAt
- Relaties: accounts (NextAuth), sessions, agentProfiles, apiKeys, reviews

**Account** — NextAuth OAuth accounts (standaard NextAuth schema)

**Session** — NextAuth sessions (standaard NextAuth schema)

**ApiKey** — API keys voor de publieke API
- id, name, keyHash (hashed key), keyPrefix (eerste 10 chars voor identificatie)
- userId (relatie naar User), scopes (String[]), lastUsedAt, expiresAt
- isActive, createdAt

**AgentProfile** — Agent profielen (de kern van het platform)
- id, slug (unique), name, description, longDescription
- ownerId (relatie naar User)
- skills (String[]), tags (String[]), category
- protocols (String[]) — bijv. ["a2a", "rest", "mcp"]
- endpointUrl, documentationUrl, websiteUrl
- pricingModel (enum: FREE, FREEMIUM, PAID, ENTERPRISE)
- pricingDetails (String, optioneel)
- isPublished (boolean, default false), isVerified (boolean, default false)
- logoUrl, bannerUrl
- metadata (Json, voor flexibele extra data)
- createdAt, updatedAt

Voeg de juiste indexen toe (slug, ownerId, skills, isPublished).
Maak een seed bestand met 5 realistische voorbeeld-agents.
Draai de migratie: npx prisma migrate dev --name initial_schema

### Stap 2: Auth Setup (volg agents/auth.md)

Configureer NextAuth.js:
- Prisma adapter voor session opslag
- GitHub OAuth provider (credentials via .env)
- Email/password is NIET nodig in v1 (alleen OAuth)
- Session strategy: database
- Voeg userId toe aan de session via callbacks

Maak de auth configuratie in src/lib/auth.ts
Maak de auth API route in src/app/api/auth/[...nextauth]/route.ts
Maak een simpele login pagina (src/app/(auth)/login/page.tsx) met "Login met GitHub" knop

### Stap 3: API Key Systeem (volg agents/auth.md)

Maak het API key systeem:
- src/lib/auth/api-keys.ts — functies voor: generateApiKey, validateApiKey, revokeApiKey
- Keys worden gehashed opgeslagen (SHA-256)
- API route: POST /api/v1/auth/keys — Maak nieuwe API key (vereist sessie)
- API route: GET /api/v1/auth/keys — Lijst van eigen keys (alleen prefix + metadata)
- API route: DELETE /api/v1/auth/keys/[id] — Revoke een key

### Stap 4: Auth Helper (volg agents/api.md)

Maak een gedeelde auth helper:
- src/lib/auth/get-auth-context.ts
- Checkt eerst Bearer token (API key), dan sessie
- Retourneert { user, method } of null
- Wordt gebruikt in alle toekomstige API routes

### Stap 5: Verificatie

Test handmatig of via scripts:
- [ ] Database migratie is succesvol
- [ ] Seed data is geladen (5 agents zichtbaar in database)
- [ ] NextAuth login flow werkt (GitHub OAuth)
- [ ] API key aanmaken werkt
- [ ] API key validatie werkt
- [ ] Ongeautoriseerde requests worden correct afgewezen

### Stap 6: Documentatie (volg agents/docs.md)

Update ALLE relevante info_*.md bestanden.
Update docs/api-spec.md met de nieuwe auth endpoints.
Update docs/decisions.md met relevante keuzes.
Log eventuele TODO's in docs/backlog.md.

### Stap 7: Git

git add .
git commit -m "feat: database schema, auth system, and API key management"

Geef na afloop een samenvatting van wat er gebouwd is, welke endpoints beschikbaar zijn, en of er issues zijn.

BELANGRIJK: 
- Update .env.example met alle nieuwe variabelen
- Geef duidelijk aan welke .env.local variabelen de gebruiker zelf moet invullen
- Bouw GEEN UI voor agent profielen of zoeken — dat komt in Fase 2
```

---

## Na Fase 1 heb je:
- ✅ Werkend database schema met alle kernmodellen
- ✅ Seed data met realistische voorbeelden
- ✅ GitHub OAuth login
- ✅ API key systeem (genereren, valideren, revoken)
- ✅ Auth helper voor API routes
- ✅ Bijgewerkte documentatie

## Volgende: Fase 2 — Agent Registration & Profiles
