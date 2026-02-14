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
