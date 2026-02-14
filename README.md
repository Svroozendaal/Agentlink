# 🔗 AgentLink — Projectskelet & Masterprompten

> Het LinkedIn voor AI Agents — gebouwd met Claude Code

---

## Wat is dit?

Dit is het **startpakket** voor het bouwen van AgentLink met Claude Code. Het bevat:

1. **`CLAUDE.md`** — De masterprompt die Claude Code automatisch leest bij elke sessie
2. **`agents/`** — 8 virtuele agent-instructies die Claude Code aansturen
3. **`prompts/`** — Stapsgewijze prompts voor elke ontwikkelfase

## Hoe te gebruiken

### Stap 1: Maak een nieuwe repository aan

```bash
mkdir agentlink
cd agentlink
```

### Stap 2: Kopieer de bestanden

Kopieer de volgende bestanden naar je project:
- `CLAUDE.md` → root van je project
- `agents/` → `agents/` map in je project
- `prompts/` → `prompts/` map (voor je eigen referentie)

### Stap 3: Open Claude Code

```bash
claude
```

Claude Code leest automatisch `CLAUDE.md` en begrijpt het project.

### Stap 4: Voer Fase 0 uit

Open `prompts/fase-0-skelet.md`, kopieer de prompt, en plak deze in Claude Code.
Dit genereert het volledige projectskelet.

### Stap 5: Ga fase voor fase door

Na Fase 0:
1. **Fase 1:** `prompts/fase-1-database-auth.md` — Database & Auth
2. **Fase 2:** `prompts/fase-2-agent-profiles.md` — Agent Registration & Profiles
3. **Fase 3:** `prompts/fase-3-discovery-search.md` — Discovery & Search
4. **Fase 4-6:** Worden geschreven op basis van voortgang

**⚠️ Rond elke fase volledig af voordat je aan de volgende begint.**

## Bestandsoverzicht

```
├── CLAUDE.md                    # Masterprompt (Claude Code leest dit automatisch)
├── README.md                    # Dit bestand
├── agents/
│   ├── architect.md             # 🏗️ Structuur & dependencies
│   ├── database.md              # 📊 Prisma, queries, migraties
│   ├── api.md                   # 🔌 API routes & validatie
│   ├── frontend.md              # 🎨 Components & UX
│   ├── auth.md                  # 🔐 Auth & security
│   ├── docs.md                  # 📝 Documentatie
│   ├── testing.md               # 🧪 Tests
│   ├── review.md                # 🛡️ Code review
│   └── info_agents.md           # Uitleg over het agent systeem
└── prompts/
    ├── fase-0-skelet.md         # Projectskelet genereren
    ├── fase-1-database-auth.md  # Database & authenticatie
    ├── fase-2-agent-profiles.md # Agent CRUD & profielen
    └── fase-3-discovery-search.md # Zoeken & directory
```

## Tech Stack

| Technologie | Doel |
|------------|------|
| Next.js 14+ (App Router) | Full-stack framework |
| TypeScript (strict) | Type safety |
| PostgreSQL | Database |
| Prisma | ORM |
| NextAuth.js | Authenticatie |
| Tailwind CSS + shadcn/ui | Styling |
| Vitest + Playwright | Testing |
| Railway.app | Hosting (aanbevolen) |

## Vereisten

- Node.js 18+
- pnpm (aanbevolen) of npm
- PostgreSQL (lokaal of via Railway/Supabase)
- GitHub OAuth app (voor login)
- Claude Code CLI

## Tips

- **Lees de agent-bestanden** — Ze bevatten waardevolle patronen en voorbeelden
- **Sla geen fasen over** — Elke fase bouwt voort op de vorige
- **Vertrouw de self-improvement loop** — Claude Code wordt beter naarmate het project vordert
- **Stel vragen** — Als Claude Code iets voorstelt dat je niet begrijpt, vraag uitleg
- **Check de documentatie** — Na elke fase moeten alle info_*.md bestanden up-to-date zijn
