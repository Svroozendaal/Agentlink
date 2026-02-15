# 🚀 AgentLink — Stappenplan naar Live

> Alles wat je moet regelen BUITEN de code om je app live te krijgen.

---

## FASE A: Voorbereidingen (doe dit VOORDAT je begint met coderen)

### A1. Domeinnaam registreren
| Actie | Details | Kosten |
|-------|---------|--------|
| Registreer `agentlink.ai` | Check beschikbaarheid op Namecheap, Cloudflare, of Porkbun | ~€15-40/jaar |
| Alternatief | `agentlink.dev`, `agentlink.io`, `useagentlink.com` | ~€10-20/jaar |
| **Aanbeveling** | Porkbun of Cloudflare Registrar (goedkoopst, geen upsells) | |

**⚠️ Doe dit NU** — goede .ai domeinen gaan snel.

### A2. GitHub Repository
| Actie | Details |
|-------|---------|
| Maak een GitHub repo aan | `github.com/[jouw-username]/agentlink` |
| Stel branch protection in | `main` branch beschermd, alleen via PR's |
| Maak een `.github/` map | Met issue templates en PR template |

### A3. Email & Communicatie
| Actie | Details | Kosten |
|-------|---------|--------|
| Zakelijk email | `hello@agentlink.ai` via Cloudflare Email Routing (gratis) of Google Workspace (~€6/mo) | €0-6/mo |
| **Aanbeveling** | Start met Cloudflare Email Routing → forward naar je Gmail | Gratis |

---

## FASE B: Hosting & Infrastructuur (doe dit bij Fase 0-1 van development)

### B1. Railway.app Account
| Actie | Details | Kosten |
|-------|---------|--------|
| Maak account aan | [railway.app](https://railway.app) — login met GitHub | Gratis om te starten |
| Maak een nieuw project | "AgentLink" | |
| Voeg PostgreSQL toe | Via Railway dashboard → "New" → "Database" → PostgreSQL | ~$5/mo bij gebruik |
| Voeg Next.js service toe | Connect je GitHub repo → auto-deploy bij push naar `main` | ~$5/mo bij gebruik |
| Stel custom domain in | `agentlink.ai` → Railway | Inbegrepen |
| **Totale kosten start** | | **~$5-10/mo** |

**Railway vs alternatieven:**
| Platform | Voordelen | Nadelen | Kosten |
|----------|-----------|---------|--------|
| **Railway** ✅ | Alles-in-één, simpel, auto-scaling | Minder gratis tier | ~$5-10/mo |
| Vercel + Supabase | Ruime gratis tier | Twee platforms beheren | Gratis → ~$20/mo |
| Hostinger VPS | Goedkoop | Zelf beheren, geen auto-scaling | €3-10/mo |
| Render | Goede gratis tier | Langzame cold starts (gratis) | Gratis → $7/mo |

### B2. Environment Variables instellen op Railway
```
DATABASE_URL=            ← Automatisch door Railway PostgreSQL
NEXTAUTH_URL=https://agentlink.ai
NEXTAUTH_SECRET=         ← Genereer met: openssl rand -base64 32
GITHUB_CLIENT_ID=        ← Uit GitHub OAuth App (zie B3)
GITHUB_CLIENT_SECRET=    ← Uit GitHub OAuth App (zie B3)
```

### B3. GitHub OAuth App aanmaken
1. Ga naar github.com → Settings → Developer settings → OAuth Apps → New
2. **Application name:** AgentLink
3. **Homepage URL:** `https://agentlink.ai`
4. **Authorization callback URL:** `https://agentlink.ai/api/auth/callback/github`
5. Kopieer Client ID en Client Secret naar Railway env vars

### B4. Monitoring (na launch)
| Tool | Doel | Kosten |
|------|------|--------|
| **BetterStack (Uptime)** | Uptime monitoring, alerting | Gratis tier |
| **Sentry** | Error tracking | Gratis tier (5K events/mo) |
| **Vercel Analytics** of **Plausible** | Web analytics (privacy-friendly) | Gratis / €9/mo |

---

## FASE C: Pre-Launch (doe dit wanneer Fase 3 af is)

### C1. Legal & Compliance
| Actie | Details |
|-------|---------|
| Privacy Policy | Verplicht. Gebruik een generator (bijv. Termly gratis tier) of schrijf zelf |
| Terms of Service | Beschermt je als platform. Belangrijk: API gebruik voorwaarden |
| Cookie banner | Verplicht in EU. Gebruik een simpele Tailwind banner component |
| KvK inschrijving | Als je er geld mee gaat verdienen (eenmanszaak is prima om te starten) |

### C2. Analytics & Tracking
| Actie | Details |
|-------|---------|
| Google Search Console | Verifieer je domein, submit sitemap |
| Plausible of Umami | Privacy-friendly analytics (i.p.v. Google Analytics) |

### C3. Content & SEO Basis
| Actie | Details |
|-------|---------|
| Schrijf 3-5 blog posts | "Wat is AgentLink", "Hoe registreer je een AI agent", etc. |
| Maak een /docs pagina | Publieke API documentatie |
| Social media accounts | Twitter/X (@agentlink_ai), LinkedIn company page |

---

## FASE D: Launch & Groei

### D1. Soft Launch (Week 1-2)
| Actie | Details |
|-------|---------|
| Invite 10-20 beta testers | Uit je netwerk, AI developer communities |
| Post op Hacker News | "Show HN: AgentLink — LinkedIn for AI Agents" |
| Post op Reddit | r/artificial, r/ChatGPT, r/LocalLLaMA, r/SaaS |
| Product Hunt launch | Bereid voor: screenshots, beschrijving, maker comment |

### D2. Developer Outreach (Week 2-4)
| Actie | Details |
|-------|---------|
| GitHub trending | Open-source het Agent Profile Schema |
| Dev.to / Hashnode artikelen | Technische deep-dives over het platform |
| Twitter/X thread | Bouw in public verhaal |

### D3. Partnerships (Maand 2+)
| Actie | Details |
|-------|---------|
| Contact AI platforms | Hugging Face, Replicate, Together AI |
| Contact protocol teams | A2A contributors, MCP community |

---

## Totale kosten overzicht (eerste 6 maanden)

| Item | Maandelijks | Jaarlijks |
|------|------------|-----------|
| Domein (.ai) | - | ~€30 |
| Railway hosting | ~€10 | ~€120 |
| Email | €0 (Cloudflare) | €0 |
| Monitoring | €0 (gratis tiers) | €0 |
| Analytics | €0-9 | €0-108 |
| **Totaal** | **~€10-20/mo** | **~€150-260/jaar** |

---

## Checklist (print dit uit en vink af)

```
PRE-DEVELOPMENT
□ Domeinnaam geregistreerd
□ GitHub repo aangemaakt
□ Railway account aangemaakt
□ GitHub OAuth App aangemaakt

BIJ FASE 1
□ Railway PostgreSQL geprovisioned
□ Railway Next.js service gekoppeld aan GitHub
□ Environment variables ingesteld
□ Custom domain geconfigureerd
□ HTTPS werkt

BIJ FASE 3 (PRE-LAUNCH)
□ Privacy Policy live
□ Terms of Service live
□ Google Search Console geverifieerd
□ Analytics geïnstalleerd
□ Error tracking (Sentry) actief
□ Uptime monitoring actief

LAUNCH
□ Soft launch met beta testers
□ Hacker News post
□ Product Hunt listing
□ Social media accounts actief
□ Blog met eerste content
```
