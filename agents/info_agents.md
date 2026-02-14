# 📁 agents

> Bevat de instructiebestanden voor het virtuele agent systeem dat Claude Code aanstuurt.

## Overzicht

Het agent systeem is een set gestructureerde instructiebestanden (markdown) die Claude Code vertellen HOE specifieke taken uitgevoerd moeten worden. Agents zijn geen aparte programma's — het zijn kennisdocumenten met regels, patronen, checklists en voorbeelden.

Bij elke taak identificeert Claude Code welke agent(s) relevant zijn, leest hun instructies, en volgt de daarin beschreven werkwijze.

## Bestanden

| Bestand | Agent | Domein |
|---------|-------|--------|
| `architect.md` | 🏗️ Architect | Projectstructuur, dependencies, tech decisions |
| `database.md` | 📊 Database | Prisma schema, migraties, queries, seeding |
| `api.md` | 🔌 API | API routes, validatie, error handling, API docs |
| `frontend.md` | 🎨 Frontend | React components, pages, styling, UX |
| `auth.md` | 🔐 Auth | Authenticatie, autorisatie, API keys, security |
| `docs.md` | 📝 Docs | Documentatie, info_*.md, README, backlog |
| `testing.md` | 🧪 Testing | Unit tests, integration tests, E2E tests |
| `review.md` | 🛡️ Review | Code review, quality checks, security audit |

## Hoe het werkt

1. Claude Code leest `CLAUDE.md` (de masterprompt) bij elke sessie
2. Op basis van de taak worden relevante agents geïdentificeerd
3. Claude leest de agent-instructies en volgt de regels en patronen
4. Na afronding voert Claude de self-improvement checklist uit
5. Documentatie wordt bijgewerkt door de Docs agent

## Afhankelijkheden

- **Gebruikt door:** Claude Code (automatisch bij elke sessie)
- **Hangt af van:** `CLAUDE.md` voor overkoepelende regels en structuur

## Patronen & Conventies

- Agent bestanden worden NOOIT stilzwijgend gewijzigd — altijd toestemming vragen
- Elke agent heeft dezelfde secties: Rol, Regels, Patronen, Kwaliteitscheck, Zelfverbetering
- Agents verwijzen naar elkaar maar zijn onafhankelijk leesbaar

## Laatste wijziging

Initiële versie — Alle 8 agents aangemaakt bij projectopzet.
