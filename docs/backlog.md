# Backlog

## Hoge prioriteit
- [ ] [SECURITY] Voeg rate limiting toe op auth, reviews, endorsements en messaging endpoints
- [ ] [SECURITY] Voeg admin-moderatie UI toe voor flagged reviews
- [ ] [RELIABILITY] Migreer webhook delivery naar queue-based processing (BullMQ/Redis)
- [ ] [PERF] Voeg realtime updates toe voor messaging (SSE of WebSocket)

## Middel prioriteit
- [ ] [SECURITY] Voeg auth audit logging toe (sign-in, key create, key revoke)
- [ ] [IMPROVE] Voeg basis CI checks toe (lint/build/test)
- [ ] [FEAT] Voeg dashboard webhooks beheer UI tab toe in edit-flow
- [ ] [FEAT] Voeg onboarding welcome flow toe voor nieuwe users
- [ ] [IMPROVE] Tune search ranking (gewichten op naam/description/verified/rating)
- [ ] [FEAT] Voeg semantische zoeklaag toe (vector/embeddings of Elasticsearch)
- [ ] [FEAT] Voeg basis verificatieflow toe (e-mail/domeinbewijs)

## Lage prioriteit
- [ ] [IMPROVE] Voeg architectuurdiagram toe aan docs

## Afgerond
- [x] [FEAT] Social layer: uitgebreide reviews, endorsements en activity feed API (2026-02-14)
- [x] [FEAT] Messaging + webhooks API en dashboard inbox (`/dashboard/messages`) (2026-02-14)
- [x] [FEAT] Discovery uitbreiding: well-known, OpenAPI, A2A, sitemap, robots (2026-02-14)
- [x] [FEAT] Legal/docs/error pagina's toegevoegd (2026-02-14)
- [x] [FEAT] Productplan alignment geupdate na uitbreiding (2026-02-14)
- [x] [FEAT] Productplan alignment: reviews + ratings + machine-readable agent card endpoint (2026-02-14)
- [x] [FEAT] Fase 3 discovery search API + directory + landing page (2026-02-14)
- [x] [FEAT] Fase 2 agent CRUD API, self-registration endpoint en dashboard create-flow (2026-02-14)
- [x] [FEAT] Fase 1 database schema, auth en API key management (2026-02-14)
- [x] [CHORE] Fase 0 projectskelet opgezet (2026-02-14)

## New backlog from prompts 6-8
- [ ] [RELIABILITY] Add scheduled health-check jobs (cron) for endpoint monitoring
- [ ] [PERF] Add dynamic OG image generation for agents (`/api/og/[slug]`)
- [ ] [GROWTH] Automate import jobs (daily Hugging Face/GitHub sync)
- [ ] [GROWTH] Add outbound email integration for outreach delivery
- [ ] [FEAT] Add WebSocket/streaming support for live endpoint playground responses
