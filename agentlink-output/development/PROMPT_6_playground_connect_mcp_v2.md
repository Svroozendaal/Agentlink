# 🔌 PROMPT 5: Agent Playground, Connect Protocol & MCP Integratie

> **Gebruik deze prompt nadat Prompt 1 t/m 4 volledig zijn afgerond.**
> Dit is de prompt die AgentLink transformeert van een "visitekaartjesplatform" naar een actief verbindingsplatform waar agents daadwerkelijk gevonden, uitgeprobeerd en ingezet worden.
>
> **Voorwaarde:** Prompts 1-4 zijn afgerond. De app is lanceerklaar met profielen, reviews, messaging, en polish.

---

## Prompt (kopieer ALLES hieronder naar Claude Code):

```
Lees CLAUDE.md en alle bestanden in agents/.

Je gaat drie met elkaar verbonden features bouwen die AgentLink transformeren van een passieve directory naar een ACTIEF verbindingsplatform:

1. **Agent Playground** — Gebruikers kunnen agents DIRECT testen vanuit AgentLink
2. **Connect Protocol** — Een gestandaardiseerde manier voor agents om andere agents functioneel aan te roepen VIA AgentLink
3. **MCP Server** — AgentLink als MCP tool zodat Claude, ChatGPT en andere AI's agents kunnen ontdekken en gebruiken

Dit is wat AgentLink echt uniek maakt. Een agent registreert zich niet alleen — hij wordt BEREIKBAAR en BRUIKBAAR via het platform.

Je hebt VOLLEDIGE AUTONOMIE. Commit na elke logische stap.

==========================================================================
STAP 1: DATABASE UITBREIDING
==========================================================================

Voeg toe aan prisma/schema.prisma:

### Model: AgentEndpoint
Eén agent kan meerdere endpoints hebben (bijv. een REST API en een A2A endpoint).
Dit vervangt het enkele endpointUrl veld op AgentProfile met een rijker model.

- id              String         @id @default(cuid())
- agentId         String                                  // → AgentProfile
- type            EndpointType                             // enum: REST, A2A, MCP, GRAPHQL, WEBSOCKET, CUSTOM
- url             String                                   // De URL van het endpoint
- method          String?        @default("POST")          // HTTP methode (voor REST)
- authType        EndpointAuthType @default(NONE)          // enum: NONE, API_KEY, BEARER, BASIC, CUSTOM
- authConfig      Json?                                    // Auth details (header naam, key location, etc.)
- requestSchema   Json?                                    // JSON Schema voor verwachte input
- responseSchema  Json?                                    // JSON Schema voor verwachte output
- healthStatus    EndpointHealth @default(UNKNOWN)         // enum: HEALTHY, DEGRADED, DOWN, UNKNOWN
- lastHealthCheck DateTime?
- description     String?                                  // "Stuur een weervraag in JSON format"
- isDefault       Boolean        @default(false)           // Primary endpoint voor deze agent
- createdAt       DateTime       @default(now())
- updatedAt       DateTime       @updatedAt

- agent           AgentProfile   @relation(fields: [agentId], references: [id])

- @@index([agentId])
- @@unique([agentId, url])

### Model: PlaygroundSession
Houdt bij wanneer iemand een agent test via de playground.

- id              String    @id @default(cuid())
- agentId         String                                   // → AgentProfile die getest wordt
- userId          String?                                  // → User (optioneel, kan anoniem)
- endpointId      String                                   // → AgentEndpoint dat gebruikt wordt
- requestBody     Json                                     // Wat de gebruiker stuurde
- responseBody    Json?                                    // Wat de agent antwoordde
- responseStatus  Int?                                     // HTTP status code
- responseTimeMs  Int?                                     // Response tijd in milliseconden
- error           String?                                  // Error message als het faalde
- createdAt       DateTime  @default(now())

- agent           AgentProfile @relation(fields: [agentId], references: [id])
- endpoint        AgentEndpoint @relation(fields: [endpointId], references: [id])

- @@index([agentId, createdAt])
- @@index([userId])

### Model: ConnectRequest
Wanneer Agent A via AgentLink een functioneel verzoek doet aan Agent B.

- id              String         @id @default(cuid())
- fromAgentId     String                                   // → AgentProfile (de vrager)
- toAgentId       String                                   // → AgentProfile (de uitvoerder)
- endpointId      String                                   // → AgentEndpoint dat aangeroepen wordt
- requestBody     Json                                     // Het verzoek
- responseBody    Json?                                    // Het antwoord
- responseStatus  Int?
- responseTimeMs  Int?
- status          ConnectStatus  @default(PENDING)         // enum: PENDING, SUCCESS, FAILED, TIMEOUT
- error           String?
- createdAt       DateTime       @default(now())

- fromAgent       AgentProfile   @relation("ConnectFrom", fields: [fromAgentId], references: [id])
- toAgent         AgentProfile   @relation("ConnectTo", fields: [toAgentId], references: [id])
- endpoint        AgentEndpoint  @relation(fields: [endpointId], references: [id])

- @@index([fromAgentId, createdAt])
- @@index([toAgentId, createdAt])

### Enums
- EndpointType: REST, A2A, MCP, GRAPHQL, WEBSOCKET, CUSTOM
- EndpointAuthType: NONE, API_KEY, BEARER, BASIC, CUSTOM
- EndpointHealth: HEALTHY, DEGRADED, DOWN, UNKNOWN
- ConnectStatus: PENDING, SUCCESS, FAILED, TIMEOUT

### Uitbreiding op AgentProfile
Voeg toe:
- endpoints          AgentEndpoint[]
- playgroundSessions PlaygroundSession[]
- connectsFrom       ConnectRequest[]  @relation("ConnectFrom")
- connectsTo         ConnectRequest[]  @relation("ConnectTo")
- playgroundEnabled  Boolean  @default(false)   // Agent-eigenaar bepaalt of playground actief is
- connectEnabled     Boolean  @default(false)    // Agent-eigenaar bepaalt of connect via proxy actief is

Het bestaande veld endpointUrl blijft bestaan als fallback / simpele weergave.
De AgentEndpoint tabel is de rijkere versie voor agents die playground/connect willen ondersteunen.

Draai migratie: npx prisma migrate dev --name add_playground_connect_endpoints

Update seed:
- Voeg 2-3 AgentEndpoints toe voor seed agents (met realistische requestSchema's)
- Zet playgroundEnabled=true op 3 seed agents
- Zet connectEnabled=true op 4 seed agents

Git: git add . && git commit -m "feat: database schema for endpoints, playground sessions, and connect requests"

==========================================================================
STAP 2: ENDPOINT MANAGEMENT
==========================================================================

### Service Laag (src/lib/services/endpoints.ts)

**addEndpoint(agentSlug, data, userId):**
1. Ownership check
2. Validatie: URL is geldig, type is ondersteund
3. Max 5 endpoints per agent
4. Als isDefault=true: zet alle andere endpoints van deze agent op isDefault=false
5. Maak AgentEndpoint aan
6. Return endpoint

**updateEndpoint(endpointId, data, userId):**
1. Ownership check (via agent)
2. Update velden
3. Return endpoint

**deleteEndpoint(endpointId, userId):**
1. Ownership check
2. Hard delete (endpoints zijn configuratie, geen user data)
3. Return success

**listEndpoints(agentSlug):**
1. Publiek (als agent is published)
2. Return endpoints (zonder authConfig secrets)

**getDefaultEndpoint(agentId):**
1. Zoek endpoint met isDefault=true
2. Fallback: eerste endpoint
3. Fallback: null (agent heeft geen endpoints)

### Health Checking (src/lib/services/health-check.ts)

**checkEndpointHealth(endpointId):**
1. Haal endpoint op
2. Stuur een lightweight request:
   - REST: HEAD of GET request naar de URL (timeout: 5 sec)
   - Andere types: simpele TCP connect check
3. Beoordeel:
   - 2xx response < 2 sec → HEALTHY
   - 2xx response 2-5 sec → DEGRADED
   - Geen response / error / timeout → DOWN
4. Update healthStatus en lastHealthCheck
5. Return status

BELANGRIJK: Health checks draaien NIET automatisch in de MVP.
Maak een API route die handmatig of via cron getriggerd kan worden.
Documenteer in backlog: automatische health checks via cron job.

**checkAllEndpointsHealth():**
- Roep checkEndpointHealth aan voor alle actieve endpoints
- Rate limit: max 1 keer per 5 minuten (voorkom abuse)
- Alleen admin kan dit triggeren

### Validatie Schemas (src/lib/validations/endpoint.ts)

**AddEndpointSchema:**
```
type:           enum EndpointType
url:            string, valid URL, HTTPS verplicht in productie
method:         string, optional, default "POST" (voor REST)
authType:       enum EndpointAuthType, optional, default NONE
authConfig:     JSON object, optional. Format afhankelijk van authType:
                - API_KEY: { headerName: "X-API-Key", key: "..." }
                - BEARER: { token: "..." }
                - BASIC: { username: "...", password: "..." }
                - CUSTOM: { headers: { "X-Custom": "..." } }
requestSchema:  JSON Schema object, optional
responseSchema: JSON Schema object, optional
description:    string, max 500, optional
isDefault:      boolean, optional
```

### API Routes

**POST   /api/v1/agents/[slug]/endpoints**       — Endpoint toevoegen
- Auth: verplicht, ownership
- Body: AddEndpointSchema
- Response 201: { data: endpoint }

**GET    /api/v1/agents/[slug]/endpoints**        — Endpoints ophalen
- Auth: niet verplicht (publiek, maar authConfig wordt weggelaten)
- Response 200: { data: endpoints[] }

**PATCH  /api/v1/agents/[slug]/endpoints/[id]**   — Endpoint bijwerken
- Auth: verplicht, ownership
- Response 200: { data: endpoint }

**DELETE /api/v1/agents/[slug]/endpoints/[id]**   — Endpoint verwijderen
- Auth: verplicht, ownership
- Response 200: { data: { message: "Endpoint removed" } }

**POST   /api/v1/admin/health-check**             — Health check triggeren
- Auth: admin only
- Response 200: { data: { checked: number, healthy: number, degraded: number, down: number } }

Git: git add . && git commit -m "feat: endpoint management with CRUD and health checking"

==========================================================================
STAP 3: AGENT PLAYGROUND
==========================================================================

De playground laat gebruikers een agent DIRECT testen vanuit AgentLink.
AgentLink fungeert als proxy: het stuurt het verzoek door naar de agent's endpoint
en toont het antwoord.

### Service Laag (src/lib/services/playground.ts)

**executePlaygroundRequest(agentSlug, requestBody, userId?):**
1. Check: is de agent published + approved?
2. Check: heeft de agent playgroundEnabled=true?
3. Check: heeft de agent minimaal 1 endpoint?
4. Haal het default endpoint op
5. Rate limit:
   - Ingelogde users: 20 requests per uur
   - Anoniem: 5 requests per uur per IP
6. Bouw het verzoek naar de agent:
   a. URL: endpoint.url
   b. Methode: endpoint.method (default POST)
   c. Headers: Content-Type: application/json
   d. Auth: voeg auth headers toe op basis van endpoint.authConfig
      - API_KEY: voeg header toe
      - BEARER: voeg Authorization: Bearer ... toe
      - BASIC: voeg Authorization: Basic ... toe
      - NONE: geen extra headers
   e. Body: de requestBody van de gebruiker
   f. Timeout: 30 seconden
7. Stuur het request (via fetch)
8. Vang het antwoord op:
   - Succes: sla responseBody, responseStatus, responseTimeMs op
   - Error: sla error message op
   - Timeout: sla "Request timed out after 30 seconds" op
9. Sla PlaygroundSession op (voor analytics)
10. Return { response, status, timeMs, error }

SECURITY OVERWEGINGEN:
- AgentLink is een PROXY. De agent's endpoint ontvangt het request.
- authConfig bevat secrets (API keys etc.) — deze worden NOOIT naar de browser gestuurd
- De playground request gaat: Browser → AgentLink Server → Agent Endpoint
  Dit is belangrijk: de browser praat NOOIT direct met de agent (CORS, security)
- Valideer de requestBody tegen requestSchema als die er is
- Sanitize de response voordat het naar de browser gaat (strip potentieel schadelijke content)
- Log GEEN gevoelige request/response data in PlaygroundSession als de agent
  dat in authConfig aangeeft (voeg een "logResponses" boolean toe aan AgentEndpoint, default true)

**getPlaygroundStats(agentSlug, userId?):**
- Als eigenaar: totaal requests, gemiddelde response tijd, success rate
- Als admin: zelfde + per-user breakdown
- Return stats

### Validatie Schemas (src/lib/validations/playground.ts)

**PlaygroundRequestSchema:**
```
body:   JSON object of string (het verzoek aan de agent)
```
Bewust simpel — de requestSchema van het endpoint valideert de inhoud.

### API Routes

**POST /api/v1/agents/[slug]/playground**        — Test een agent
- Auth: optioneel (anoniem mag, met lagere rate limit)
- Body: PlaygroundRequestSchema
- Rate limit: 20/uur (auth) of 5/uur (anon)
- Response 200: 
  ```json
  {
    "data": {
      "response": { ... },     // Het antwoord van de agent
      "status": 200,            // HTTP status van de agent
      "timeMs": 342,            // Response tijd
      "error": null              // Of een error string
    }
  }
  ```

**GET  /api/v1/agents/[slug]/playground/stats**  — Playground statistieken
- Auth: verplicht, ownership of admin
- Response 200: { data: { totalRequests, avgResponseMs, successRate, last24h: {...} } }

### Playground UI (src/app/agents/[slug]/playground/page.tsx)

Een eenvoudige maar functionele test-interface:

**Layout:**
- Linkerkant (of boven op mobiel): Request builder
- Rechterkant (of onder op mobiel): Response viewer

**Request Builder:**
- Endpoint selector dropdown (als agent meerdere endpoints heeft)
- Als requestSchema beschikbaar is:
  - Render automatisch een formulier op basis van het JSON Schema
  - Velden met labels, types, verplicht/optioneel
  - Voorbeeld: schema zegt { "query": "string", "language": "string" } → twee input velden
- Als GEEN requestSchema:
  - JSON textarea waar de gebruiker vrij kan typen
  - Placeholder met een voorbeeld
- "Verstuur" knop

**Response Viewer:**
- Status badge (200 groen, 4xx geel, 5xx rood)
- Response tijd
- Response body (JSON formatter met syntax highlighting)
  - Gebruik een simpele <pre> met Tailwind styling, geen zware library nodig
- Error state als het faalde
- Loading state tijdens het wachten

**Extra features:**
- "Kopieer als cURL" knop — genereert een curl commando voor dit verzoek
  (ZONDER auth secrets — die vervangt met een placeholder)
- Recente requests (laatste 5 van deze user, opgeslagen in PlaygroundSession)
  - Klikbaar om opnieuw te versturen
- Link naar agent's documentationUrl als die er is

**Visbaarheid:**
- Alleen tonen als agent.playgroundEnabled === true
- Op de agent profielpagina: een "Probeer deze agent" knop/tab
  die linkt naar /agents/[slug]/playground
- Als playground niet actief: toon de endpointUrl en documentationUrl als fallback
  met tekst "Bezoek de documentatie om deze agent te gebruiken"

### Agent Profiel Pagina Update
Voeg toe aan de bestaande profielpagina (src/app/agents/[slug]/page.tsx):

1. **"Probeer deze agent" knop** — Prominent, naast de bestaande CTAs
   - Alleen als playgroundEnabled=true
   - Linkt naar /agents/[slug]/playground

2. **Endpoints sectie** — Toon de beschikbare endpoints:
   - Per endpoint: type badge (REST, A2A, etc.), URL, health status indicator
   - Health status: 🟢 Healthy, 🟡 Degraded, 🔴 Down, ⚪ Unknown
   - Als connectEnabled=true: "Gebruik via API" badge

3. **Connection info** — Hoe je deze agent kunt gebruiken:
   - Code snippet: curl of JavaScript voorbeeld
   - Link naar playground
   - Link naar documentatie

### Dashboard: Endpoint & Playground beheer
Voeg toe aan de agent edit pagina:

**Endpoints tab:**
- Lijst van endpoints met type, URL, health status
- "Endpoint toevoegen" formulier: type, URL, auth, request/response schema
- Edit/delete per endpoint
- Toggle: isDefault

**Playground tab:**
- Toggle: playgroundEnabled aan/uit
- Als aan: toon statistieken (totaal tests, avg response time, success rate)
- Recente playground sessies (tabel: datum, user/anon, status, response time)

**Connect tab:**
- Toggle: connectEnabled aan/uit
- Als aan: toon connect statistieken
- Recente connect requests (tabel: van agent, status, response time)

Git: git add . && git commit -m "feat: agent playground with proxy, request builder, and response viewer"

==========================================================================
STAP 4: CONNECT PROTOCOL — Agent-to-Agent Functionele Requests
==========================================================================

Het Connect Protocol laat agents functionele requests sturen naar andere agents
VIA AgentLink. AgentLink fungeert als broker/proxy.

Verschil met Messaging (Prompt 3):
- Messaging = conversatie (tekst, asynchroon, menselijk leesbaar)
- Connect = functionele API calls (JSON, synchroon, machine-to-machine)

### Service Laag (src/lib/services/connect.ts)

**executeConnectRequest(fromAgentSlug, toAgentSlug, requestBody, apiKeyUserId):**
1. Check: is fromAgent van de ingelogde user? (ownership via API key)
2. Check: is toAgent published + approved?
3. Check: heeft toAgent connectEnabled=true?
4. Check: heeft toAgent minimaal 1 endpoint?
5. Haal het default endpoint op van toAgent
6. Rate limit: 50 requests per uur per API key
7. Valideer requestBody tegen endpoint.requestSchema (als beschikbaar)
8. Proxy het request (zelfde logica als playground):
   - Bouw request met auth headers
   - Timeout: 30 seconden
   - Stuur naar agent endpoint
9. Sla ConnectRequest op (voor analytics en audit)
10. Maak ActivityEvent aan (type: AGENT_CONNECTED — voeg toe aan ActivityType enum)
11. Trigger webhook op toAgent: event "connect.request"
12. Return { response, status, timeMs, error }

VERSCHIL MET PLAYGROUND:
- Playground: gebruiker → AgentLink → agent (menselijke interactie)
- Connect: agent → AgentLink → agent (machine-to-machine)
- Connect vereist ALTIJD een API key (geen anonieme requests)
- Connect logt de fromAgent zodat de ontvanger weet WIE er contact opneemt

### Connect Response Format
Het response naar de aanroepende agent:
```json
{
  "data": {
    "connectId": "clx123...",           // ID van dit connect request
    "from": "weatherbot-pro",           // Slug van de aanvrager
    "to": "flightbot",                  // Slug van de ontvanger
    "response": {                       // Het antwoord van de ontvanger
      "flights": [...]
    },
    "status": 200,
    "timeMs": 450,
    "error": null
  }
}
```

### Validatie Schemas (src/lib/validations/connect.ts)

**ConnectRequestSchema:**
```
fromAgentSlug:   string (verplicht — welke van jouw agents doet het verzoek)
body:            JSON object (het verzoek)
endpointId:      string, optional (specifiek endpoint, anders default)
```

### API Routes

**POST /api/v1/agents/[slug]/connect**           — Functioneel verzoek aan een agent
- De [slug] in de URL is de ONTVANGER (toAgent)
- Auth: API key verplicht
- Body: ConnectRequestSchema
- Rate limit: 50/uur per API key
- Response 200: Connect response format (zie boven)
- Response 403: als connectEnabled=false
- Response 502: als de agent niet bereikbaar is
- Response 504: als de agent niet op tijd antwoordt

**GET  /api/v1/agents/[slug]/connect/stats**     — Connect statistieken
- Auth: verplicht, ownership of admin
- Response 200: { data: { received: { total, success, failed }, sent: { total, success, failed }, avgResponseMs } }

**GET  /api/v1/agents/[slug]/connect/log**       — Connect request log
- Auth: verplicht, ownership
- Query: { direction: "sent" | "received" | "all", page, limit }
- Response 200: { data: connectRequests[], meta }

### Webhook Event Toevoegen
Voeg toe aan webhook events (uit Prompt 3):
- `connect.request` — Een andere agent heeft een functioneel verzoek gestuurd

### ActivityType Uitbreiden
Voeg toe: AGENT_CONNECTED

Git: git add . && git commit -m "feat: connect protocol for agent-to-agent functional requests via proxy"

==========================================================================
STAP 5: MCP SERVER — AgentLink als Tool voor AI Assistenten
==========================================================================

Dit is de GROEIMOTOR. Een MCP server maakt AgentLink beschikbaar als tool
voor Claude, ChatGPT, en andere AI assistenten. Wanneer een gebruiker aan Claude
vraagt "zoek een AI agent die weer kan voorspellen", kan Claude AgentLink
gebruiken om dat te doen.

### MCP Server Implementatie (src/lib/mcp/server.ts)

Bouw een MCP-compatibele HTTP endpoint die de volgende tools aanbiedt:

**Tool 1: search_agents**
```json
{
  "name": "search_agents",
  "description": "Search the AgentLink registry to find AI agents by skills, category, or description. Returns a list of matching agents with their profiles.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query (name, description, or skills)" },
      "skills": { "type": "array", "items": { "type": "string" }, "description": "Filter by specific skills" },
      "category": { "type": "string", "description": "Filter by category" },
      "protocols": { "type": "array", "items": { "type": "string" }, "description": "Filter by supported protocols (rest, a2a, mcp, etc.)" },
      "limit": { "type": "number", "description": "Max results (default 5, max 20)" }
    },
    "required": []
  }
}
```
Implementatie: roep de bestaande searchAgents service aan, format resultaten als leesbare JSON.

**Tool 2: get_agent_profile**
```json
{
  "name": "get_agent_profile",
  "description": "Get the full profile of an AI agent on AgentLink, including description, skills, endpoints, ratings, and how to connect.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "The agent's unique slug identifier" }
    },
    "required": ["slug"]
  }
}
```
Implementatie: roep getAgentBySlug aan, inclusief endpoints, rating, endorsements.

**Tool 3: try_agent**
```json
{
  "name": "try_agent",
  "description": "Send a test request to an AI agent via the AgentLink playground. The agent must have playground enabled.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "The agent's slug" },
      "request": { "type": "object", "description": "The request body to send to the agent" }
    },
    "required": ["slug", "request"]
  }
}
```
Implementatie: roep executePlaygroundRequest aan. BELANGRIJK: gebruik een speciale
"mcp-playground" rate limit bucket met hogere limiet (50/uur) omdat MCP requests
via AI assistenten komen en waardevol zijn.

**Tool 4: get_agent_reviews**
```json
{
  "name": "get_agent_reviews",
  "description": "Get reviews and ratings for an AI agent on AgentLink.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "The agent's slug" },
      "limit": { "type": "number", "description": "Max reviews to return (default 5)" }
    },
    "required": ["slug"]
  }
}
```

### MCP HTTP Endpoint

**POST /api/v1/mcp** — MCP tool execution endpoint
- Dit endpoint volgt het MCP HTTP transport protocol
- Request:
  ```json
  {
    "method": "tools/call",
    "params": {
      "name": "search_agents",
      "arguments": { "query": "weather forecast", "limit": 5 }
    }
  }
  ```
- Response:
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Found 3 agents matching 'weather forecast':\n\n1. **WeatherBot Pro** (⭐ 4.7)..."
      }
    ]
  }
  ```

**GET /api/v1/mcp** — MCP server info / tool listing
- Retourneert de beschikbare tools en hun schemas
- Dit is wat een MCP client gebruikt om te ontdekken wat AgentLink kan

### MCP Server Configuratiebestand

Maak een publiek beschikbaar configuratiebestand:

**public/mcp-config.json:**
```json
{
  "name": "agentlink",
  "description": "Search, discover, and try AI agents from the AgentLink registry",
  "version": "1.0.0",
  "url": "https://agentlink.ai/api/v1/mcp",
  "transport": "http",
  "tools": [
    // ... alle 4 tools met schemas
  ]
}
```

Dit bestand kan door gebruikers worden toegevoegd aan hun MCP client configuratie.

### MCP Documentatie Pagina (src/app/docs/mcp/page.tsx)

Een publieke pagina die uitlegt hoe je AgentLink als MCP tool toevoegt:

1. **Voor Claude Desktop / Claude Code:**
   ```json
   // claude_desktop_config.json of .claude/settings.json
   {
     "mcpServers": {
       "agentlink": {
         "url": "https://agentlink.ai/api/v1/mcp"
       }
     }
   }
   ```

2. **Beschikbare tools:** lijst met beschrijving en voorbeelden
3. **Voorbeeld gesprekken:**
   - "Zoek een AI agent die Nederlandse teksten kan vertalen"
   - "Wat is de rating van WeatherBot Pro?"
   - "Test de DataAnalyst Bot met deze data"

### Rate Limiting voor MCP
- MCP requests krijgen een aparte rate limit bucket: "mcp"
- search_agents: 100/uur per IP
- get_agent_profile: 200/uur per IP
- try_agent: 50/uur per IP (om agents niet te overbelasten)
- get_agent_reviews: 200/uur per IP

### Logging
- Log alle MCP tool calls in AuditLog met action "mcp.[tool_name]"
- Metadata: welke tool, welke parameters, response time

Git: git add . && git commit -m "feat: MCP server with search, profile, try, and review tools"

==========================================================================
STAP 6: DISCOVERY UPDATES
==========================================================================

### Update /.well-known/agent-card.json
Voeg de MCP server info toe:
```json
{
  "name": "AgentLink Registry",
  "capabilities": ["agent-discovery", "agent-registration", "agent-messaging", "agent-playground", "agent-connect", "mcp-server"],
  "mcp": {
    "url": "https://agentlink.ai/api/v1/mcp",
    "config": "https://agentlink.ai/mcp-config.json"
  }
}
```

### Update /.well-known/agents.json
Voeg endpoint informatie toe:
```json
{
  "total_agents": 1234,
  "agents_with_playground": 456,
  "agents_with_connect": 567,
  "playground_endpoint": "https://agentlink.ai/api/v1/agents/{slug}/playground",
  "connect_endpoint": "https://agentlink.ai/api/v1/agents/{slug}/connect",
  "mcp_endpoint": "https://agentlink.ai/api/v1/mcp"
}
```

### Update OpenAPI Spec
Voeg alle nieuwe endpoints toe aan /api/v1/openapi.json

### Update Agent Profiel JSON-LD
Voeg "interactionStatistic" toe aan de structured data:
```json
{
  "@type": "SoftwareApplication",
  "name": "WeatherBot Pro",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/UseAction",
    "userInteractionCount": 1234
  }
}
```

Git: git add . && git commit -m "feat: updated discovery endpoints with playground, connect, and MCP info"

==========================================================================
STAP 7: UI INTEGRATIE
==========================================================================

### Agent Profiel Pagina — Volledige Update
De profielpagina wordt nu het centrale punt. Reorganiseer de bestaande content in tabs:

**Tab 1: Overzicht (default)**
- Beschrijving, skills, endorsements
- Key stats: rating, reviews count, playground tests count
- "Probeer deze agent" CTA (als playground enabled)
- Endpoints met health status

**Tab 2: Reviews**
- Bestaande reviews sectie (uit Prompt 2)

**Tab 3: Playground (als enabled)**
- De playground interface (uit Stap 3)
- Of een bericht "Playground is niet beschikbaar voor deze agent" met link naar docs/endpoint

**Tab 4: API / Connect**
- Hoe je deze agent via API kunt gebruiken
- Endpoints lijst met details
- Code snippets: curl, JavaScript, Python
- "Connect via AgentLink" uitleg met voorbeeld

**Tab 5: Activity**
- De agent activity feed (uit Prompt 2)

### Agent Directory — Nieuwe Filters
Voeg filters toe:
- "Playground beschikbaar" checkbox
- "Connect beschikbaar" checkbox
- "Endpoint type" multi-select (REST, A2A, MCP, etc.)

### Dashboard — Stats Update
Voeg toe aan het dashboard:
- Per agent: playground test count, connect request count
- Grafiek/getallen: tests deze week, connects deze week

### Admin — Playground & Connect Overzicht
Voeg toe aan admin dashboard:
- Totaal playground sessies (vandaag, deze week)
- Totaal connect requests (vandaag, deze week)
- Agents met meeste playground traffic (top 5)
- Agents met meeste connect traffic (top 5)

Git: git add . && git commit -m "feat: UI integration for playground, connect, and MCP across all pages"

==========================================================================
STAP 8: TESTS & DOCUMENTATIE
==========================================================================

### Tests
Unit tests:
- AddEndpointSchema validatie
- PlaygroundRequestSchema validatie
- ConnectRequestSchema validatie
- Health check status bepaling (healthy/degraded/down)

Integration tests:
- Endpoint CRUD: toevoegen, updaten, verwijderen
- Playground: request naar seed agent (mock de externe call)
- Playground: rate limiting werkt
- Playground: agent met playgroundEnabled=false → 403
- Connect: request van agent A naar agent B (mock externe call)
- Connect: agent met connectEnabled=false → 403
- Connect: ownership check (kan niet namens andermans agent connecten)
- MCP: tool listing endpoint retourneert alle tools
- MCP: search_agents retourneert resultaten
- MCP: get_agent_profile retourneert profiel

BELANGRIJK voor testen: Mock de externe HTTP calls (naar agent endpoints).
Gebruik een test helper die fetch mockt en een vooraf bepaald antwoord retourneert.
Agents endpoints zijn extern — we willen ze niet echt aanroepen in tests.

### Documentatie
1. **docs/api-spec.md** — Alle nieuwe endpoints
2. **docs/playground.md** — Hoe de playground werkt voor agent-eigenaren
3. **docs/connect.md** — Het connect protocol voor agent developers
4. **docs/mcp.md** — MCP integratie documentatie (kan ook op de publieke docs pagina)
5. Update alle info_*.md bestanden
6. Update docs/backlog.md

### API Documentatie Pagina Update
Voeg secties toe:
- **Playground API** — Hoe je agents kunt testen
- **Connect Protocol** — Hoe agents elkaar functioneel aanroepen
- **MCP Integratie** — Hoe je AgentLink toevoegt als MCP tool
- **Endpoints Configuratie** — Hoe je je agent's endpoints instelt

### Verificatie Checklist
□ Endpoint toevoegen aan agent werkt
□ Playground: request naar agent werkt (met mock)
□ Playground: rate limiting werkt
□ Playground: disabled agents tonen juiste melding
□ Connect: agent-to-agent request werkt (met mock)
□ Connect: ownership check werkt
□ MCP: tool listing werkt
□ MCP: search tool retourneert resultaten
□ MCP: try tool proxied naar playground
□ Health check endpoint werkt (admin only)
□ /.well-known bestanden zijn bijgewerkt
□ OpenAPI spec is bijgewerkt
□ Agent profiel toont tabs correct
□ Dashboard toont playground/connect stats
□ Alle nieuwe pagina's hebben meta tags
□ pnpm run build slaagt

Git: git add . && git commit -m "docs: playground, connect, and MCP documentation and tests"
git tag v1.1.0

==========================================================================
SAMENVATTING
==========================================================================

Geef na afloop:
1. NIEUWE ENDPOINTS — Alle playground, connect, MCP, en endpoint management routes
2. NIEUWE MODELLEN — AgentEndpoint, PlaygroundSession, ConnectRequest
3. AGENT INTERACTIE FLOW — Hoe een agent nu bereikbaar is via 4 wegen:
   a. Direct (endpointUrl op profiel)
   b. Playground (browser → AgentLink → agent)
   c. Connect (agent → AgentLink → agent)
   d. MCP (AI assistent → AgentLink → agent)
4. MCP SETUP — Hoe een gebruiker AgentLink toevoegt als MCP tool
5. SECURITY — Proxy overwegingen, rate limits, auth handling
6. ISSUES — Problemen en workarounds
7. BACKLOG — Automatische health checks, WebSocket streaming, A2A protocol support
```
