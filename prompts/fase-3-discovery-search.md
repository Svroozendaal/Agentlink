# 🔍 FASE 3: Discovery & Search

> **Gebruik deze prompt nadat Fase 2 succesvol is afgerond.**

---

## Prompt voor Claude Code:

```
Lees CLAUDE.md en de relevante agents (api.md, frontend.md, database.md, docs.md).
Voer Fase 3 uit: Discovery & Search.

Dit is de fase die het platform waardevol maakt: agents worden vindbaar.

### Stap 1: Search Infrastructure

Bouw zoekfunctionaliteit met PostgreSQL full-text search:

src/lib/services/search.ts:
- Full-text search op agent naam + beschrijving (met ts_vector/ts_query via Prisma raw queries als nodig, of Prisma contains als startpunt)
- Filter op: skills, protocols, category, pricingModel, isVerified
- Sorteer op: relevantie, rating, nieuwste, naam
- Paginatie (cursor-based of offset)
- Retourneer ook totaal aantal resultaten

Overweeg later Elasticsearch, maar start met PostgreSQL. Log deze beslissing in docs/decisions.md.

### Stap 2: Search API

GET /api/v1/agents/search — Zoek agents
Query params:
- q (search query)
- skills (comma-separated)
- protocols (comma-separated)  
- category
- pricing (FREE, FREEMIUM, PAID, ENTERPRISE)
- verified (boolean)
- sort (relevance, rating, newest, name)
- page, limit

Dit endpoint is ook de machine-readable discovery endpoint.
Een agent kan dit aanroepen: GET /api/v1/agents/search?skills=weather,forecast&protocols=a2a

### Stap 3: Agent Directory Pagina

src/app/agents/page.tsx — De hoofdpagina van het platform:
- Zoekbalk bovenaan (prominent, LinkedIn-style)
- Filter sidebar (of collapsible op mobiel): skills, protocols, pricing, verified
- Resultaten als cards grid (hergebruik AgentCard component)
- URL-based state (zoekterm en filters in URL params voor deelbare links)
- Lege state als er geen resultaten zijn
- Loading skeletons
- Responsive: grid op desktop, lijst op mobiel

Componenten om te bouwen:
- src/components/agents/AgentSearchBar.tsx — Zoekbalk met autocomplete (later)
- src/components/agents/AgentFilters.tsx — Filter opties
- src/components/agents/AgentGrid.tsx — Grid van AgentCards
- src/components/agents/AgentCard.tsx — Compacte agent kaart (naam, beschrijving, skills, rating)

### Stap 4: Homepage Update

Update src/app/page.tsx van placeholder naar een echte landing page:
- Hero sectie: "Ontdek de perfecte AI agent" met zoekbalk
- Featured agents (top 6 op basis van meest recent of seed data)
- Categorieën sectie (grid van categorie kaarten)
- CTA: "Registreer je agent"
- Simpel maar professioneel (shadcn/ui componenten)

### Stap 5: Tests

- Unit tests voor de search service
- Integration tests voor het search endpoint
- Test edge cases: lege query, speciale tekens, geen resultaten

### Stap 6: Documentatie & Review

- Update alle relevante docs
- Update API spec met search endpoint
- Review checklist
- Git commit: "feat: agent discovery, search, directory page, and landing page"
```

---

## Na Fase 3 heb je:
- ✅ Full-text search op agents
- ✅ Filter en sorteer functionaliteit
- ✅ Agent directory pagina met zoeken en filters
- ✅ Echte landing page
- ✅ Machine-readable discovery API

## Volgende fasen (nog te schrijven):
- **Fase 4:** Social Layer (ratings, reviews, endorsements)
- **Fase 5:** Agent-to-Agent Communication
- **Fase 6:** Polish & Launch Readiness
