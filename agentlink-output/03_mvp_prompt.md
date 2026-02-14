# 🎯 MVP PROMPT — De Eerste Functionele Prompt

> **Dit is de prompt die je aan Claude Code geeft om de volledige MVP te bouwen.**
> Het combineert de essentiële onderdelen van Fase 0 t/m 3 in één gestroomlijnde build.
>
> **Voorwaarden voordat je deze prompt gebruikt:**
> 1. CLAUDE.md staat in de root (inclusief de Discoverability sectie)
> 2. agents/ map staat in de root met alle 8 agent bestanden
> 3. Je hebt een lege map klaar voor het project
> 4. Je hebt een PostgreSQL database URL klaar (lokaal of Railway)
> 5. Je hebt een GitHub OAuth App aangemaakt (Client ID + Secret)

---

## De Prompt (kopieer alles hieronder):

```
Lees CLAUDE.md en alle bestanden in agents/. Je gaat nu de complete MVP van AgentLink bouwen.

De MVP is het minimale product waarmee we live kunnen gaan:
- Agents kunnen zichzelf registreren (via web en API)
- Mensen kunnen agents zoeken en profielen bekijken
- De app is vindbaar voor zoekmachines EN voor AI agents
- Er is een werkende auth flow

Dit is een VOLLEDIGE build. Werk nauwkeurig en volg alle conventies uit CLAUDE.md.
Vraag NIET om toestemming tussendoor — je hebt volledige autonomie voor deze MVP build.
Commit na elke logische stap.

---

## STAP 1: Project Setup (Fase 0)

1. Initialiseer het project:
   npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
   (Behoud CLAUDE.md en agents/)

2. Installeer alle dependencies in één keer:
   pnpm add @prisma/client next-auth @auth/prisma-adapter zod slugify
   pnpm add -D prisma vitest @testing-library/react

3. Initialiseer Prisma: npx prisma init --datasource-provider postgresql

4. Maak de volledige mapstructuur aan zoals in CLAUDE.md.

5. Maak alle info_*.md bestanden aan (minimale versie, wordt later aangevuld).

6. Configureer:
   - tsconfig.json: strict mode aan
   - next.config.ts: basis config
   - .env.example met alle benodigde variabelen
   - .gitignore

7. Maak basis utility bestanden:
   - src/lib/db.ts (Prisma singleton)
   - src/lib/utils.ts (cn helper voor Tailwind class merging)

8. Git: git init && git add . && git commit -m "chore: project skeleton"

---

## STAP 2: Database Schema

Maak prisma/schema.prisma met deze modellen:

**User:**
- id (cuid), email (unique), name, image, role (enum: USER, PRO, ADMIN)
- emailVerified (DateTime?), createdAt, updatedAt
- Relaties: accounts, sessions, agentProfiles, apiKeys

**Account & Session:** Standaard NextAuth modellen voor Prisma adapter.

**VerificationToken:** Standaard NextAuth model.

**ApiKey:**
- id (cuid), name, keyHash, keyPrefix (voor UI identificatie)
- userId → User, scopes (String[])
- lastUsedAt (DateTime?), expiresAt (DateTime?), isActive (default true)
- createdAt

**AgentProfile:**
- id (cuid), slug (unique), name, description (kort), longDescription (uitgebreid, optioneel)
- ownerId → User
- skills (String[]), tags (String[]), category (String, optioneel)
- protocols (String[]) — bijv. ["rest", "a2a", "mcp"]
- endpointUrl (optioneel), documentationUrl (optioneel), websiteUrl (optioneel)
- pricingModel (enum: FREE, FREEMIUM, PAID, ENTERPRISE), pricingDetails (optioneel)
- isPublished (default false), isVerified (default false)
- logoUrl (optioneel), metadata (Json, optioneel)
- createdAt, updatedAt

Indexen: slug, ownerId, isPublished, skills (als Prisma dat ondersteunt), category.

Draai de migratie: npx prisma migrate dev --name initial_schema

Maak een seed bestand (prisma/seed.ts) met:
- 2 test users
- 8 realistische voorbeeld-agents met diverse skills, protocols en categorieën
  Voorbeelden: WeatherBot Pro, CodeReview AI, TranslateBot NL, LegalDoc Assistant,
  TravelPlanner Agent, DataAnalyst Bot, SecurityAudit Agent, ContentWriter AI

Configureer seed command in package.json en draai: npx prisma db seed

Git: git add . && git commit -m "feat: database schema with users, agents, and API keys"

---

## STAP 3: Authenticatie

Configureer NextAuth.js:

src/lib/auth.ts:
- Prisma adapter
- GitHub OAuth provider
- Session callback: voeg user.id en user.role toe aan session
- JWT callback: voeg id en role toe aan token

src/app/api/auth/[...nextauth]/route.ts:
- Export GET en POST handlers

src/lib/auth/api-keys.ts:
- generateApiKey(): retourneert { key, hash, prefix }
- validateApiKey(key: string): retourneert User | null
- Hash met SHA-256

src/lib/auth/get-auth-context.ts:
- Check Bearer token (API key) → dan session
- Retourneert { user, method } of null

API routes voor API keys:
- POST /api/v1/auth/keys — Genereer key (auth required, retourneert key EENMALIG)
- GET /api/v1/auth/keys — Lijst eigen keys (alleen prefix, naam, lastUsed)
- DELETE /api/v1/auth/keys/[id] — Revoke key

Login pagina (src/app/(auth)/login/page.tsx):
- Simpel, clean design
- "Inloggen met GitHub" knop (shadcn Button)
- AgentLink logo/naam bovenaan
- Redirect naar dashboard na login

Git: git add . && git commit -m "feat: auth system with GitHub OAuth and API keys"

---

## STAP 4: Agent CRUD API

Service laag (src/lib/services/agents.ts):
- createAgent(data, userId): maakt agent + genereert slug
- getAgentBySlug(slug): haalt agent op (publiek)
- listAgents(params): lijst met paginatie en filters
- updateAgent(slug, data, userId): update (ownership check)
- deleteAgent(slug, userId): soft delete of unpublish
- searchAgents(query, filters): full-text search

Validatie schemas (src/lib/validations/agent.ts):
- CreateAgentSchema, UpdateAgentSchema, ListAgentsQuerySchema, SearchQuerySchema

API Routes:
- POST   /api/v1/agents — Aanmaken (auth)
- GET    /api/v1/agents — Lijst (publiek, paginatie)
- GET    /api/v1/agents/[slug] — Detail (publiek)
- PATCH  /api/v1/agents/[slug] — Update (eigenaar)
- DELETE /api/v1/agents/[slug] — Delete (eigenaar)
- GET    /api/v1/agents/search — Zoeken (publiek)
- POST   /api/v1/agents/register — Self-registration (API key auth)

Elke route volgt het patroon uit agents/api.md: Zod validatie, auth check, service call, gestructureerde response.

Git: git add . && git commit -m "feat: agent CRUD API with search and self-registration"

---

## STAP 5: Frontend — Publieke Pagina's

**Root Layout (src/app/layout.tsx):**
- Inter font
- Basis HTML met lang="nl"
- Navbar component met: logo, "Agents" link, "Login" / user menu
- Footer met links

**Landing Page (src/app/page.tsx):**
- Hero: "Ontdek de perfecte AI Agent" + zoekbalk
- Grid met 6 featured agents (uit database)
- Sectie: "Hoe het werkt" (3 stappen: Registreer → Profiel → Connect)
- CTA: "Registreer je agent" knop
- Server Component, data fetching via service laag
- SEO: title, description, OG tags

**Agent Directory (src/app/agents/page.tsx):**
- Zoekbalk bovenaan
- Filter sidebar: skills (meest voorkomende), protocols, pricing, verified
- Results grid met AgentCard componenten
- Paginatie onderaan
- URL-based state (search params)
- Loading skeletons via Suspense
- SEO: title, description

**Agent Profiel (src/app/agents/[slug]/page.tsx):**
- Grote header met agent naam, verificatie badge, logo placeholder
- Beschrijving sectie
- Skills als badges
- Info sidebar: protocols, pricing, links, endpoint
- "Contact" of "Gebruik deze agent" CTA
- JSON-LD structured data (SoftwareApplication schema)
- SEO: dynamische title, description, OG tags
- 404 via notFound() als agent niet bestaat
- generateMetadata() voor dynamische meta tags

**Componenten om te bouwen:**
- src/components/layout/Navbar.tsx
- src/components/layout/Footer.tsx
- src/components/agents/AgentCard.tsx
- src/components/agents/AgentGrid.tsx
- src/components/agents/AgentSearchBar.tsx
- src/components/agents/AgentFilters.tsx
- src/components/agents/AgentProfile.tsx (detail view)
- src/components/ui/ → Installeer shadcn componenten: button, input, badge, card, select, skeleton

Git: git add . && git commit -m "feat: landing page, agent directory, and profile pages"

---

## STAP 6: Frontend — Dashboard

**Dashboard Layout (src/app/(dashboard)/layout.tsx):**
- Auth check: redirect naar login als niet ingelogd
- Sidebar navigatie: Mijn Agents, API Keys, Instellingen

**Mijn Agents (src/app/(dashboard)/dashboard/agents/page.tsx):**
- Lijst van eigen agents met status (draft/published)
- "Nieuwe Agent" knop
- Per agent: naam, slug, status, edit/delete acties

**Agent Aanmaken (src/app/(dashboard)/dashboard/agents/new/page.tsx):**
- Formulier met React Hook Form + Zod
- Velden: naam, beschrijving, uitgebreide beschrijving, skills (tag input), protocols (checkboxes), endpoint URL, pricing model, website URL
- Preview van het profiel (optioneel, nice-to-have)
- Submit → redirect naar profiel pagina
- Error handling met inline foutmeldingen

**Agent Bewerken (src/app/(dashboard)/dashboard/agents/[slug]/edit/page.tsx):**
- Zelfde formulier als aanmaken, maar pre-filled
- Publish/unpublish toggle

**API Keys (src/app/(dashboard)/dashboard/keys/page.tsx):**
- Lijst van eigen keys (prefix, naam, laatst gebruikt)
- "Nieuwe Key" knop → genereert key en toont EENMALIG
- Revoke knop per key

Git: git add . && git commit -m "feat: dashboard with agent management and API keys"

---

## STAP 7: Discovery & Machine-Readability

Implementeer de discovery endpoints uit de CLAUDE.md Discoverability sectie:

**/.well-known/agent-card.json:**
- Statisch bestand of API route
- AgentLink's eigen Agent Card

**/.well-known/agents.json:**
- Dynamisch: totaal aantal agents, links naar API endpoints

**/sitemap.xml:**
- Dynamisch gegenereerd via Next.js App Router sitemap functie
- Bevat: homepage, /agents, alle /agents/[slug] pagina's, /docs

**/robots.txt:**
- Via Next.js, verwijst naar sitemap

**/api/v1/openapi.json:**
- Handmatig onderhouden OpenAPI spec (of gegenereerd)
- Beschrijft alle publieke endpoints

**CORS headers:**
- Configureer in next.config.ts of middleware
- Sta cross-origin requests toe op /api/v1/* endpoints

Git: git add . && git commit -m "feat: discovery endpoints, sitemap, robots.txt, and OpenAPI spec"

---

## STAP 8: Documentatie & Verificatie

1. Update ALLE info_*.md bestanden met actuele inhoud

2. Maak docs/api-spec.md compleet met alle endpoints

3. Update README.md:
   - Actuele beschrijving
   - Setup instructies (hoe local te draaien)
   - Omgevingsvariabelen uitleg
   - Beschikbare endpoints

4. Maak docs/decisions.md aan met alle technische keuzes tot nu toe

5. Verificatie checklist:
   □ pnpm run dev start zonder errors
   □ pnpm run build slaagt
   □ Database migratie werkt op een schone database
   □ Seed data laadt correct
   □ Login via GitHub werkt
   □ Agent aanmaken via web werkt
   □ Agent zoeken werkt
   □ Agent profiel pagina laadt
   □ API key aanmaken werkt
   □ API request met key werkt
   □ /.well-known/agent-card.json retourneert valid JSON
   □ /sitemap.xml bevat alle agent pagina's
   □ Alle info_*.md bestanden bestaan en zijn ingevuld

6. Git: git add . && git commit -m "docs: complete documentation and verification"

---

## STAP 9: Final Review

Voer de volledige review uit via agents/review.md:
- Security checklist
- Code consistentie check
- Performance check
- Documentatie completeness

Log alle bevindingen in docs/backlog.md als "post-MVP" items.

Git: git add . && git commit -m "chore: MVP review complete, backlog updated"

---

Geef na afloop een gedetailleerde samenvatting:
1. Welke bestanden zijn aangemaakt (gegroepeerd per categorie)
2. Welke API endpoints zijn beschikbaar
3. Welke pagina's zijn beschikbaar
4. Of er issues of workarounds zijn
5. Welke .env variabelen de gebruiker moet invullen
6. Eerste stappen om de app lokaal te testen
7. Items in de backlog voor post-MVP
```

---

## Wat de MVP oplevert

Na het uitvoeren van deze prompt heb je een werkende app met:

| Feature | Status |
|---------|--------|
| GitHub OAuth login | ✅ Werkend |
| API key systeem | ✅ Werkend |
| Agent registratie (web) | ✅ Werkend |
| Agent registratie (API) | ✅ Werkend |
| Agent profielpagina | ✅ Werkend met SEO |
| Agent directory + zoeken | ✅ Werkend |
| Landing page | ✅ Werkend |
| Dashboard | ✅ Werkend |
| Machine-readable discovery | ✅ /.well-known/, OpenAPI, sitemap |
| Documentatie | ✅ Compleet |

## Wat de MVP NIET heeft (post-MVP)

- Ratings & reviews
- Agent-to-agent messaging
- Endorsements & social features
- MCP server integratie
- A2A protocol endpoint
- Email notificaties
- Betalingssysteem
- Admin panel

## Geschatte tijd

Met Claude Code: **2-4 uur** actieve sessie (afhankelijk van netwerk en setup).

## Na de MVP

De volgende prompts (Fase 4+) voegen toe:
- Social layer (ratings, reviews)
- Agent-to-agent communicatie
- MCP server (zodat Claude, ChatGPT etc. AgentLink als tool kunnen gebruiken)
- A2A protocol support
- Enterprise features
