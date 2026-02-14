# CLAUDE.md — AgentLink Master Prompt

> **Dit bestand wordt automatisch gelezen door Claude Code bij elke sessie.**
> Het definieert de architectuur, agents, workflows en regels voor het hele project.

---

## 🎯 PROJECT OVERZICHT

**AgentLink** is een open platform ("LinkedIn voor AI Agents") waar AI chatbots en agents:
- Zichzelf registreren met een gestructureerd profiel
- Gevonden worden door mensen en andere agents
- Met elkaar communiceren via een gestandaardiseerde messaging layer
- Reputatie opbouwen via reviews, ratings en endorsements

### Tech Stack
| Laag | Technologie | Reden |
|------|------------|-------|
| Framework | **Next.js 14+ (App Router)** | Full-stack in één codebase, server components, API routes |
| Taal | **TypeScript (strict mode)** | Type safety, betere DX, minder bugs |
| Database | **PostgreSQL** | Robuust, schaalbaar, JSON support voor flexibele agent data |
| ORM | **Prisma** | Type-safe queries, migraties, seeding |
| Auth | **NextAuth.js (Auth.js v5)** | Flexibel, OAuth providers, API key support |
| Styling | **Tailwind CSS + shadcn/ui** | Snel, consistent, professioneel |
| Search | **PostgreSQL full-text search** → later Elasticsearch | Start simpel, schaal wanneer nodig |
| Cache | **In-memory** → later Redis | Start simpel, schaal wanneer nodig |
| Testing | **Vitest + Playwright** | Snel, modern, E2E support |
| Hosting | **Railway.app** (primary) | Goedkoop ($5/mo start), auto-scaling, PostgreSQL inbegrepen |
| Alt hosting | Vercel + Supabase | Gratis tier mogelijk, maar split deployment |

### Kernprincipes
1. **Start simpel, schaal later** — Geen premature optimization. Begin met PostgreSQL voor alles.
2. **Type safety everywhere** — Strict TypeScript, Zod validation op alle boundaries.
3. **Convention over configuration** — Vaste mapstructuur, naamconventies, patronen.
4. **Documentatie als code** — Elke map heeft een `info_[naam].md`. Code zonder docs is incompleet.
5. **Iteratief bouwen** — Elke feature doorloopt: schema → API → UI → test → docs.

---

## 🤖 AGENT SYSTEEM

Dit project gebruikt een **virtueel agent systeem**. Agents zijn GEEN aparte programma's — het zijn **gestructureerde instructiesets** die Claude Code volgt bij specifieke taken. Elke agent heeft een eigen instructiebestand in `/agents/`.

### Hoe agents werken
- Bij elke taak identificeert Claude Code welke agent(s) relevant zijn
- Claude leest de agent-instructies uit `/agents/[agent].md`
- Claude volgt de regels, patronen en checklists van die agent
- Na afronding voert Claude de **self-improvement check** uit (zie onder)

### Actieve Agents

| Agent | Bestand | Domein |
|-------|---------|--------|
| 🏗️ **Architect** | `agents/architect.md` | Projectstructuur, mapindeling, dependencies, tech decisions |
| 📊 **Database** | `agents/database.md` | Prisma schema, migraties, queries, seeding |
| 🔌 **API** | `agents/api.md` | API routes, validatie, error handling, OpenAPI spec |
| 🎨 **Frontend** | `agents/frontend.md` | React components, pages, layouts, UX patterns |
| 🔐 **Auth** | `agents/auth.md` | Authenticatie, autorisatie, API keys, sessies |
| 📝 **Docs** | `agents/docs.md` | Documentatie, info_*.md bestanden, README, changelogs |
| 🧪 **Testing** | `agents/testing.md` | Unit tests, integration tests, E2E tests |
| 🛡️ **Review** | `agents/review.md` | Code review, quality checks, security audit |

### Self-Improvement Loop

**Na ELKE taak** voert Claude de volgende checks uit:

```
SELF-IMPROVEMENT CHECKLIST:
□ Is de documentatie bijgewerkt? (info_*.md bestanden)
□ Zijn er patronen die herhaald worden en geabstraheerd kunnen worden?
□ Zijn er edge cases die niet afgevangen zijn?
□ Is de code consistent met bestaande conventies?
□ Kan de agent-instructie verbeterd worden op basis van wat ik net geleerd heb?
□ Zijn er TODO's of FIXME's die gelogd moeten worden in /docs/backlog.md?
```

Als een agent-instructie verbeterd kan worden, stelt Claude dit voor aan de gebruiker voordat het wordt aangepast. Agent-instructies worden NOOIT stilzwijgend gewijzigd.

---

## 📁 PROJECT STRUCTUUR

```
agentlink/
├── CLAUDE.md                          # ← Dit bestand (masterprompt)
├── README.md                          # Project README
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── seed.ts                        # Seed data
│   └── migrations/                    # Prisma migraties
│   └── info_prisma.md                 # Docs over database laag
├── agents/                            # Agent instructiebestanden
│   ├── architect.md
│   ├── database.md
│   ├── api.md
│   ├── frontend.md
│   ├── auth.md
│   ├── docs.md
│   ├── testing.md
│   ├── review.md
│   └── info_agents.md                 # Uitleg over het agent systeem
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── (auth)/                    # Auth routes (login, register)
│   │   ├── (dashboard)/               # Dashboard routes
│   │   ├── agents/                    # Agent profielpagina's
│   │   │   ├── [id]/page.tsx          # Agent detail pagina
│   │   │   └── page.tsx               # Agent directory/zoeken
│   │   ├── api/                       # API routes
│   │   │   ├── v1/                    # Versioned public API
│   │   │   │   ├── agents/            # Agent CRUD endpoints
│   │   │   │   ├── search/            # Search endpoints
│   │   │   │   ├── messages/          # Messaging endpoints
│   │   │   │   └── info_api_v1.md
│   │   │   └── auth/                  # Auth endpoints
│   │   └── info_app.md
│   ├── components/                    # React components
│   │   ├── ui/                        # shadcn/ui base components
│   │   ├── layout/                    # Header, footer, sidebar
│   │   ├── agents/                    # Agent-specifieke components
│   │   ├── forms/                     # Formulieren
│   │   └── info_components.md
│   ├── lib/                           # Gedeelde utilities
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── auth.ts                    # Auth configuratie
│   │   ├── validations/               # Zod schemas
│   │   ├── utils/                     # Helper functies
│   │   └── info_lib.md
│   ├── types/                         # TypeScript type definities
│   │   ├── agent.ts                   # Agent types
│   │   ├── api.ts                     # API request/response types
│   │   └── info_types.md
│   └── styles/                        # Global styles
│       └── globals.css
├── tests/                             # Test bestanden
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── info_tests.md
├── docs/                              # Project documentatie
│   ├── backlog.md                     # Feature backlog & TODO's
│   ├── decisions.md                   # Architectuur beslissingen (ADR's)
│   ├── api-spec.md                    # API documentatie
│   └── info_docs.md
├── scripts/                           # Utility scripts
│   ├── setup.sh                       # Project setup script
│   └── info_scripts.md
└── public/                            # Statische assets
    └── info_public.md
```

---

## 📏 CONVENTIES & REGELS

### Naamgeving
| Type | Conventie | Voorbeeld |
|------|-----------|-----------|
| Bestanden (components) | PascalCase | `AgentCard.tsx` |
| Bestanden (utils/hooks) | camelCase | `useAgentSearch.ts` |
| Bestanden (routes) | kebab-case (mappen) | `api/v1/agents/` |
| Variabelen | camelCase | `agentProfile` |
| Types/Interfaces | PascalCase, prefix-vrij | `Agent`, `AgentProfile` |
| Database tabellen | snake_case (Prisma convention) | `agent_profiles` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL` |
| CSS classes | Tailwind utilities | `className="flex items-center"` |
| Documentatie | `info_[mapnaam].md` | `info_components.md` |

### Code Patronen

**API Routes:**
```typescript
// Altijd dit patroon volgen:
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({ /* ... */ });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);
    // ... business logic
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Components:**
```typescript
// Altijd dit patroon volgen:
interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (/* JSX */);
}
```

**Database queries:**
```typescript
// Altijd via lib/db.ts, nooit direct Prisma importeren in routes
import { db } from '@/lib/db';
```

### Git Conventies
```
feat: nieuwe feature beschrijving
fix: bug fix beschrijving
docs: documentatie update
refactor: code refactor zonder functionaliteit wijziging
test: tests toevoegen of aanpassen
chore: dependencies, config, etc.
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Fase-gebaseerd ontwikkelen

Het project wordt in **fasen** gebouwd. Elke fase heeft duidelijke doelen en wordt pas afgesloten als alles werkt en gedocumenteerd is.

```
FASE 0: Skelet (huidige fase)
├── Projectstructuur aanmaken
├── Dependencies installeren
├── Agent instructies schrijven
├── Alle info_*.md bestanden aanmaken
├── Basis configuratie (TypeScript, Tailwind, Prisma)
└── Verificatie: project start zonder errors

FASE 1: Database & Auth Foundation
├── Prisma schema voor Users en Agents
├── Database migraties
├── NextAuth setup (email + OAuth)
├── API key systeem
└── Verificatie: kan inloggen en API key genereren

FASE 2: Agent Registration & Profiles
├── Agent CRUD API (create, read, update, delete)
├── Agent profiel schema (Zod validatie)
├── Publieke agent profielpagina
├── Agent registratie formulier
└── Verificatie: kan agent aanmaken en profiel bekijken

FASE 3: Discovery & Search
├── Zoekfunctionaliteit (naam, skills, tags)
├── Filter & sorteer opties
├── Agent directory pagina
├── API discovery endpoint
└── Verificatie: kan agents zoeken via web en API

FASE 4: Social Layer
├── Ratings & reviews systeem
├── Skill endorsements
├── Activity feed
└── Verificatie: kan review plaatsen en feed bekijken

FASE 5: Agent-to-Agent Communication
├── Messaging API
├── Berichtenbox in dashboard
├── Agent-to-agent protocol
└── Verificatie: agents kunnen berichten uitwisselen

FASE 6: Polish & Launch
├── Landing page
├── Onboarding flow
├── Performance optimalisatie
├── Security audit
└── Verificatie: klaar voor productie
```

### Per-Feature Workflow
Bij het bouwen van elke feature, volg ALTIJD deze volgorde:

```
1. PLAN    → Beschrijf wat je gaat bouwen in docs/decisions.md
2. SCHEMA  → Database wijzigingen (als nodig) via Database Agent
3. TYPES   → TypeScript types definieren via Architect Agent
4. API     → Backend endpoint(s) bouwen via API Agent
5. UI      → Frontend component(s) bouwen via Frontend Agent
6. TEST    → Tests schrijven via Testing Agent
7. DOCS    → Documentatie updaten via Docs Agent
8. REVIEW  → Quality check via Review Agent
```

---

## 🔑 TOESTEMMINGEN & AUTONOMIE

### Claude Code MAG zelfstandig:
- Bestanden aanmaken, bewerken en verwijderen binnen de projectmap
- Dependencies installeren via npm/pnpm
- Prisma migraties aanmaken en uitvoeren (dev)
- Tests uitvoeren
- Documentatie bijwerken
- Kleine refactors uitvoeren die de functionaliteit niet wijzigen
- info_*.md bestanden bijwerken na wijzigingen
- Backlog items toevoegen aan docs/backlog.md
- Git commits maken met conventionele commit messages

### Claude Code MOET EERST VRAGEN bij:
- Grote architectuurwijzigingen (nieuwe dependency, structuurwijziging)
- Database schema wijzigingen die data verlies kunnen veroorzaken
- Verwijderen van bestaande features of bestanden met code
- Wijzigingen aan agent instructies (agents/*.md)
- Wijzigingen aan dit CLAUDE.md bestand
- Deployment of productie-gerelateerde acties
- Keuzes die significante kosten met zich meebrengen

### Environment & Secrets
- `.env.local` wordt NOOIT gecommit (staat in .gitignore)
- Alle secrets worden via environment variabelen beheerd
- Claude Code mag een `.env.example` aanmaken en bijwerken

---

## 🚨 KWALITEITSREGELS

### Code Kwaliteit
1. **Geen `any` types** — Altijd concrete types of `unknown` met type narrowing
2. **Geen console.log in productie** — Gebruik een logger utility
3. **Geen hardcoded strings** — Gebruik constants of environment variabelen
4. **Error handling overal** — Elke async functie heeft try/catch
5. **Zod validatie op elke API boundary** — Request body, query params, route params
6. **Geen dead code** — Verwijder ongebruikte imports, variabelen, functies

### Documentatie Kwaliteit
1. **Elke map heeft een `info_[naam].md`** — Geen uitzonderingen
2. **Elke info_*.md bevat minimaal**: Doel van de map, overzicht van bestanden, afhankelijkheden, veelvoorkomende patronen
3. **docs/decisions.md** wordt bijgewerkt bij elke architectuurbeslissing
4. **docs/backlog.md** wordt bijgewerkt bij elke ontdekte TODO/verbetering

### Testing Kwaliteit
1. **Elke API route heeft minimaal 1 test** — Happy path
2. **Elke utility functie heeft unit tests** — Edge cases incluis
3. **Kritieke flows hebben E2E tests** — Registratie, login, agent aanmaken

---

## 📋 EERSTE OPDRACHT: SKELET GENEREREN

Wanneer je dit bestand voor het eerst leest in een nieuw project, voer dan de **Skelet Generator** uit. Dit is de eerste en enige taak van Fase 0.

### Instructies voor Fase 0:

```
1. Initialiseer het project:
   - npx create-next-app@latest agentlink --typescript --tailwind --app --src-dir --import-alias "@/*"
   - Installeer dependencies: prisma, @prisma/client, zod, next-auth, @auth/prisma-adapter
   - Installeer dev dependencies: vitest, @testing-library/react, playwright
   - Initialiseer Prisma: npx prisma init

2. Maak de mapstructuur aan (zie PROJECT STRUCTUUR hierboven)

3. Maak alle agent instructiebestanden aan (zie agents/ map)

4. Maak alle info_*.md bestanden aan met initiële content

5. Maak basis configuratie bestanden aan:
   - tsconfig.json (strict mode)
   - tailwind.config.ts
   - next.config.ts
   - .env.example
   - .gitignore

6. Maak basis bestanden aan:
   - src/lib/db.ts (Prisma singleton)
   - src/app/layout.tsx (root layout met basis styling)
   - src/app/page.tsx (placeholder landing page)
   - prisma/schema.prisma (leeg schema met datasource config)

7. Verificatie:
   - npm run dev start zonder errors
   - npm run build slaagt
   - Alle info_*.md bestanden bestaan en hebben content
   - Alle agent bestanden bestaan en hebben content

8. Git:
   - git init
   - git add .
   - git commit -m "chore: initial project skeleton with agent system"
```

---

## 🧠 CONTEXT VOOR CLAUDE CODE

### Over de gebruiker
- Ervaren genoeg om technische keuzes te begrijpen
- Vertrouwt op Claude Code voor implementatie
- Wil stapsgewijs bouwen, niet alles tegelijk
- Waardeert goede documentatie en uitleg
- Stelt technische vragen wanneer nodig

### Over het project
- Dit is een **echt product** dat naar productie gaat
- Kwaliteit > snelheid
- Het moet goed schalen maar start klein
- De codebase moet begrijpelijk zijn voor een gemiddelde developer
- Open-source mindset: schrijf code alsof anderen het gaan lezen

### Communicatiestijl
- Leg uit WAAROM je iets doet, niet alleen WAT
- Stel vragen als er meerdere goede opties zijn
- Geef een korte samenvatting na elke voltooide taak
- Wees eerlijk als iets beter kan of als je twijfelt
