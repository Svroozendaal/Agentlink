# 🌐 DISCOVERABILITY & AGENT DISCOVERY — Toevoeging aan CLAUDE.md

> **Plak deze sectie in CLAUDE.md, direct NA de sectie "Kernprincipes" en VOOR "AGENT SYSTEEM".**
> Dit zorgt ervoor dat Claude Code bij ELKE feature rekening houdt met vindbaarheid.

---

## Plak het volgende in CLAUDE.md:

```markdown
---

## 🌐 DISCOVERABILITY STRATEGIE

AgentLink moet vindbaar zijn voor twee totaal verschillende "gebruikers": **mensen** (via zoekmachines en social media) en **AI agents** (via protocols en machine-readable endpoints). Beide zijn even belangrijk en moeten bij ELKE feature meegenomen worden.

### Hoe MENSEN AgentLink vinden

**SEO & Web Standaarden — bij elke pagina:**
1. **Elke agent profielpagina is een SEO landing page** — Unieke title tag, meta description, Open Graph tags, structured data (JSON-LD)
2. **Sitemap.xml** — Automatisch gegenereerd, bevat alle publieke agent profielen
3. **robots.txt** — Correct geconfigureerd, verwijst naar sitemap
4. **Canonical URLs** — `https://agentlink.ai/agents/[slug]`
5. **Snelle laadtijd** — Server-side rendering (Next.js SSR/SSG), lazy loading images
6. **Structured Data (JSON-LD)** op elke agent pagina:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "WeatherBot Pro",
     "description": "...",
     "applicationCategory": "AI Agent",
     "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
     "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "123" }
   }
   ```

**Content strategie:**
- `/blog` — SEO-geoptimaliseerde artikelen over AI agents
- `/agents/[slug]` — Elke agent is een indexeerbare pagina
- `/categories/[category]` — Categoriepagina's voor long-tail zoekwoorden
- `/docs` — Publieke API documentatie (trekt developers aan)

### Hoe AI AGENTS AgentLink vinden

Dit is het unieke van AgentLink: het platform moet **machine-readable** zijn. AI agents moeten het platform kunnen ontdekken en gebruiken zonder menselijke tussenkomst.

**Standaard Discovery Endpoints:**

1. **`/.well-known/agent-card.json`** — AgentLink's eigen Agent Card
   ```json
   {
     "name": "AgentLink Registry",
     "description": "Open registry for AI agent discovery, profiles, and communication",
     "url": "https://agentlink.ai",
     "version": "1.0.0",
     "capabilities": ["agent-discovery", "agent-registration", "agent-messaging"],
     "api": {
       "base_url": "https://agentlink.ai/api/v1",
       "docs": "https://agentlink.ai/docs/api",
       "auth": ["api-key", "oauth2"]
     },
     "protocols": ["rest", "a2a-compatible"]
   }
   ```
   → Dit laat andere agents weten dat AgentLink ZELF een agent is die discovery aanbiedt.

2. **`/.well-known/agents.json`** — Overzicht van geregistreerde agents
   ```json
   {
     "registry": "agentlink",
     "total_agents": 1234,
     "search_endpoint": "https://agentlink.ai/api/v1/agents/search",
     "register_endpoint": "https://agentlink.ai/api/v1/agents/register",
     "documentation": "https://agentlink.ai/docs/api"
   }
   ```

3. **A2A-compatibele discovery** — `/api/v1/a2a/discover`
   Retourneert Agent Cards in het Google A2A format, zodat agents die A2A spreken AgentLink direct kunnen gebruiken.

4. **MCP Server** — AgentLink als MCP tool
   Een MCP server configuratie die AI assistenten (Claude, ChatGPT, etc.) in staat stelt om agents te zoeken via AgentLink als tool. Dit is een ENORME groeikanaal.

   ```json
   {
     "name": "agentlink",
     "description": "Search and discover AI agents",
     "tools": [
       {
         "name": "search_agents",
         "description": "Find AI agents by skills, category, or description",
         "parameters": { "query": "string", "skills": "string[]", "limit": "number" }
       },
       {
         "name": "get_agent",
         "description": "Get detailed profile of an AI agent",
         "parameters": { "slug": "string" }
       }
     ]
   }
   ```

5. **OpenAPI Spec** — `/api/v1/openapi.json`
   Volledige OpenAPI 3.1 specificatie van de API, zodat developer tools en agents de API automatisch kunnen gebruiken.

### Discovery Implementatie per Fase

| Fase | Menselijke Discovery | Agent Discovery |
|------|---------------------|-----------------|
| Fase 2 | SEO meta tags op profielpagina's, sitemap.xml | `/.well-known/agent-card.json` |
| Fase 3 | Structured data (JSON-LD), categoriepagina's | Search API, `/.well-known/agents.json`, OpenAPI spec |
| Fase 4 | Blog/content, social sharing | A2A-compatibele discovery endpoint |
| Fase 5 | - | MCP server configuratie |
| Fase 6 | Google Search Console, analytics | Registratie bij A2A directories, MCP registry |

### Regels voor Claude Code

Bij het bouwen van ELKE publieke pagina:
1. ✅ Voeg `<title>` en `<meta name="description">` toe (uniek per pagina)
2. ✅ Voeg Open Graph tags toe (`og:title`, `og:description`, `og:image`)
3. ✅ Voeg JSON-LD structured data toe waar relevant
4. ✅ Zorg dat de pagina server-side rendered is (geen client-only content)
5. ✅ Voeg de pagina toe aan de sitemap configuratie

Bij het bouwen van ELKE API endpoint:
1. ✅ Documenteer in de OpenAPI spec
2. ✅ Retourneer consistente, machine-parseable JSON
3. ✅ Voeg CORS headers toe voor cross-origin agent toegang
4. ✅ Voeg rate limit headers toe
```

---

## Waarom dit cruciaal is

Zonder deze sectie bouwt Claude Code een app die werkt maar die niemand vindt. Met deze sectie wordt bij ELKE pagina en ELKE endpoint automatisch nagedacht over:
- Kan Google dit indexeren?
- Kan een AI agent dit ontdekken?
- Zijn de juiste standaarden geïmplementeerd?

Het maakt het verschil tussen een technisch werkend product en een product dat daadwerkelijk gebruikt wordt.
