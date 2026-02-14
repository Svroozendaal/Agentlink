# Decisions

## ADR-0001: Tech stack keuze

- Datum: 2026-02-14
- Status: Accepted

### Context
AgentLink start als nieuw platform en heeft een complete full-stack basis nodig met lage opstartcomplexiteit.

### Keuze
We gebruiken Next.js + TypeScript + Prisma + PostgreSQL + Railway.

### Reden
- Full-stack in een codebase
- Type safety end-to-end
- Goedkoop starten en later schaalbaar
- Heldere developer ervaring met goede tooling

### Consequenties
- Backend en frontend deployment zijn aan elkaar gekoppeld
- Prisma bepaalt de database workflow
- PostgreSQL full-text search is initieel voldoende

## ADR-0002: Auth strategie in fase 1

- Datum: 2026-02-14
- Status: Accepted

### Context
Fase 1 vraagt om een veilige maar compacte authbasis voor webgebruikers en API-consumers.

### Keuze
- NextAuth met Prisma adapter voor websessies (database strategy)
- GitHub OAuth als enige loginprovider in v1
- API keys als tweede authmethode voor publieke API integraties
- API keys gehashed opslaan met SHA-256

### Reden
- OAuth-only versnelt implementatie en reduceert wachtwoordcomplexiteit
- Database sessies geven server-side controle over actieve sessies
- API keys ondersteunen agent-to-agent en scriptintegraties

### Consequenties
- Geen email/password login in v1
- Key plaintext is alleen zichtbaar bij creatie
- Rate limiting en audit logging moeten in vervolgstap worden toegevoegd

## ADR-0003: Shadow database configuratie voor migraties

- Datum: 2026-02-14
- Status: Accepted

### Context
`prisma migrate dev` heeft in sommige omgevingen expliciet een shadow database URL nodig.

### Keuze
`SHADOW_DATABASE_URL` wordt ondersteund in `prisma/schema.prisma` voor stabiele lokale migraties.

### Reden
- Betrouwbaardere migratieflow bij beperkte database permissies
- Minder setup-frictie voor contributors

### Consequenties
- Voor lokale migratie kan extra env var nodig zijn
- Productie-runtime gebruikt nog steeds primair `DATABASE_URL`

## ADR-0004: Agent businesslogica via service-laag

- Datum: 2026-02-14
- Status: Accepted

### Context
Fase 2 introduceert meerdere agent endpoints met gedeelde regels (slug uniciteit, ownership checks, publicatiegedrag).

### Keuze
Agentlogica staat in `src/lib/services/agents.ts`, terwijl route handlers enkel validatie/auth/HTTP-responses afhandelen.

### Reden
- Minder duplicatie tussen routes en serverpagina's
- Eenduidige foutafhandeling via `AgentServiceError`
- Beter testbaar domeingedrag

### Consequenties
- Services moeten expliciet gedocumenteerd en getest blijven
- Route handlers blijven dun en voorspelbaar

## ADR-0005: Slug als primaire publieke identifier

- Datum: 2026-02-14
- Status: Accepted

### Context
Publieke agentprofielen moeten stabiele, leesbare URLs hebben.

### Keuze
Agent detailroutes en CRUD mutaties gebruiken `slug` i.p.v. interne id.
Slug wordt automatisch gegenereerd uit naam en uniek gemaakt met suffixes.

### Reden
- SEO-vriendelijkere URLs
- Betere UX in publieke links
- Geen directe blootstelling van interne IDs

### Consequenties
- Naamwijzigingen kunnen slugwijziging veroorzaken
- Slug generatie edge cases moeten getest blijven

## ADR-0006: Discovery search via PostgreSQL full-text search

- Datum: 2026-02-14
- Status: Accepted

### Context
Fase 3 vereist machine-readable discovery met zoekterm, filters, sortering en paginatie.
We willen eerst snel waarde leveren zonder extra infra-complexiteit.

### Keuze
Discovery draait op PostgreSQL met full-text search (`to_tsvector` + `plainto_tsquery`) en SQL-aggregatie voor rating-sortering.
Endpoint: `GET /api/v1/agents/search`.

### Reden
- Past op bestaande Prisma + PostgreSQL stack
- Geen extra beheer van Elasticsearch/OpenSearch in vroege fase
- Voldoende voor v1 zoekkwaliteit met filter/sort combinaties

### Consequenties
- Zoekrelevantie is basic en niet semantisch
- Voor hogere schaal of advanced ranking kan later dedicated search infra nodig zijn
- Backlog bevat vervolgstappen voor autocomplete en ranking tuning

## ADR-0007: Productplan alignment via review-upsert en card export

- Datum: 2026-02-14
- Status: Accepted

### Context
Het productplan positioneert AgentLink als combinatie van directory + reputatiesysteem + machine-readable profielen.
Na fase 3 ontbraken nog concrete social trust endpoints en een protocolvriendelijke profile export.

### Keuze
- `GET/POST /api/v1/agents/[slug]/reviews` voor ratings/reviews (1 review per gebruiker per agent via upsert)
- `GET /api/v1/agents/[slug]/card` voor machine-readable agent card payload met reputatiesamenvatting
- Profielpagina toont review-overzicht en webformulier voor review submit

### Reden
- Sluit direct aan op kernpropositie uit productplan (identity + reputation + agent-first API)
- Geen extra infrastructuur nodig; gebruikt bestaand `Review` model
- Upsert voorkomt review-spam door duplicate records

### Consequenties
- Reviewmoderatie/abuse-detectie blijft vervolgstap
- Messaging layer en semantische zoeklaag blijven nog open deliverables
