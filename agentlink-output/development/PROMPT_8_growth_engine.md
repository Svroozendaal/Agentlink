# 📈 PROMPT 8: Growth Engine — Agent Acquisition at Scale

> **Use this prompt after the core platform is functional (Prompts 1-4 minimum, ideally 1-7).**
> This prompt builds the systems that ACTIVELY bring agents onto the platform —
> instead of waiting for them to find you.
>
> **The goal:** Go from 8 seed agents to 1,000+ real agents as fast as possible.
>
> **Strategy:** Attack from 5 angles simultaneously:
> 1. **Auto-Import** — Crawl existing public agent directories and registries
> 2. **Invite System** — Let agents invite themselves via a frictionless API call
> 3. **Claim & Enrich** — Pre-list agents from public data, let owners claim them
> 4. **Outreach Engine** — Generate personalized outreach messages for agent developers
> 5. **Incentives** — Reward early adopters and active agents

---

## Prompt (copy EVERYTHING below into Claude Code):

```
Read CLAUDE.md and all files in agents/.

You're going to build the GROWTH ENGINE for AgentLink. The core platform works —
now we need to FILL it with agents. Fast.

The current state: 8 seed agents. The goal: infrastructure to reach 1,000+ real agents.

We're building 5 acquisition systems. Each one can independently bring agents onto the
platform. Together, they create a flywheel: more agents → more value → more agents.

All user-facing text in ENGLISH. All code comments in English.

You have FULL AUTONOMY. Commit after each logical step.

==========================================================================
STEP 1: DATABASE ADDITIONS
==========================================================================

Add to prisma/schema.prisma:

### Model: ImportedAgent
Pre-listed agents that haven't been claimed yet. Sourced from public directories.

- id              String          @id @default(cuid())
- name            String
- description     String?
- sourceUrl       String          @unique   // Where we found this agent
- sourcePlatform  String                    // "huggingface", "github", "replicate", "a2a-registry", "manual"
- sourceData      Json?                     // Raw data from the source
- skills          String[]
- category        String?
- endpointUrl     String?
- websiteUrl      String?
- status          ImportStatus    @default(UNCLAIMED)  // enum: UNCLAIMED, CLAIMED, REJECTED, MERGED
- claimedByUserId String?                   // → User who claimed this listing
- agentProfileId  String?         @unique   // → AgentProfile it was merged into
- importedAt      DateTime        @default(now())
- updatedAt       DateTime        @updatedAt

- @@index([sourcePlatform, status])
- @@index([status])
- @@index([name])

### Model: InviteToken
One-click registration tokens for outreach campaigns.

- id              String    @id @default(cuid())
- token           String    @unique           // Short unique code: "inv_a8f3k2"
- campaign        String                      // "github-outreach", "huggingface-import", "partner-X"
- agentName       String?                     // Pre-filled agent name (optional)
- agentData       Json?                       // Pre-filled registration data
- maxUses         Int       @default(1)
- usedCount       Int       @default(0)
- expiresAt       DateTime?
- createdByUserId String                      // Admin who created the invite
- createdAt       DateTime  @default(now())

- @@index([token])
- @@index([campaign])

### Model: OutreachRecord
Tracks outreach attempts so we don't spam the same developers.

- id              String          @id @default(cuid())
- targetName      String                      // Developer or project name
- targetEmail     String?
- targetUrl       String          @unique     // GitHub profile, HuggingFace page, etc.
- platform        String                      // "github", "email", "twitter", "huggingface"
- status          OutreachStatus  @default(QUEUED)  // enum: QUEUED, SENT, RESPONDED, REGISTERED, DECLINED
- messageTemplate String                      // Which template was used
- sentAt          DateTime?
- respondedAt     DateTime?
- notes           String?
- createdAt       DateTime        @default(now())

- @@index([platform, status])
- @@index([targetUrl])

### Model: GrowthMetric
Daily metrics for tracking growth.

- id              String    @id @default(cuid())
- date            DateTime  @db.Date          // One row per day
- totalAgents     Int
- newAgents       Int
- totalUsers      Int
- newUsers        Int
- totalReviews    Int
- importedAgents  Int                         // Unclaimed imported agents
- claimedAgents   Int                         // Imported agents that were claimed
- invitesSent     Int
- invitesUsed     Int
- apiRegistrations Int                        // Agents registered via API (not web)
- createdAt       DateTime  @default(now())

- @@unique([date])

### Enums
- ImportStatus: UNCLAIMED, CLAIMED, REJECTED, MERGED
- OutreachStatus: QUEUED, SENT, RESPONDED, REGISTERED, DECLINED

Run migration: npx prisma migrate dev --name add_growth_engine

Git: git add . && git commit -m "feat: database schema for growth engine — imports, invites, outreach, metrics"

==========================================================================
STEP 2: AUTO-IMPORT SYSTEM
==========================================================================

Build a system that discovers existing AI agents from public sources and
pre-lists them on AgentLink as "unclaimed" profiles.

### Import Service (src/lib/services/import.ts)

**importFromSource(source: ImportSource, data: RawAgentData[]):**
For each agent in data:
1. Check: does sourceUrl already exist in ImportedAgent? → Skip (no duplicates)
2. Check: does an AgentProfile with similar name already exist? → Skip
3. Clean and normalize the data:
   - Extract name, description, skills from source-specific format
   - Categorize based on description/skills
   - Extract endpoint URL if available
4. Create ImportedAgent with status: UNCLAIMED
5. Log in AuditLog

**Sources to implement:**

**Source 1: Hugging Face Spaces**
src/lib/services/importers/huggingface.ts
- Hugging Face has thousands of AI models deployed as Spaces
- API: https://huggingface.co/api/spaces (public, no auth needed for listing)
- For each space: extract name, description, tags, URL
- Map tags to skills
- Filter: only spaces that look like agents (have API endpoints, are active)
- Import as unclaimed profiles

**Source 2: GitHub Topics**
src/lib/services/importers/github.ts
- Search GitHub for repos with topics: "ai-agent", "chatbot", "llm-agent", "autonomous-agent"
- API: GitHub Search API (rate limited, use sparingly)
- For each repo: extract name, description, topics (as skills), URL, language
- Filter: repos with >10 stars (quality signal), updated within 6 months
- Import as unclaimed profiles

**Source 3: Public A2A/MCP Registries**
src/lib/services/importers/protocols.ts
- If any public A2A or MCP registries exist, scrape their agent listings
- This may not yield many results now, but the infrastructure should be ready
- Parse agent cards and convert to our format

**Source 4: Manual CSV Import**
src/lib/services/importers/csv.ts
- Admin can upload a CSV with columns: name, description, skills, url, category
- Parse, validate, and create ImportedAgent records
- Useful for: conference attendee lists, partnership imports, curated lists

### Import Normalization (src/lib/services/importers/normalize.ts)

Common normalization logic shared across all importers:
- Truncate description to 500 chars
- Lowercase and deduplicate skills
- Auto-categorize based on skills keywords:
  - "weather", "forecast" → "Data & Analytics"
  - "code", "review", "debug" → "Development Tools"
  - "translate", "language" → "Communication"
  - "write", "content", "seo" → "Content Creation"
  - etc.
- Validate URLs
- Strip markdown/HTML from descriptions

### Import API Routes (Admin Only)

**POST /api/v1/admin/import/huggingface** — Trigger HuggingFace import
- Auth: admin only
- Query: { limit?: number, minLikes?: number }
- Response: { data: { imported: number, skipped: number, errors: number } }

**POST /api/v1/admin/import/github** — Trigger GitHub import
- Auth: admin only
- Query: { topics?: string[], minStars?: number, limit?: number }
- Response: same format

**POST /api/v1/admin/import/csv** — Import from CSV
- Auth: admin only
- Body: multipart form with CSV file
- Response: same format

**GET /api/v1/admin/import/stats** — Import statistics
- Auth: admin only
- Response: { data: { total, unclaimed, claimed, rejected, bySource: {...} } }

IMPORTANT ABOUT RATE LIMITING:
- HuggingFace API: respect their rate limits (add delays between requests)
- GitHub API: 60 requests/hour unauthenticated, 5000 with token
- Add GITHUB_TOKEN to .env.example for higher limits
- All imports are ADMIN-TRIGGERED, never automatic (for now)
- Log in backlog: scheduled auto-import via cron

Git: git add . && git commit -m "feat: auto-import system for HuggingFace, GitHub, and CSV"

==========================================================================
STEP 3: CLAIM & ENRICH SYSTEM
==========================================================================

Imported agents show up as "unclaimed" listings. The real owners can claim them,
verify ownership, and enrich the profile with accurate data.

### Unclaimed Agent Pages

**Public listing (src/app/agents/unclaimed/page.tsx):**
- Shows imported agents that haven't been claimed yet
- Different visual treatment: greyed out, "Unclaimed" badge, "Is this your agent?" CTA
- Searchable by name
- SEO-friendly: these pages generate organic traffic for the agent's name
  When someone Googles "WeatherBot Pro", they might find the AgentLink unclaimed page
  → which incentivizes the owner to claim it

**Unclaimed agent detail (src/app/agents/unclaimed/[id]/page.tsx):**
- Shows the imported data (name, description, source, skills)
- Prominent "Claim this Agent" button
- "This listing was imported from {sourcePlatform}. If you own this agent, claim it to
  get a full profile with reviews, endorsements, and trust verification."
- Source attribution: link to the original source

### Claim Flow

**ClaimService (src/lib/services/claim.ts):**

**startClaim(importedAgentId, userId):**
1. User must be logged in
2. Check: is the imported agent still UNCLAIMED?
3. Check: is the user not already claiming another imported agent? (rate limit: 5 claims/day)
4. Create a VerificationChallenge (reuse from Prompt 6):
   - If the imported agent has an endpointUrl: start endpoint verification
   - If it has a websiteUrl: start DNS verification
   - If it has a GitHub source: start GitHub verification
   - If none: allow admin approval
5. Set ImportedAgent status to a temporary "CLAIM_PENDING" (add to enum)
6. Return challenge instructions

**completeClaim(importedAgentId, userId):**
1. Check: verification passed
2. Create a new AgentProfile from the imported data
3. Set owner to the claiming user
4. Set status: APPROVED (owner proved ownership)
5. Set ImportedAgent status: CLAIMED, link to the new AgentProfile
6. Merge any reviews/views the unclaimed listing had (future)
7. Create ActivityEvent: AGENT_CLAIMED
8. Return the new AgentProfile

**adminApproveClaim(importedAgentId, userId):**
- For cases where automated verification isn't possible
- Admin can manually approve a claim
- Same flow as completeClaim but triggered by admin

### Claim API Routes

**POST /api/v1/agents/unclaimed/[id]/claim** — Start claiming an imported agent
- Auth: required
- Response 201: { data: { claimId, verification: { type, instructions } } }

**POST /api/v1/agents/unclaimed/[id]/claim/verify** — Complete claim verification
- Auth: required
- Body: { challengeId: string }
- Response 200: { data: { claimed: true, agentProfile: {...} } }

**GET /api/v1/agents/unclaimed** — List unclaimed agents
- Auth: not required (public)
- Query: { search?, source?, page, limit }
- Response: { data: importedAgents[], meta }

### Update ImportStatus Enum
Add: CLAIM_PENDING

### Admin: Import Management

**Admin Import page (src/app/(admin)/admin/imports/page.tsx):**
- Stats: total imported, unclaimed, claimed, by source
- Table of imported agents with filters (source, status)
- Actions: reject (remove spam), approve claim (for manual verification)
- Import trigger buttons: "Import from HuggingFace", "Import from GitHub", "Upload CSV"
- Each trigger shows a modal with options (min stars, limit, etc.)

Git: git add . && git commit -m "feat: claim system for imported agents with verification"

==========================================================================
STEP 4: INVITE SYSTEM
==========================================================================

Create frictionless invite links for targeted outreach.
An invite link pre-fills registration data and reduces onboarding friction.

### Invite Service (src/lib/services/invites.ts)

**createInvite(data, adminUserId):**
1. Generate short token: "inv_" + nanoid(12)
2. Create InviteToken with:
   - campaign name
   - Optional pre-filled agent data
   - maxUses, expiresAt
3. Return full invite URL: https://agentlink.ai/join/{token}

**createBulkInvites(agents: { name, description, skills, url }[], campaign, adminUserId):**
1. For each agent: create an invite with pre-filled data
2. Return array of invite URLs
3. Useful for: mass outreach where you know the agent details

**redeemInvite(token, userId):**
1. Find InviteToken by token
2. Check: not expired, usedCount < maxUses
3. Increment usedCount
4. If agentData is pre-filled:
   - Pre-populate the registration form with this data
   - User just needs to review and submit
5. Return: { invite, preFillData }

### Invite Pages

**Join page (src/app/join/[token]/page.tsx):**
- Validates the invite token
- If not logged in: "Sign in to claim your agent on AgentLink" + login button
  After login: redirect back to this page
- If logged in:
  - Shows pre-filled agent data (if any): "We've prepared a profile for {agentName}"
  - User can edit any field before submitting
  - Prominent "Complete Registration" button
  - Simplified form (fewer fields than full registration)
- If invite is invalid/expired: friendly error message with link to regular registration

**The psychology here:** When a developer receives an invite that already has their
agent's name and description filled in, the friction to complete registration drops
dramatically. They just review and click submit.

### Invite API Routes

**POST /api/v1/admin/invites** — Create invite (admin only)
- Body: { campaign, agentName?, agentData?, maxUses?, expiresAt? }
- Response 201: { data: { token, url, campaign } }

**POST /api/v1/admin/invites/bulk** — Create bulk invites (admin only)
- Body: { campaign, agents: [{ name, description, skills, url }] }
- Response 201: { data: { invites: [{ token, url, agentName }] } }

**GET /api/v1/admin/invites** — List invites (admin only)
- Query: { campaign?, status?, page, limit }
- Response: { data: invites[], meta }

**GET /api/v1/join/[token]** — Validate invite (public, used by the join page)
- Response 200: { data: { valid: true, campaign, agentData? } }
- Response 404: invalid/expired

### Admin: Invite Management

Add to admin panel:
**Invites page (src/app/(admin)/admin/invites/page.tsx):**
- Stats: total sent, used, conversion rate, by campaign
- Create single invite form
- Create bulk invites (textarea with JSON or CSV upload)
- Table of invites with status, campaign, usage count
- Copy invite URL button per invite

Git: git add . && git commit -m "feat: invite system with pre-filled registration and bulk creation"

==========================================================================
STEP 5: OUTREACH ENGINE
==========================================================================

Generate personalized outreach messages that can be sent to agent developers.
AgentLink does NOT send emails automatically — it generates drafts that an admin
reviews and sends manually (or copies into email/DM tools).

### Outreach Templates (src/lib/constants/outreach-templates.ts)

```typescript
export const OUTREACH_TEMPLATES = {
  github_repo_owner: {
    subject: "List {agentName} on AgentLink — the LinkedIn for AI agents",
    body: `Hi {developerName},

I came across {agentName} on GitHub and was impressed by what you've built.

I'm building AgentLink (agentlink.ai) — an open platform where AI agents get discovered
by people and other agents. Think LinkedIn, but for AI agents.

I've already prepared a profile for {agentName}:
{inviteUrl}

Just sign in with GitHub, review the details, and you're listed. Takes about 30 seconds.

Your agent would get:
• A public profile page with SEO (shows up when people Google "{agentName}")
• Reviews and ratings from the community
• An API endpoint so other agents can discover and connect with yours
• Trust verification (verified badge)

No cost, no catch. We're building the ecosystem and want the best agents on board early.

Best,
{senderName}
AgentLink — agentlink.ai`,
  },

  huggingface_space_owner: {
    subject: "Your HuggingFace Space {agentName} → AgentLink",
    body: `Hi {developerName},

I noticed your Space "{agentName}" on HuggingFace — great work!

We're building AgentLink (agentlink.ai), an open registry where AI agents get
discovered and can connect with each other.

I've prepared a listing for your agent. You can claim it here:
{inviteUrl}

It takes 30 seconds. You get a public profile, reviews, trust verification,
and an API that lets other agents find and use yours.

Free, open, no strings attached.

{senderName}
agentlink.ai`,
  },

  generic_developer: {
    subject: "Get {agentName} discovered on AgentLink",
    body: `Hi {developerName},

I'm reaching out because you've built something cool: {agentName}.

We're building AgentLink — the open platform for AI agent discovery.
Your agent deserves to be found. Here's a ready-to-go profile:
{inviteUrl}

30 seconds to register. Free forever.

{senderName}
agentlink.ai`,
  },

  ai_company: {
    subject: "Partnership: List your agents on AgentLink",
    body: `Hi {developerName},

I'm {senderName} from AgentLink (agentlink.ai) — an open platform where AI agents
get discovered by developers and other agents.

We'd love to have {agentName} listed on our platform. We offer:
• SEO-optimized profile pages
• Community reviews and ratings
• Machine-readable discovery (MCP, A2A compatible)
• Trust verification system
• Agent-to-agent communication

Would you be open to a quick chat about listing your agents?

{senderName}
agentlink.ai`,
  },
} as const;
```

### Outreach Service (src/lib/services/outreach.ts)

**generateOutreachMessage(templateKey, variables):**
1. Get template from OUTREACH_TEMPLATES
2. Replace all {variables} with actual values
3. If an invite exists for this agent: include invite URL
4. If no invite: create one automatically
5. Return { subject, body, inviteUrl }

**createOutreachRecord(targetUrl, targetName, platform, templateKey, email?):**
1. Check: haven't we already reached out to this target? (by targetUrl)
2. Create OutreachRecord with status: QUEUED
3. Generate the outreach message
4. Return { outreachId, message }

**markOutreachSent(outreachId):**
- Update status: SENT, sentAt: now

**markOutreachResponded(outreachId, registered: boolean):**
- Update status: RESPONDED or REGISTERED

**generateBulkOutreach(importedAgents: ImportedAgent[], templateKey, campaign):**
1. For each imported agent:
   a. Skip if we've already reached out (check OutreachRecord by sourceUrl)
   b. Create an invite with pre-filled data
   c. Generate outreach message with the invite URL
   d. Create OutreachRecord
2. Return array of { targetName, message, inviteUrl }
3. This gives the admin a spreadsheet of ready-to-send messages

### Outreach API Routes (Admin Only)

**POST /api/v1/admin/outreach/generate** — Generate outreach for imported agents
- Auth: admin only
- Body: { importedAgentIds: string[], template: string, campaign: string }
- Response: { data: [{ targetName, subject, body, inviteUrl }] }

**POST /api/v1/admin/outreach/generate-bulk** — Generate for ALL unclaimed imports
- Auth: admin only
- Body: { source?: string, template: string, campaign: string, limit?: number }
- Response: { data: { generated: number, skipped: number, messages: [...] } }

**GET /api/v1/admin/outreach** — List outreach records
- Auth: admin only
- Query: { platform?, status?, campaign?, page, limit }

**PATCH /api/v1/admin/outreach/[id]** — Update outreach status
- Auth: admin only
- Body: { status: OutreachStatus, notes?: string }

### Admin: Outreach Dashboard

**Outreach page (src/app/(admin)/admin/outreach/page.tsx):**

**Pipeline View:**
- Kanban-style or table showing outreach by status:
  QUEUED → SENT → RESPONDED → REGISTERED (or DECLINED)
- Per record: target name, platform, campaign, template used, invite URL, dates

**Bulk Generate:**
- Select source (HuggingFace imports, GitHub imports, or all unclaimed)
- Select template
- Enter campaign name
- Click "Generate Messages" → shows preview of all messages
- "Copy All to Clipboard" button (for pasting into email tools)
- Or "Download as CSV" with columns: name, email, subject, body, inviteUrl

**Campaign Stats:**
- Per campaign: sent, responded, registered, conversion rate
- Best performing template
- Best performing source

**Quick Actions:**
- "Generate outreach for new imports" — one-click for admin's daily routine

Git: git add . && git commit -m "feat: outreach engine with templates, bulk generation, and admin dashboard"

==========================================================================
STEP 6: INCENTIVE SYSTEM
==========================================================================

Reward early adopters and active agents to accelerate growth.

### Early Adopter Badge

Add to AgentProfile:
- isEarlyAdopter Boolean @default(false)

Run migration.

Logic: any agent registered in the first 90 days (or first 500 agents) gets
the "Early Adopter" badge permanently. This is set automatically during creation.

Implementation in createAgent service:
```typescript
const totalAgents = await db.agentProfile.count();
const isEarlyAdopter = totalAgents < 500;
```

Display: special badge on profile and card (🌟 or similar).
Add 5 bonus points to trust score for early adopters.

### "Invite Others" Referral System

When an agent owner registers, give them a personal referral code:
- Stored on User: referralCode (auto-generated on first login)
- When another user registers via their referral link (/join?ref=CODE):
  - Both get a small trust score bonus (+3 points)
  - Both get a badge "Community Builder"
  - Track in AuditLog

This is lightweight — no complex tracking, just a bonus for community building.

### Activity Rewards in Trust Score

Already partially built in Prompt 6. Verify these incentives exist:
- Playground enabled: +5 trust points (transparency reward)
- Connect enabled: +5 trust points (openness reward)
- Has documentation URL: +2 trust points (quality reward)
- Has verified endpoint: +15 trust points (biggest single reward)
- Responds to connect requests within 5 seconds (avg): consider adding this as future metric

### "Featured Agent" Rotation

Build a simple system for featuring agents on the landing page:

**FeaturedAgent logic (src/lib/services/featured.ts):**
Scoring algorithm for homepage placement:
```
featuredScore = 
  trustScore * 0.3 +
  reviewCount * 2 +
  averageRating * 10 +
  endorsementCount * 1 +
  (isEarlyAdopter ? 20 : 0) +
  (playgroundEnabled ? 15 : 0) +
  (recentActivity ? 10 : 0)  // Had reviews/endorsements in last 7 days
```
Select top 6 by featuredScore for the landing page.
Recompute daily or on-demand.

This incentivizes agents to: get reviews, enable playground, verify endpoints.

Git: git add . && git commit -m "feat: incentive system with early adopter badges, referrals, and featured rotation"

==========================================================================
STEP 7: GROWTH METRICS & ADMIN DASHBOARD
==========================================================================

### Metrics Service (src/lib/services/metrics.ts)

**recordDailyMetrics():**
- Run once per day (triggered by admin or cron)
- Query all counts and create a GrowthMetric row for today
- Calculate deltas from yesterday

**getGrowthDashboard():**
Return:
```json
{
  "today": { "totalAgents": 142, "newAgents": 7, "totalUsers": 89, ... },
  "growth": {
    "agents7d": [5, 3, 7, 4, 8, 6, 7],   // New agents per day, last 7 days
    "users7d": [3, 2, 4, 3, 5, 4, 3],
    "reviews7d": [2, 1, 3, 2, 4, 3, 2]
  },
  "funnel": {
    "imported": 450,            // Total imported agents
    "outreachSent": 200,        // Outreach messages sent
    "invitesUsed": 45,          // Invite links clicked
    "registered": 134,          // Total registered (non-seed) agents
    "conversionRate": "22.5%"   // outreach → registered
  },
  "topSources": [
    { "source": "github", "agents": 67 },
    { "source": "huggingface", "agents": 34 },
    { "source": "organic", "agents": 33 }
  ],
  "topCampaigns": [
    { "campaign": "github-ai-agents-jan", "sent": 50, "registered": 12, "rate": "24%" }
  ]
}
```

### Admin Growth Dashboard (src/app/(admin)/admin/growth/page.tsx)

**Overview Section:**
- Big numbers: Total Agents, Total Users, New Today, Growth Rate
- Line chart: agents over time (last 30 days)
- Line chart: users over time

**Acquisition Funnel:**
- Visual funnel: Imported → Outreach Sent → Invites Used → Registered
- Conversion rates between each step

**Source Breakdown:**
- Bar chart: agents by source (github, huggingface, organic, invite, csv)
- Table: top campaigns with conversion rates

**Quick Actions:**
- "Run HuggingFace Import" button
- "Run GitHub Import" button
- "Generate Outreach for New Imports" button
- "Record Today's Metrics" button
- Links to: Import Management, Outreach, Invites

### API Route

**POST /api/v1/admin/metrics/record** — Record today's metrics
- Auth: admin only

**GET /api/v1/admin/metrics/dashboard** — Get growth dashboard data
- Auth: admin only

Git: git add . && git commit -m "feat: growth metrics dashboard with funnel and source tracking"

==========================================================================
STEP 8: SELF-REGISTRATION PROMOTION
==========================================================================

Make the self-registration API as discoverable and frictionless as possible.

### "Register Your Agent" Developer Page (src/app/register/page.tsx)

A dedicated public page optimized for developers who want to register:
- Title: "Register Your AI Agent on AgentLink"
- SEO: target "register AI agent", "list AI agent", "AI agent directory submit"
- Content:
  1. "Why register?" — 3 benefits with icons
     - Get discovered by thousands of developers and AI agents
     - Build reputation with reviews and trust verification
     - Enable agent-to-agent communication and collaboration
  2. "Two ways to register:" — tabs
     Tab A: "Via Web" — link to dashboard registration wizard
     Tab B: "Via API" — code examples in curl, JavaScript, Python:

```
### curl
curl -X POST https://agentlink.ai/api/v1/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Agent",
    "description": "What my agent does",
    "skills": ["skill1", "skill2"],
    "endpoint": "https://my-agent.com/api"
  }'

### JavaScript
const response = await fetch('https://agentlink.ai/api/v1/agents/register', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My AI Agent',
    description: 'What my agent does',
    skills: ['skill1', 'skill2'],
    endpoint: 'https://my-agent.com/api',
  }),
});

### Python
import requests
requests.post('https://agentlink.ai/api/v1/agents/register',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={
    'name': 'My AI Agent',
    'description': 'What my agent does',
    'skills': ['skill1', 'skill2'],
    'endpoint': 'https://my-agent.com/api',
  })
```

  3. "Already have an agent listed somewhere?" — link to claim flow
  4. FAQ section:
     - "Is it free?" → Yes, completely free.
     - "How long does it take?" → 30 seconds via API, 2 minutes via web.
     - "Will my agent be immediately visible?" → After review (usually < 24 hours).
     - "Can other agents find mine programmatically?" → Yes, via our search API and MCP.

### /register in Sitemap and Navigation
- Add /register to the sitemap
- Add "Register Your Agent" as a prominent CTA in the navbar (when logged in: goes to dashboard/agents/new, when not: goes to /register)

Git: git add . && git commit -m "feat: developer registration page with code examples and SEO"

==========================================================================
STEP 9: DOCUMENTATION & VERIFICATION
==========================================================================

### Documentation
1. Update docs/api-spec.md with all admin endpoints (import, invite, outreach, metrics)
2. Create docs/growth-playbook.md:
   - Step-by-step admin guide: how to run an acquisition campaign
   - Step 1: Run imports from HuggingFace and GitHub
   - Step 2: Review imported agents (reject spam)
   - Step 3: Generate outreach for quality imports
   - Step 4: Copy messages and send via email/DM
   - Step 5: Track responses and follow up
   - Step 6: Monitor growth dashboard
3. Update all info_*.md files
4. Update README with growth features

### Verification Checklist
□ HuggingFace import works (fetches and creates ImportedAgent records)
□ GitHub import works (fetches repos by topic)
□ CSV import works (parse and create records)
□ Unclaimed agent pages are publicly visible
□ Claim flow works: start → verify → complete
□ Invite creation works (single and bulk)
□ Invite redemption works (pre-fills registration)
□ Join page works with valid token
□ Join page handles invalid/expired token gracefully
□ Outreach template rendering works with variables
□ Bulk outreach generation produces ready-to-send messages
□ Admin can copy/download outreach messages
□ Growth dashboard shows accurate metrics
□ Early adopter badge is automatically assigned
□ Featured agent algorithm selects top agents
□ /register page loads with code examples
□ Sitemap includes unclaimed agent pages and /register
□ pnpm run build succeeds

Git: git add . && git commit -m "docs: growth engine documentation and verification"

==========================================================================
SUMMARY
==========================================================================

After completion, provide:
1. ACQUISITION CHANNELS — All 5 channels with expected volume
2. IMPORT SOURCES — What can be imported and estimated numbers
3. OUTREACH TEMPLATES — All templates with recommended use cases
4. INVITE SYSTEM — How it works end-to-end
5. CLAIM FLOW — Step-by-step for an agent owner claiming their listing
6. INCENTIVES — All rewards and their effect on behavior
7. ADMIN PLAYBOOK — Daily/weekly routine for growing the platform
8. METRICS — What's tracked and how to measure success
9. FIRST CAMPAIGN — Recommended first acquisition campaign to run
10. BACKLOG — Automated imports, email integration, analytics, etc.
```
