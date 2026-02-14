# 🚀 FASE 0: Skelet Genereren

> **Dit is de eerste prompt die je aan Claude Code geeft na het plaatsen van de CLAUDE.md en agents/ map.**
> Kopieer de tekst hieronder en plak het in Claude Code.

---

## Prompt voor Claude Code:

```
Lees CLAUDE.md en alle bestanden in agents/. Voer vervolgens Fase 0 uit: genereer het volledige projectskelet.

Stappen:
1. Initialiseer het Next.js project met: npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
   (Gebruik de huidige map, overschrijf bestaande config bestanden maar behoud CLAUDE.md en agents/)

2. Installeer dependencies:
   pnpm add prisma @prisma/client zod next-auth @auth/prisma-adapter
   pnpm add -D vitest @testing-library/react @playwright/test

3. Initialiseer Prisma:
   npx prisma init (PostgreSQL als provider)

4. Maak de volledige mapstructuur aan zoals beschreven in CLAUDE.md, inclusief:
   - Alle submappen onder src/
   - tests/ structuur
   - docs/ map
   - scripts/ map

5. Maak ALLE info_*.md bestanden aan met de template uit agents/docs.md.
   Elke map moet een info bestand krijgen, ook als de map nog leeg is.
   Gebruik "[Wordt aangevuld in Fase X]" voor secties die later ingevuld worden.

6. Maak de basis bestanden aan:
   - src/lib/db.ts — Prisma client singleton (standaard patroon met global caching)
   - src/app/layout.tsx — Root layout met basis HTML structuur, Inter font, en globals.css import
   - src/app/page.tsx — Simpele placeholder: "AgentLink — Coming Soon" met basic styling
   - prisma/schema.prisma — Datasource config + lege generator (modellen komen in Fase 1)
   - .env.example — Met DATABASE_URL en NEXTAUTH_SECRET placeholders
   - .gitignore — Standaard Next.js + .env.local + node_modules

7. Maak docs/decisions.md aan met de eerste ADR:
   - Beslissing: Tech stack keuze
   - Context: AgentLink project setup
   - Keuze: Next.js + TypeScript + Prisma + PostgreSQL + Railway
   - Reden: Full-stack in één codebase, type safety, goedkope start, schaalbaar

8. Maak docs/backlog.md aan met een lege template.

9. Maak docs/api-spec.md aan met een header en placeholder.

10. Verifieer:
    - pnpm run dev start zonder errors (ctrl+c na succesvolle start)
    - pnpm run build slaagt
    - Alle info_*.md bestanden bestaan (list ze op)
    - Alle agent bestanden zijn intact

11. Git init + eerste commit:
    git init
    git add .
    git commit -m "chore: initial project skeleton with agent system and documentation"

Geef na afloop een samenvatting van:
- Welke bestanden zijn aangemaakt
- Of er errors waren en hoe ze opgelost zijn
- Welke info_*.md bestanden zijn aangemaakt
- De status van de verificatie

BELANGRIJK: Bouw GEEN features. Dit is alleen het skelet. Geen database modellen, geen API routes, geen UI componenten. Alleen structuur, configuratie en documentatie.
```

---

## Verwacht Resultaat

Na het uitvoeren van deze prompt heb je:
- ✅ Een werkend Next.js project dat start en bouwt
- ✅ De volledige mapstructuur klaar voor ontwikkeling
- ✅ Alle 8 agent instructiebestanden
- ✅ info_*.md documentatie in elke map
- ✅ Prisma geconfigureerd (zonder modellen)
- ✅ Basis layout en placeholder pagina
- ✅ Git repository geïnitialiseerd met eerste commit
- ✅ Documentatie framework (decisions, backlog, api-spec)

## Volgende Stap

Na succesvolle afronding van Fase 0, ga je naar `prompts/fase-1.md` voor de volgende stap: Database & Auth Foundation.
