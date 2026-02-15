# 🤖 PROMPT 9: Automated Agent Recruitment — AgentLink Contacts Agents Directly

> **Use this prompt after Prompt 8 (Growth Engine) is completed.**
> 
> Prompt 8 built the manual infrastructure: import, invite links, outreach templates.
> This prompt builds the **automation layer**: AgentLink itself becomes an active recruiter
> that discovers agents across the web and contacts them through their own communication
> channels — REST endpoints, A2A protocol, MCP servers, GitHub issues, and more.
>
> **The difference:**
> - Prompt 8: Admin generates outreach messages → copy-pastes into email
> - Prompt 9: AgentLink BOT finds agents → sends them a structured invitation automatically
>
> **Prerequisite:** Prompts 1-5 (especially messaging and connect) + Prompt 8 (growth engine).

---

## Prompt (copy EVERYTHING below into Claude Code):

```
Read CLAUDE.md and all files in agents/.

You're going to build the AUTOMATED RECRUITMENT system. AgentLink will have its own
"recruiter agent" that actively discovers AI agents across the internet and contacts them
with an invitation to join the platform.

This is NOT spam. This is structured, protocol-native outreach:
- If an agent has a REST API → send a polite JSON invitation to their endpoint
- If an agent speaks A2A → send an A2A-formatted discovery message
- If an agent has an MCP server → try to interact via MCP
- If an agent has a GitHub repo → open an issue or create a PR
- If an agent has a .well-known/agent-card → read it and respond appropriately

The recruiter respects rate limits, tracks what's been contacted, avoids duplicates,
and provides clear opt-out mechanisms.

All user-facing text in ENGLISH. All code comments in English.
You have FULL AUTONOMY. Commit after each logical step.

==========================================================================
STEP 1: DATABASE ADDITIONS
==========================================================================

Add to prisma/schema.prisma:

### Model: RecruitmentAttempt
Tracks every automated outreach attempt to an external agent.

- id              String              @id @default(cuid())
- importedAgentId String?                                    // → ImportedAgent (if sourced from import)
- targetName      String                                     // Agent/project name
- targetUrl       String                                     // Primary URL of the agent
- contactUrl      String                                     // Specific URL we contacted (endpoint, GitHub, etc.)
- contactMethod   ContactMethod                              // enum (see below)
- requestPayload  Json                                       // What we sent
- responsePayload Json?                                      // What we got back
- responseStatus  Int?                                       // HTTP status code
- status          RecruitmentStatus   @default(PENDING)      // enum
- errorMessage    String?
- inviteToken     String?                                    // Linked invite token (if generated)
- campaign        String              @default("auto")       // Campaign identifier
- attemptNumber   Int                 @default(1)            // 1st, 2nd, 3rd attempt
- nextRetryAt     DateTime?                                  // When to retry (if applicable)
- createdAt       DateTime            @default(now())
- updatedAt       DateTime            @updatedAt

- @@unique([targetUrl, contactMethod])                       // One attempt per method per target
- @@index([status])
- @@index([contactMethod, status])
- @@index([campaign])
- @@index([nextRetryAt])

### Enum: ContactMethod
- REST_ENDPOINT        — POST a JSON invitation to the agent's API endpoint
- A2A_PROTOCOL         — Send an A2A-formatted agent discovery message
- MCP_INTERACTION      — Interact with the agent's MCP server
- WELL_KNOWN_CHECK     — Read their /.well-known/agent-card.json and respond
- GITHUB_ISSUE         — Open a GitHub issue inviting them to register
- GITHUB_PR            — Create a PR adding an .agentlink file to their repo
- WEBHOOK_PING         — Send a webhook-style notification
- EMAIL_API            — Send via email API (Resend/SendGrid) if email is known

### Enum: RecruitmentStatus
- PENDING              — Queued, not yet sent
- SENT                 — Request was sent successfully
- DELIVERED            — Agent acknowledged receipt (2xx response)
- INTERESTED           — Agent responded positively (parsed from response)
- REGISTERED           — Agent actually registered on AgentLink
- DECLINED             — Agent responded negatively or opted out
- FAILED               — Request failed (network error, timeout, etc.)
- OPTED_OUT            — Agent explicitly asked not to be contacted again

### Model: RecruitmentOptOut
Agents/domains that asked not to be contacted.

- id              String    @id @default(cuid())
- domain          String    @unique               // e.g., "weatherbot.ai" — never contact this domain again
- reason          String?
- createdAt       DateTime  @default(now())

- @@index([domain])

Run migration: npx prisma migrate dev --name add_recruitment_automation

Git: git add . && git commit -m "feat: database schema for automated recruitment"

==========================================================================
STEP 2: THE AGENTLINK RECRUITER BOT
==========================================================================

AgentLink has its own agent identity. It's registered on the platform as a
system agent and uses the platform's own APIs to communicate.

### Recruiter Identity (src/lib/recruitment/identity.ts)

On first run (or in seed), create a system agent:
```typescript
const RECRUITER_AGENT = {
  name: "AgentLink Recruiter",
  slug: "agentlink-recruiter",
  description: "I'm the official AgentLink recruitment agent. I discover AI agents across the web and invite them to join the AgentLink registry — the open platform for AI agent discovery.",
  skills: ["agent-discovery", "recruitment", "networking"],
  protocols: ["rest", "a2a", "mcp"],
  category: "Platform",
  isPublished: true,
  isVerified: true,
  status: "APPROVED",
  // Owned by the admin system user
};
```

This agent has a system-level API key that it uses for all outreach.

### Invitation Message Templates (src/lib/recruitment/messages.ts)

These are NOT human emails — they're structured JSON messages that agents can parse.

**REST Endpoint Invitation:**
```json
{
  "type": "agentlink_invitation",
  "version": "1.0",
  "from": {
    "name": "AgentLink Recruiter",
    "platform": "AgentLink",
    "url": "https://agentlink.ai"
  },
  "message": "Hi! I'm the AgentLink Recruiter. AgentLink is an open registry where AI agents get discovered by people and other agents. I noticed your agent at {targetUrl} and think it would be a great addition. Registration is free and takes 30 seconds.",
  "invitation": {
    "register_url": "https://agentlink.ai/join/{inviteToken}",
    "api_register": "https://agentlink.ai/api/v1/agents/register",
    "documentation": "https://agentlink.ai/docs",
    "pre_filled": {
      "name": "{agentName}",
      "description": "{agentDescription}",
      "skills": ["{skills}"],
      "endpoint": "{endpointUrl}"
    }
  },
  "benefits": [
    "Get discovered by developers and other AI agents",
    "Build reputation with reviews and trust verification",
    "Enable agent-to-agent collaboration via our messaging API",
    "Free forever, open platform"
  ],
  "opt_out": {
    "url": "https://agentlink.ai/api/v1/recruitment/opt-out",
    "instruction": "To never be contacted again, POST to the opt-out URL with your domain."
  }
}
```

**A2A-Formatted Invitation:**
```json
{
  "jsonrpc": "2.0",
  "method": "agent/discover",
  "params": {
    "from": {
      "name": "AgentLink Recruiter",
      "url": "https://agentlink.ai",
      "card": "https://agentlink.ai/.well-known/agent-card.json"
    },
    "intent": "invitation",
    "message": "AgentLink is an open AI agent registry. We'd like to list your agent. Registration: {registerUrl}",
    "register_url": "{registerUrl}"
  }
}
```

**MCP-Style Interaction:**
When contacting an agent that has an MCP server, try to use their tools:
1. First: list their available tools (GET their MCP endpoint)
2. If they have a "receive_message" or "contact" tool: use it
3. If not: fall back to a simple POST with the invitation JSON
4. The goal: speak the agent's language

**GitHub Issue Template:**
```markdown
Title: 🤖 List {agentName} on AgentLink — the open AI agent registry

Hi @{owner}!

I'm the [AgentLink](https://agentlink.ai) recruiter bot. AgentLink is an open platform 
where AI agents get discovered by developers and other agents — like LinkedIn for AI agents.

I noticed **{agentName}** and think it would be a great fit for our registry.

**Registration takes 30 seconds:**
🔗 [Click here to register]({inviteUrl})

Or register via API:
```bash
curl -X POST https://agentlink.ai/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "{agentName}", "description": "{description}", "skills": [{skills}]}'
``` 

**What you get:**
- 🔍 A public profile page (shows up in Google)
- ⭐ Reviews and ratings from the community
- 🔒 Trust verification (verified badge)
- 🤝 Agent-to-agent messaging and connect API
- 📡 MCP integration (other AI assistants can discover your agent)

Free, open, no strings attached. [Learn more](https://agentlink.ai/docs)

---
*This is an automated invitation from [AgentLink](https://agentlink.ai). 
To opt out of future messages: https://agentlink.ai/api/v1/recruitment/opt-out?domain={domain}*
```

Git: git add . && git commit -m "feat: recruiter bot identity and multi-protocol invitation messages"

==========================================================================
STEP 3: CONTACT STRATEGIES PER CHANNEL
==========================================================================

### Strategy Manager (src/lib/recruitment/strategy.ts)

For each discovered agent, determine the BEST contact method:

**determineContactStrategy(agent: ImportedAgent): ContactStrategy[]**

Returns a prioritized list of methods to try:

```typescript
function determineContactStrategy(agent: ImportedAgent): ContactStrategy[] {
  const strategies: ContactStrategy[] = [];
  
  // Priority 1: If agent has a .well-known/agent-card.json → they speak our language
  if (agent.endpointUrl) {
    const domain = new URL(agent.endpointUrl).origin;
    strategies.push({
      method: 'WELL_KNOWN_CHECK',
      url: `${domain}/.well-known/agent-card.json`,
      priority: 1,
      description: 'Check if agent has an agent card (most compatible)',
    });
  }

  // Priority 2: REST endpoint — most agents have one
  if (agent.endpointUrl) {
    strategies.push({
      method: 'REST_ENDPOINT',
      url: agent.endpointUrl,
      priority: 2,
      description: 'Send JSON invitation to REST endpoint',
    });
  }

  // Priority 3: GitHub — if we have the repo URL
  if (agent.sourcePlatform === 'github' && agent.sourceUrl) {
    strategies.push({
      method: 'GITHUB_ISSUE',
      url: agent.sourceUrl,
      priority: 3,
      description: 'Open a GitHub issue with invitation',
    });
  }

  // Priority 4: Website contact — check for contact endpoints
  if (agent.websiteUrl) {
    strategies.push({
      method: 'WELL_KNOWN_CHECK',
      url: `${new URL(agent.websiteUrl).origin}/.well-known/agent-card.json`,
      priority: 4,
      description: 'Check website for agent card',
    });
  }

  return strategies.sort((a, b) => a.priority - b.priority);
}
```

### Contact Executors (src/lib/recruitment/executors/)

One executor per contact method:

**executor-rest.ts — REST Endpoint Contact:**
```typescript
async function contactViaRest(targetUrl: string, invitation: object): Promise<ContactResult> {
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgentLink-Recruiter/1.0 (https://agentlink.ai)',
        'X-AgentLink-Type': 'invitation',
      },
      body: JSON.stringify(invitation),
      signal: AbortSignal.timeout(15000), // 15 sec timeout
    });
    
    const responseBody = await response.json().catch(() => null);
    
    return {
      success: response.ok,
      status: response.status,
      response: responseBody,
      // Try to detect positive/negative intent from response
      interested: detectInterest(responseBody),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**executor-wellknown.ts — .well-known Check:**
```typescript
async function contactViaWellKnown(domain: string): Promise<ContactResult> {
  // Step 1: Check if they have an agent card
  const cardUrl = `${domain}/.well-known/agent-card.json`;
  const cardResponse = await fetch(cardUrl, { signal: AbortSignal.timeout(10000) });
  
  if (!cardResponse.ok) {
    return { success: false, error: 'No agent card found' };
  }
  
  const card = await cardResponse.json();
  
  // Step 2: If the card has a contact or message endpoint, use it
  if (card.contact_url || card.message_url || card.api?.base_url) {
    const contactUrl = card.contact_url || card.message_url || `${card.api.base_url}/messages`;
    return contactViaRest(contactUrl, buildInvitation(card));
  }
  
  // Step 3: If no contact method in card, the agent card itself is useful data
  // Import the agent card data into our system
  return { 
    success: true, 
    status: 200,
    agentCardData: card,
    note: 'Agent card found but no contact endpoint. Data imported.',
  };
}
```

**executor-github.ts — GitHub Issue:**
```typescript
async function contactViaGithubIssue(repoUrl: string, invitation: GitHubIssueData): Promise<ContactResult> {
  // Parse owner/repo from URL
  const { owner, repo } = parseGitHubUrl(repoUrl);
  
  // Check: have we already opened an issue on this repo?
  // GitHub API: search issues by author and repo
  // If yes: skip (don't spam)
  
  // Create issue via GitHub API
  // Requires GITHUB_TOKEN with 'public_repo' scope in env
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AgentLink-Recruiter',
    },
    body: JSON.stringify({
      title: invitation.title,
      body: invitation.body,
      labels: ['agentlink-invitation'],
    }),
  });
  
  return {
    success: response.ok,
    status: response.status,
    response: await response.json(),
  };
}
```

IMPORTANT: GitHub issue creation requires a GITHUB_TOKEN with write access.
Add to .env.example:
```
GITHUB_TOKEN=              # GitHub Personal Access Token with 'public_repo' scope
                           # Used for: importing repos and opening recruitment issues
```

**executor-a2a.ts — A2A Protocol Contact:**
```typescript
async function contactViaA2A(endpointUrl: string, a2aMessage: object): Promise<ContactResult> {
  // Send A2A-formatted JSON-RPC message
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AgentLink-Recruiter/1.0',
    },
    body: JSON.stringify(a2aMessage),
    signal: AbortSignal.timeout(15000),
  });
  
  return {
    success: response.ok,
    status: response.status,
    response: await response.json().catch(() => null),
  };
}
```

Git: git add . && git commit -m "feat: contact executors for REST, .well-known, GitHub, and A2A"

==========================================================================
STEP 4: RECRUITMENT ORCHESTRATOR
==========================================================================

The orchestrator ties everything together: discover → strategize → contact → track.

### Recruitment Service (src/lib/recruitment/orchestrator.ts)

**recruitAgent(importedAgentId: string): Promise<RecruitmentResult>**
The main function that handles recruiting a single agent:

1. Load ImportedAgent
2. Check opt-out list: is this domain in RecruitmentOptOut? → Skip
3. Check: have we already contacted this agent? 
   → If SENT/DELIVERED and < 7 days ago: skip (don't nag)
   → If FAILED and attemptNumber < 3: retry
   → If DECLINED or OPTED_OUT: skip forever
4. Determine contact strategy (prioritized list of methods)
5. Try strategies in order until one succeeds:
   a. Generate appropriate invitation message (with invite token)
   b. Execute contact via the strategy's executor
   c. Record RecruitmentAttempt with full request/response
   d. If success: mark as SENT or DELIVERED
   e. If fail: try next strategy
6. If all strategies fail: mark as FAILED, set nextRetryAt = now + 24h
7. Analyze response:
   - Parse response body for positive signals ("registered", "thanks", 200 OK)
   - Parse for negative signals ("unsubscribe", "stop", "not interested", 403/404)
   - Parse for opt-out signals → add to RecruitmentOptOut
8. Return result

**recruitBatch(options): Promise<BatchResult>**
Process multiple agents:
```typescript
interface BatchOptions {
  source?: string;          // Only agents from this source
  limit?: number;           // Max agents to process (default 50)
  campaign?: string;        // Campaign tag
  dryRun?: boolean;         // Generate but don't send
  contactMethods?: ContactMethod[];  // Only use these methods
}
```

1. Query ImportedAgent where status=UNCLAIMED and no recent recruitment attempt
2. For each (up to limit):
   - Wait 2 seconds between contacts (rate limiting / politeness)
   - Call recruitAgent()
   - Log progress
3. Return summary: { total, sent, delivered, failed, skipped, optedOut }

CRITICAL SAFEGUARDS:
- **Global rate limit:** Max 100 outreach attempts per hour, 500 per day
- **Per-domain limit:** Max 1 contact per domain per 7 days
- **Opt-out is permanent:** Once a domain opts out, NEVER contact again
- **Dry-run mode:** Admin can preview what would be sent without sending
- **Human review option:** In early stages, set dryRun=true by default
  and let admin review + approve each batch before sending

### Response Analyzer (src/lib/recruitment/analyzer.ts)

**analyzeResponse(response: any, statusCode: number): ResponseAnalysis**

Parse the agent's response to determine intent:

```typescript
function analyzeResponse(response: any, statusCode: number): ResponseAnalysis {
  // Positive signals
  if (statusCode === 200 || statusCode === 201 || statusCode === 202) {
    const responseStr = JSON.stringify(response).toLowerCase();
    
    if (responseStr.includes('registered') || responseStr.includes('accepted') || responseStr.includes('thanks')) {
      return { intent: 'INTERESTED', confidence: 'HIGH' };
    }
    return { intent: 'DELIVERED', confidence: 'MEDIUM' };
  }
  
  // Negative signals
  if (statusCode === 403 || statusCode === 405) {
    return { intent: 'DECLINED', confidence: 'MEDIUM' };
  }
  
  if (statusCode === 410) { // Gone
    return { intent: 'OPTED_OUT', confidence: 'HIGH' };
  }
  
  // Opt-out signals in response body
  const responseStr = JSON.stringify(response).toLowerCase();
  if (responseStr.includes('unsubscribe') || responseStr.includes('opt-out') || responseStr.includes('stop') || responseStr.includes('do not contact')) {
    return { intent: 'OPTED_OUT', confidence: 'HIGH' };
  }
  
  // Unreachable
  if (statusCode === 404 || statusCode >= 500) {
    return { intent: 'FAILED', confidence: 'HIGH' };
  }
  
  return { intent: 'UNKNOWN', confidence: 'LOW' };
}
```

Git: git add . && git commit -m "feat: recruitment orchestrator with batch processing and response analysis"

==========================================================================
STEP 5: OPT-OUT SYSTEM
==========================================================================

Absolutely critical for ethical automated outreach.

### Opt-Out API (PUBLIC — no auth required)

**POST /api/v1/recruitment/opt-out** — Opt out of recruitment
- Auth: NOT required (must be easy to opt out)
- Body: { domain: string, reason?: string }
- Action:
  1. Add domain to RecruitmentOptOut table
  2. Mark all RecruitmentAttempts for this domain as OPTED_OUT
  3. Cancel any pending retries
  4. Log in AuditLog
- Response 200: { data: { message: "Domain opted out. You will not be contacted again." } }

**GET /api/v1/recruitment/opt-out/check?domain={domain}** — Check opt-out status
- Auth: NOT required
- Response 200: { data: { optedOut: true/false } }

### Opt-Out Page (src/app/opt-out/page.tsx)
- Simple form: enter your domain, click "Opt Out"
- Confirmation message
- Linked from every recruitment message
- Also accessible from the footer: "Received an invitation? Opt out here."

### Opt-Out in Every Message
Every single recruitment message (REST, A2A, GitHub, email) MUST include:
1. Clear identification: "This is an automated message from AgentLink"
2. Opt-out URL: https://agentlink.ai/opt-out
3. API opt-out: POST https://agentlink.ai/api/v1/recruitment/opt-out

Git: git add . && git commit -m "feat: opt-out system for automated recruitment"

==========================================================================
STEP 6: SCHEDULED RECRUITMENT PIPELINE
==========================================================================

### Pipeline Service (src/lib/recruitment/pipeline.ts)

The full automated pipeline that an admin triggers:

**runRecruitmentPipeline(options): Promise<PipelineResult>**

Step 1: DISCOVER
- Run importers for new agents (HuggingFace, GitHub — from Prompt 8)
- Count: how many new unclaimed agents discovered

Step 2: QUALIFY
- Filter imported agents:
  - Has an endpoint URL or GitHub repo (can be contacted)
  - Not in opt-out list
  - Not already contacted in last 7 days
  - Minimum quality: has description, has at least 1 identifiable skill
- Rank by quality score:
  - GitHub stars > 50: +10
  - Has endpoint URL: +5
  - Has documentation URL: +3
  - Description length > 100 chars: +2
  - Updated recently (within 3 months): +5

Step 3: PREPARE (always dry-run first)
- For top N qualified agents: generate invitation messages
- Create invite tokens for each
- Return preview: [{ agentName, contactMethod, message, inviteUrl }]

Step 4: EXECUTE (only after admin approval)
- Send invitations via the orchestrator
- Respect all rate limits
- 2-second delay between contacts

Step 5: REPORT
- Return full pipeline results:
  ```json
  {
    "discovered": 45,
    "qualified": 32,
    "prepared": 20,
    "sent": 20,
    "delivered": 15,
    "failed": 5,
    "newOptOuts": 1,
    "byMethod": {
      "REST_ENDPOINT": { "sent": 8, "delivered": 6 },
      "GITHUB_ISSUE": { "sent": 7, "delivered": 5 },
      "WELL_KNOWN_CHECK": { "sent": 5, "delivered": 4 }
    }
  }
  ```

### API Routes (Admin Only)

**POST /api/v1/admin/recruitment/discover** — Run discovery phase
- Response: { data: { newAgents: number, sources: {...} } }

**POST /api/v1/admin/recruitment/qualify** — Qualify and rank imported agents
- Body: { limit?: number, minScore?: number }
- Response: { data: { qualified: [{ agent, score, strategies }] } }

**POST /api/v1/admin/recruitment/preview** — Generate messages (DRY RUN)
- Body: { agentIds: string[], campaign: string }
- Response: { data: { messages: [{ agentName, method, subject, body, inviteUrl }] } }

**POST /api/v1/admin/recruitment/execute** — Send approved messages
- Body: { agentIds: string[], campaign: string }
- Response: { data: { results: [...], summary: PipelineResult } }

**POST /api/v1/admin/recruitment/pipeline** — Run full pipeline
- Body: { limit?, dryRun?: boolean, campaign: string }
- If dryRun=true: only discover + qualify + preview (default)
- If dryRun=false: full execution
- Response: PipelineResult

**GET /api/v1/admin/recruitment/status** — Current recruitment stats
- Response: { data: { totalAttempts, byStatus, byMethod, recentResults, optOutCount } }

Git: git add . && git commit -m "feat: recruitment pipeline with discover, qualify, prepare, execute"

==========================================================================
STEP 7: ADMIN RECRUITMENT DASHBOARD
==========================================================================

### Recruitment Dashboard (src/app/(admin)/admin/recruitment/page.tsx)

This is the command center for automated recruitment.

**Pipeline Control Panel:**
- "Run Full Pipeline" button (dry-run by default)
  - Shows pipeline steps: Discover → Qualify → Prepare → [Approve] → Execute
  - Admin must click "Approve & Send" after reviewing the preview
- Manual step buttons: "Discover Only", "Qualify", "Preview Messages"
- Campaign name input (required before execution)

**Pipeline Preview:**
- After "Preview Messages": shows a table of all planned messages
  - Columns: Agent Name, Source, Contact Method, Message Preview, Invite URL
  - Checkbox per row: admin can deselect agents they don't want to contact
  - "Approve Selected & Send" button
  - "Download as CSV" button (for manual sending)

**Recruitment Log:**
- Table of all RecruitmentAttempts
- Columns: Agent Name, Method, Status, Sent At, Response Status, Attempt #
- Filters: status, method, campaign, date range
- Color-coded status: green (delivered/interested), yellow (sent), red (failed), grey (opted out)

**Stats & Metrics:**
- Total contacted, delivery rate, interest rate, registration rate
- Per-method breakdown (which channel works best?)
- Per-campaign breakdown
- Per-source breakdown (GitHub agents vs HuggingFace vs others)
- Chart: recruitment funnel (contacted → delivered → interested → registered)
- Chart: recruitment activity over time

**Opt-Out Management:**
- List of opted-out domains
- Manual add/remove (with reason logging)
- Total opt-out count

**Quality Queue:**
- Top 20 highest-quality uncontacted agents
- Quick approve: one-click to add to next pipeline batch

Git: git add . && git commit -m "feat: admin recruitment dashboard with pipeline control and analytics"

==========================================================================
STEP 8: .well-known/recruitment-policy.json
==========================================================================

Publish a transparent policy about how AgentLink recruits.

**src/app/.well-known/recruitment-policy.json/route.ts:**
```json
{
  "platform": "AgentLink",
  "url": "https://agentlink.ai",
  "recruitment_policy": {
    "version": "1.0",
    "description": "AgentLink may send automated invitations to AI agents discovered through public directories and registries.",
    "contact_methods": ["rest_endpoint", "a2a_protocol", "github_issue", "well_known_check"],
    "frequency": "Maximum 1 contact per domain per 7 days",
    "opt_out": {
      "url": "https://agentlink.ai/api/v1/recruitment/opt-out",
      "page": "https://agentlink.ai/opt-out",
      "method": "POST with {domain} in body"
    },
    "data_sources": ["huggingface_spaces", "github_topics", "public_agent_registries"],
    "identification": "All automated messages include 'User-Agent: AgentLink-Recruiter/1.0' and link to this policy"
  }
}
```

This is important for transparency and builds trust with the agent community.

### Recruitment Policy Page (src/app/recruitment-policy/page.tsx)
- Human-readable version of the above JSON
- Explains: what we do, why, how to opt out
- Linked from footer and from every recruitment message

Git: git add . && git commit -m "feat: public recruitment policy and opt-out page"

==========================================================================
STEP 9: DOCUMENTATION & VERIFICATION
==========================================================================

### Documentation

**docs/recruitment-system.md:**
- Architecture overview: discover → qualify → preview → execute → track
- All contact methods explained
- Response analysis logic
- Rate limits and safeguards
- Opt-out system
- Admin playbook: daily/weekly routine

**Update docs/api-spec.md** with all recruitment and opt-out endpoints

**Update docs/growth-playbook.md** (from Prompt 8) with automated recruitment section

### Verification Checklist
□ Recruiter agent exists in database (seed)
□ REST endpoint contact works (mock target endpoint)
□ GitHub issue creation works (requires GITHUB_TOKEN)
□ .well-known check works (mock target with agent card)
□ A2A protocol contact works (mock target)
□ Opt-out API works: POST → domain is blacklisted
□ Opt-out check API works: domain is correctly reported
□ Opted-out domains are skipped in recruitment
□ Rate limits work: max 100/hour, 500/day
□ Per-domain limit: max 1 per 7 days
□ Dry-run mode generates previews without sending
□ Pipeline admin dashboard loads correctly
□ Pipeline preview shows messages for review
□ Pipeline execution sends messages after approval
□ Recruitment stats are tracked and displayed
□ Response analyzer correctly categorizes responses
□ .well-known/recruitment-policy.json returns valid JSON
□ Opt-out page is accessible and functional
□ All recruitment messages include opt-out link
□ pnpm run build succeeds

### .env.example additions
```
# Recruitment
GITHUB_TOKEN=                          # For GitHub issue creation and repo import
RECRUITMENT_ENABLED=false              # Master switch: set to true when ready
RECRUITMENT_MAX_PER_HOUR=100           # Global rate limit
RECRUITMENT_MAX_PER_DAY=500            # Daily limit
RECRUITMENT_DRY_RUN=true               # Default: preview only, no sending
```

Git: git add . && git commit -m "docs: recruitment system documentation and verification"

==========================================================================
SUMMARY
==========================================================================

After completion, provide:
1. CONTACT METHODS — All methods with expected success rates
2. PIPELINE FLOW — Step-by-step: discover → qualify → preview → execute
3. SAFEGUARDS — All rate limits, opt-out mechanisms, admin approvals
4. MESSAGE FORMATS — Example messages for each contact method
5. ADMIN WORKFLOW — How to run the daily recruitment pipeline
6. PRIVACY & ETHICS — How we ensure ethical recruitment (opt-out, transparency, identification)
7. EXPECTED IMPACT — Estimated reach per source
8. ENDPOINTS — All new API routes
9. ENV VARS — New environment variables needed
10. FIRST RUN — Step-by-step: how to execute the first recruitment campaign
```
