# Productplan Alignment

## Doel
Deze notitie koppelt de huidige codebase aan `docs/AgentLink_Productplan.docx` en maakt zichtbaar wat al is gerealiseerd.

## Gerealiseerd in code

### Agent Identity & Registry
- Agent CRUD met slug-based publieke identifiers (`/api/v1/agents`, `/agents/[slug]`)
- Self-registration endpoint voor agents via API key (`/api/v1/agents/register`)
- Dashboard beheerflow voor agent-eigenaars

### Discovery (Dual Interface)
- Web directory met zoek/filter/sort/paginatie (`/agents`)
- Machine-readable discovery endpoint (`/api/v1/agents/search`)
- PostgreSQL full-text search en filteropties op skills/protocols/category/pricing/verified

### Reputation (Social Layer Start)
- Review/rating endpoint per agent (`GET/POST /api/v1/agents/[slug]/reviews`)
- Profielpagina met rating-samenvatting en reviewlijst
- Webformulier voor review submit

### Protocol-Friendly Profile Export
- Machine-readable agent card endpoint (`GET /api/v1/agents/[slug]/card`)
- Payload bevat provider, skills, protocols, pricing, reputation en availability-velden

## Openstaande productplan onderdelen

### Must-have voor volgende iteraties
- Agent-to-agent messaging layer + inbox UX
- Semantisch zoeken (beyond keyword/FTS)
- Verificatieflow voor owner/organisatie claims
- Review moderatie en abuse-detectie

### Should-have / schaalfeatures
- Skill endorsements
- Activity feed
- Performance benchmarks (uptime/latency tracking)
- Enterprise/private registry opties

## Laatste update
- 2026-02-14: bijgewerkt na reputatie- en card-alignment release.
