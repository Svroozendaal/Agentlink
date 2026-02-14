# 👤 FASE 2: Agent Registration & Profiles

> **Gebruik deze prompt nadat Fase 1 succesvol is afgerond.**

---

## Prompt voor Claude Code:

```
Lees CLAUDE.md en de relevante agents (api.md, frontend.md, database.md, docs.md, testing.md).
Voer Fase 2 uit: Agent Registration & Profiles.

Dit is de fase waarin het platform functioneel wordt: gebruikers kunnen agents registreren en profielen bekijken.

### Stap 1: Agent CRUD API (volg agents/api.md)

Bouw de volgende API endpoints:

POST   /api/v1/agents          — Agent aanmaken (auth required)
GET    /api/v1/agents          — Lijst van agents (publiek, met paginatie)
GET    /api/v1/agents/[slug]   — Agent detail (publiek)
PATCH  /api/v1/agents/[slug]   — Agent bijwerken (eigenaar only)
DELETE /api/v1/agents/[slug]   — Agent verwijderen / unpublishen (eigenaar only)

Elke route volgt het standaard patroon uit agents/api.md:
- Zod validatie op alle inputs
- Gestructureerde error responses
- Auth checks waar nodig (via getAuthContext)
- Business logic in src/lib/services/agents.ts (niet in de route handler)

Maak ook de Zod schemas:
- src/lib/validations/agent.ts — CreateAgentSchema, UpdateAgentSchema, ListAgentsQuerySchema

Slug generatie: automatisch uit naam (slugify), met uniciteit check.

### Stap 2: Agent Self-Registration API Endpoint

Maak een speciaal endpoint voor agents die zichzelf registreren:

POST /api/v1/agents/register — Agent Card ontvangen en profiel aanmaken
- Accepteert een JSON body in het AgentLink profiel format
- Vereist API key auth
- Valideert de agent card data
- Maakt automatisch een profiel aan gekoppeld aan de API key eigenaar
- Retourneert het aangemaakte profiel met slug

Dit is het endpoint dat een AI agent kan aanroepen om zichzelf te registreren.

### Stap 3: Agent Profiel Pagina (volg agents/frontend.md)

Bouw de publieke agent profielpagina:

src/app/agents/[slug]/page.tsx (Server Component):
- Haalt agent data op via de service laag (niet via API call)
- Toont: naam, beschrijving, skills (als badges), protocols, pricing, links
- Metadata (og:title, description) voor SEO
- 404 pagina als agent niet bestaat
- Responsive layout (mobile-first)
- Loading skeleton via Suspense

Design richtlijnen:
- Card-based layout voor de profiel info
- Skills als gekleurde badges
- Sidebar met quick-info (pricing, protocols, links)
- Grote header met agent naam en logo placeholder

### Stap 4: Agent Registratie Formulier

Bouw het formulier voor het aanmaken van een agent via de web interface:

src/app/(dashboard)/dashboard/agents/new/page.tsx:
- React Hook Form + Zod validatie (hergebruik schemas uit stap 1)
- Velden: naam, beschrijving, uitgebreide beschrijving (textarea), skills (tag input), protocols (multi-select), endpoint URL, pricing model, website URL
- Submit via Server Action of API call
- Success: redirect naar het nieuwe agent profiel
- Error: inline foutmeldingen
- Auth required (redirect naar login als niet ingelogd)

src/app/(dashboard)/dashboard/agents/page.tsx:
- Overzicht van eigen agents
- Link naar "Nieuwe agent" formulier
- Per agent: naam, status (published/draft), acties (edit, delete)

### Stap 5: Tests (volg agents/testing.md)

Schrijf minimaal:
- Unit tests voor alle Zod schemas
- Integration tests voor alle API routes (happy path + error cases)
- Test de slug generatie edge cases

### Stap 6: Documentatie & Review

- Update alle info_*.md bestanden
- Update docs/api-spec.md met alle nieuwe endpoints (volledig format)
- Voer de review checklist uit (agents/review.md)
- Git commit: "feat: agent registration, CRUD API, and profile pages"

Geef een samenvatting van alle endpoints, pagina's en componenten die gebouwd zijn.
```

---

## Na Fase 2 heb je:
- ✅ Volledige Agent CRUD API
- ✅ Agent self-registration endpoint
- ✅ Publieke agent profielpagina
- ✅ Dashboard met eigen agents overzicht
- ✅ Agent registratie formulier
- ✅ Tests en documentatie

## Volgende: Fase 3 — Discovery & Search
