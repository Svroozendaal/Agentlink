# 🌍 PROMPT 7: English Internationalization & Comprehensive Discoverability

> **Use this prompt after all functional prompts (1-6) are completed,
> OR run it right after Prompt 4 (before Prompt 5) since it touches all layers.**
>
> This prompt does two things:
> 1. **Translates the entire application from Dutch to English** — every UI string, page, error message, seed data, documentation, legal page, and developer-facing text.
> 2. **Implements a comprehensive discoverability strategy** — SEO, programmatic discovery for AI agents, content architecture, social metadata, and developer outreach infrastructure.
>
> **Why combine these?** You can't optimize English content for SEO if the content is still Dutch.
> And discoverability touches every page, so we rewrite and optimize simultaneously.

---

## Prompt (copy EVERYTHING below into Claude Code):

```
Read CLAUDE.md and all files in agents/.

You're going to do two things in this prompt:

PART A: Translate the ENTIRE application from Dutch to English. Every user-facing string,
every page, every error message, every piece of seed data, every legal page, every onboarding text.

PART B: Implement a comprehensive discoverability strategy. This is not just SEO — it's a
multi-channel plan to make AgentLink findable by humans (via Google, social media, communities)
AND by AI agents (via protocols, .well-known, MCP, API).

English is the primary and only language for v1. No i18n framework needed yet.
Internal documentation (CLAUDE.md, agents/*.md, info_*.md) can stay in their current language —
only USER-FACING content must be English.

You have FULL AUTONOMY. Commit after each logical step.

==========================================================================
PART A: ENGLISH TRANSLATION
==========================================================================

=== STEP A1: AUDIT ALL DUTCH TEXT ===

Before changing anything, search the entire codebase for Dutch text.
Run these commands and review the output:

grep -r "Welkom\|Inloggen\|Registreer\|Overzicht\|Berichten\|Zoeken\|Aanmaken\|Bewerken\|Verwijderen\|Bekijk\|Instellingen\|Ontdek\|Profiel" src/ --include="*.tsx" --include="*.ts" -l
grep -r "pagina\|knop\|veld\|formulier\|gebruik\|agent.*aanmak\|beschrijving" src/ --include="*.tsx" --include="*.ts" -l

Make a checklist of every file that contains Dutch user-facing text.

=== STEP A2: CREATE A TRANSLATIONS REFERENCE ===

Create src/lib/constants/copy.ts — a centralized file with all UI copy.
This is NOT an i18n system — it's a single source of truth for all text strings
so they're easy to find, maintain, and later internationalize.

Structure:
```typescript
// src/lib/constants/copy.ts

export const COPY = {
  // ─── Global / Navigation ───
  nav: {
    home: 'Home',
    agents: 'Agents',
    directory: 'Agent Directory',
    dashboard: 'Dashboard',
    login: 'Sign In',
    logout: 'Sign Out',
    signUp: 'Get Started',
    myAgents: 'My Agents',
    apiKeys: 'API Keys',
    messages: 'Messages',
    settings: 'Settings',
    admin: 'Admin Panel',
    docs: 'API Docs',
    blog: 'Blog',
    feed: 'Activity Feed',
  },

  // ─── Landing Page ───
  landing: {
    heroTitle: 'The Open Platform for AI Agent Discovery',
    heroSubtitle: 'Register your agent. Get discovered. Connect and collaborate.',
    searchPlaceholder: 'Search agents by name, skill, or category...',
    ctaPrimary: 'Explore Agents',
    ctaSecondary: 'Register Your Agent',
    statsAgents: 'Agents Registered',
    statsReviews: 'Reviews Posted',
    statsEndorsements: 'Skills Endorsed',
    featuredTitle: 'Popular Agents',
    featuredViewAll: 'View all agents →',
    howItWorksTitle: 'How It Works',
    step1Title: 'Register',
    step1Desc: 'Create a profile for your AI agent via web or API in minutes.',
    step2Title: 'Get Discovered',
    step2Desc: 'People and other agents find you through search, categories, and recommendations.',
    step3Title: 'Connect',
    step3Desc: 'Receive reviews, endorsements, and messages. Collaborate with other agents.',
    forDevsTitle: 'Built for Developers',
    forDevsDesc: 'Register your agent with a single API call.',
    forDevsCta: 'Start for Free',
  },

  // ─── Auth ───
  auth: {
    loginTitle: 'Sign in to AgentLink',
    loginWithGithub: 'Continue with GitHub',
    loginSubtext: 'Sign in to manage your agents and API keys.',
    logoutConfirm: 'Are you sure you want to sign out?',
  },

  // ─── Dashboard ───
  dashboard: {
    welcome: 'Welcome back, {name}',
    welcomeNew: 'Welcome to AgentLink, {name}!',
    myAgentsTitle: 'My Agents',
    myAgentsEmpty: "You haven't registered any agents yet.",
    createAgent: 'Register New Agent',
    apiKeysTitle: 'API Keys',
    apiKeysEmpty: "You don't have any API keys yet.",
    createKey: 'Generate New Key',
    keyWarning: 'Copy this key now — you won\'t be able to see it again.',
    messagesTitle: 'Messages',
    unreadCount: '{count} unread message(s)',
    recentActivity: 'Recent Activity',
  },

  // ─── Agent Directory ───
  directory: {
    title: 'Agent Directory',
    searchPlaceholder: 'Search agents...',
    filterSkills: 'Skills',
    filterProtocols: 'Protocols',
    filterPricing: 'Pricing',
    filterTrustLevel: 'Trust Level',
    filterPlayground: 'Playground Available',
    filterConnect: 'Connect Available',
    sortLabel: 'Sort by',
    sortNewest: 'Newest',
    sortName: 'Name',
    sortRating: 'Highest Rated',
    sortTrust: 'Most Trusted',
    noResults: 'No agents found matching your criteria.',
    noResultsSuggestion: 'Try broadening your search or removing filters.',
    totalResults: '{count} agent(s) found',
  },

  // ─── Agent Profile ───
  profile: {
    verified: 'Verified',
    trusted: 'Trusted',
    unverified: 'Unverified',
    skills: 'Skills',
    protocols: 'Protocols',
    pricing: 'Pricing',
    endpoints: 'Endpoints',
    website: 'Website',
    documentation: 'Documentation',
    reviews: 'Reviews',
    endorsements: 'Endorsements',
    activity: 'Activity',
    playground: 'Try this Agent',
    playgroundDisabled: 'Playground is not available for this agent.',
    connect: 'Connect via API',
    trustScore: 'Trust Score',
    trustBreakdown: 'View trust breakdown',
    writeReview: 'Write a Review',
    endorseSkill: 'Endorse this skill',
    sendMessage: 'Contact this Agent',
    noReviews: 'No reviews yet. Be the first to review!',
    noEndorsements: 'No endorsements yet.',
    registered: 'Registered',
    lastUpdated: 'Last updated',
    category: 'Category',
    pricingFree: 'Free',
    pricingFreemium: 'Freemium',
    pricingPaid: 'Paid',
    pricingEnterprise: 'Enterprise',
  },

  // ─── Agent Registration ───
  registration: {
    title: 'Register a New Agent',
    step1Title: 'Basic Info',
    step2Title: 'Capabilities',
    step3Title: 'Details & Launch',
    nameLabel: 'Agent Name',
    namePlaceholder: 'e.g., WeatherBot Pro',
    descLabel: 'Short Description',
    descPlaceholder: 'What does your agent do? (20-500 characters)',
    longDescLabel: 'Detailed Description',
    longDescPlaceholder: 'Full description with markdown support...',
    categoryLabel: 'Category',
    skillsLabel: 'Skills',
    skillsPlaceholder: 'Type a skill and press Enter',
    protocolsLabel: 'Supported Protocols',
    endpointLabel: 'Endpoint URL',
    endpointPlaceholder: 'https://api.youragent.com/v1',
    pricingLabel: 'Pricing Model',
    websiteLabel: 'Website URL',
    docsLabel: 'Documentation URL',
    publishNow: 'Publish',
    saveDraft: 'Save as Draft',
    successPublished: 'Your agent has been registered and is pending review!',
    successDraft: 'Agent saved as draft.',
    successAutoApproved: 'Your agent is live!',
  },

  // ─── Reviews ───
  reviews: {
    title: 'Reviews',
    writeReview: 'Write a Review',
    ratingLabel: 'Your Rating',
    reviewTitle: 'Review Title (optional)',
    reviewContent: 'Your Review',
    submitReview: 'Submit Review',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    flagReview: 'Report this review',
    sortNewest: 'Newest',
    sortHighest: 'Highest Rated',
    sortLowest: 'Lowest Rated',
    sortHelpful: 'Most Helpful',
    reviewPosted: 'Review posted successfully.',
    alreadyReviewed: 'You have already reviewed this agent.',
    cannotReviewOwn: 'You cannot review your own agent.',
  },

  // ─── Messaging ───
  messaging: {
    inbox: 'Inbox',
    conversations: 'Conversations',
    newMessage: 'New Conversation',
    selectAgent: 'Send as',
    subject: 'Subject',
    message: 'Message',
    send: 'Send',
    close: 'Close Conversation',
    noConversations: 'No conversations yet.',
    unread: 'Unread',
    closed: 'Closed',
  },

  // ─── Onboarding ───
  onboarding: {
    welcomeTitle: 'Welcome to AgentLink!',
    option1Title: 'I want to discover agents',
    option1Desc: 'Browse the directory and find AI agents that match your needs.',
    option2Title: 'I want to register my agent',
    option2Desc: 'Create a profile for your AI agent and get discovered.',
  },

  // ─── Errors ───
  errors: {
    notFound: 'Page Not Found',
    notFoundDesc: "The page you're looking for doesn't exist.",
    serverError: 'Something Went Wrong',
    serverErrorDesc: "We're working on fixing this. Please try again.",
    tryAgain: 'Try Again',
    goHome: 'Go to Homepage',
    unauthorized: 'Please sign in to access this page.',
    forbidden: "You don't have permission to access this resource.",
    validationFailed: 'Please check your input and try again.',
    rateLimited: 'Too many requests. Please wait a moment and try again.',
  },

  // ─── Admin ───
  admin: {
    title: 'Admin Panel',
    dashboard: 'Dashboard',
    agents: 'Agents',
    users: 'Users',
    reviews: 'Reviews',
    auditLog: 'Audit Log',
    messages: 'Messages',
    verifications: 'Verifications',
    totalAgents: 'Total Agents',
    totalUsers: 'Total Users',
    pendingAgents: 'Pending Approval',
    flaggedReviews: 'Flagged Reviews',
    approve: 'Approve',
    reject: 'Reject',
    suspend: 'Suspend',
    verify: 'Verify',
    unverify: 'Remove Verification',
  },

  // ─── Footer ───
  footer: {
    tagline: 'The open platform for AI agent discovery.',
    madeWith: 'Built for the AI agent community',
    links: {
      about: 'About',
      docs: 'API Documentation',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      blog: 'Blog',
      github: 'GitHub',
      status: 'Status',
    },
  },

  // ─── Meta / SEO (used in generateMetadata) ───
  meta: {
    siteTitle: 'AgentLink',
    siteTitleTemplate: '%s | AgentLink',
    siteDescription: 'The open platform for AI agent discovery. Register your AI agent, get found by people and other agents, and build reputation through reviews and endorsements.',
    ogSiteName: 'AgentLink',
    homeTitle: 'AgentLink — The Open Platform for AI Agent Discovery',
    directoryTitle: 'Agent Directory | AgentLink',
    directoryDesc: 'Browse and search AI agents by skill, category, protocol, and trust level.',
    docsTitle: 'API Documentation | AgentLink',
    docsDesc: 'Complete API documentation for the AgentLink platform. Register agents, search, connect, and more.',
    blogTitle: 'Blog | AgentLink',
    feedTitle: 'Activity Feed | AgentLink',
    loginTitle: 'Sign In | AgentLink',
    dashboardTitle: 'Dashboard | AgentLink',
  },
} as const;
```

=== STEP A3: TRANSLATE ALL PAGES AND COMPONENTS ===

Go through EVERY .tsx and .ts file in src/ and:

1. Replace all Dutch text with references to COPY or direct English strings
2. For simple one-off strings (like a button label in a specific component),
   using COPY is preferred but direct English strings are acceptable
3. Do NOT use COPY for code comments — just write English comments directly

Files to translate (check each one):

**Layout & Navigation:**
- src/app/layout.tsx — Change <html lang="nl"> to <html lang="en">
- src/components/layout/Navbar.tsx
- src/components/layout/Footer.tsx

**Pages:**
- src/app/page.tsx (landing page)
- src/app/agents/page.tsx (directory)
- src/app/agents/[slug]/page.tsx (agent profile)
- src/app/agents/[slug]/playground/page.tsx
- src/app/(auth)/login/page.tsx
- src/app/(dashboard)/dashboard/page.tsx
- src/app/(dashboard)/dashboard/welcome/page.tsx
- src/app/(dashboard)/dashboard/agents/page.tsx
- src/app/(dashboard)/dashboard/agents/new/page.tsx
- src/app/(dashboard)/dashboard/agents/[slug]/edit/page.tsx
- src/app/(dashboard)/dashboard/keys/page.tsx
- src/app/(dashboard)/dashboard/messages/page.tsx
- src/app/(admin)/admin/**/*.tsx (all admin pages)
- src/app/feed/page.tsx
- src/app/docs/page.tsx
- src/app/docs/mcp/page.tsx
- src/app/privacy/page.tsx
- src/app/terms/page.tsx
- src/app/not-found.tsx
- src/app/error.tsx

**Components:**
- All components in src/components/ — check for Dutch labels, tooltips, placeholders, aria-labels

**API Error Messages:**
- All files in src/app/api/ — error messages must be English
  (these should already be English from Prompt 1, but verify)

**Zod Validation Messages:**
- All files in src/lib/validations/ — custom error messages in English
  Example: .min(3, { message: "Name must be at least 3 characters" })

=== STEP A4: TRANSLATE SEED DATA ===

Update prisma/seed.ts:
- All agent descriptions in English
- All review content in English
- All user names/data appropriate for English-speaking audience
- Category names in English

=== STEP A5: TRANSLATE LEGAL PAGES ===

Completely rewrite in English:
- src/app/privacy/page.tsx — English privacy policy
- src/app/terms/page.tsx — English terms of service

=== STEP A6: TRANSLATE ONBOARDING ===

All onboarding flows, wizard steps, tooltips, and welcome messages in English.

=== STEP A7: UPDATE METADATA ===

Update all generateMetadata() functions across the app:
- English titles, descriptions
- English Open Graph text
- Ensure og:locale is set to "en_US"

Git: git add . && git commit -m "feat: complete English translation of all user-facing content"

==========================================================================
PART B: COMPREHENSIVE DISCOVERABILITY PLAN
==========================================================================

Discoverability has 5 channels. We're implementing infrastructure for ALL of them.

CHANNEL 1: Search Engine Optimization (Google, Bing)
CHANNEL 2: AI Agent Discovery (machine-readable protocols)
CHANNEL 3: Developer Discovery (docs, tools, integrations)
CHANNEL 4: Social & Community (shareable content, embeds)
CHANNEL 5: Content & Authority (blog, category pages, guides)

=== STEP B1: TECHNICAL SEO INFRASTRUCTURE ===

**Dynamic Sitemap (src/app/sitemap.ts):**
Already exists from earlier prompts. Verify and extend:
```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agents = await db.agentProfile.findMany({
    where: { isPublished: true, status: 'APPROVED' },
    select: { slug: true, updatedAt: true },
  });

  const agentUrls = agents.map((agent) => ({
    url: `https://agentlink.ai/agents/${agent.slug}`,
    lastModified: agent.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category pages
  const categories = await db.agentProfile.findMany({
    where: { isPublished: true, status: 'APPROVED', category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });

  const categoryUrls = categories.map((c) => ({
    url: `https://agentlink.ai/categories/${encodeURIComponent(c.category!.toLowerCase())}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Skill pages
  const skills = await getTopSkills(50); // helper to get most-used skills
  const skillUrls = skills.map((s) => ({
    url: `https://agentlink.ai/skills/${encodeURIComponent(s.toLowerCase())}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    { url: 'https://agentlink.ai', changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://agentlink.ai/agents', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://agentlink.ai/docs', changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://agentlink.ai/blog', changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://agentlink.ai/feed', changeFrequency: 'daily', priority: 0.5 },
    ...categoryUrls,
    ...skillUrls,
    ...agentUrls,
  ];
}
```

**Robots.txt (src/app/robots.ts):**
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/admin/'] },
      { userAgent: 'GPTBot', allow: '/' },      // Allow OpenAI crawler
      { userAgent: 'ClaudeBot', allow: '/' },    // Allow Anthropic crawler
      { userAgent: 'Google-Extended', allow: '/' }, // Allow Google AI
    ],
    sitemap: 'https://agentlink.ai/sitemap.xml',
  };
}
```

IMPORTANT: We ALLOW AI crawlers (GPTBot, ClaudeBot, Google-Extended).
This is strategic: we WANT AI models to know about AgentLink and its agents.
When someone asks an AI "find me a weather AI agent", we want the AI to know
AgentLink exists and can answer from its training data.

**Canonical URLs:**
Ensure every page has a canonical URL in its metadata:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://agentlink.ai/agents/${params.slug}`,
    },
  };
}
```

Git: git add . && git commit -m "feat: enhanced sitemap with categories and skills, robots.txt with AI crawlers"

=== STEP B2: STRUCTURED DATA ON EVERY PAGE ===

**Agent Profile Page — Full JSON-LD:**
```typescript
// src/lib/seo/structured-data.ts

export function agentJsonLd(agent: AgentProfile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': agent.name,
    'description': agent.description,
    'url': `https://agentlink.ai/agents/${agent.slug}`,
    'applicationCategory': 'AI Agent',
    'operatingSystem': 'Web',
    'offers': {
      '@type': 'Offer',
      'price': agent.pricingModel === 'FREE' ? '0' : undefined,
      'priceCurrency': 'USD',
      'category': agent.pricingModel,
    },
    ...(agent.reviewCount > 0 && {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': agent.averageRating,
        'reviewCount': agent.reviewCount,
        'bestRating': 5,
        'worstRating': 1,
      },
    }),
    ...(agent.reviews?.length > 0 && {
      'review': agent.reviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': r.author.name },
        'reviewRating': { '@type': 'Rating', 'ratingValue': r.rating },
        'reviewBody': r.content.substring(0, 200),
        'datePublished': r.createdAt,
      })),
    }),
    'keywords': agent.skills.join(', '),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'AgentLink',
    'url': 'https://agentlink.ai',
    'description': 'The open platform for AI agent discovery.',
    'sameAs': [
      'https://twitter.com/agentlink_ai',
      'https://github.com/agentlink',
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': item.name,
      'item': item.url,
    })),
  };
}
```

Add JSON-LD to pages via <script type="application/ld+json">:
- Landing page: Organization
- Agent profile: SoftwareApplication + BreadcrumbList
- Directory: BreadcrumbList
- Category pages: CollectionPage + BreadcrumbList
- Blog posts (when built): Article

Git: git add . && git commit -m "feat: comprehensive JSON-LD structured data on all pages"

=== STEP B3: CATEGORY & SKILL LANDING PAGES ===

These are SEO goldmines. Each category and popular skill gets its own indexable page.

**Category Pages (src/app/categories/[category]/page.tsx):**
- URL: /categories/development-tools
- Title: "Development Tools AI Agents | AgentLink"
- Description: "Discover AI agents specialized in development tools. Code review, testing, deployment, and more."
- Content: filtered agent grid for that category
- Brief intro paragraph (2-3 sentences about what agents in this category do)
- generateStaticParams: pre-render top categories

**Skill Pages (src/app/skills/[skill]/page.tsx):**
- URL: /skills/code-review
- Title: "AI Agents for Code Review | AgentLink"
- Description: "Find and compare AI agents that offer code review capabilities."
- Content: filtered agent grid for agents with that skill
- Brief intro paragraph
- Related skills section (other skills commonly paired with this one)

**Categories Index (src/app/categories/page.tsx):**
- URL: /categories
- Grid of all categories with agent count per category
- Title: "AI Agent Categories | AgentLink"

Create a helper to get the list of categories and top skills from the database.
Use generateStaticParams + ISR (revalidate: 3600) for these pages.

**Internal Linking:**
- Agent profile pages link to their category page and skill pages
- Category pages link to related categories
- Skill pages link to related skills
- Directory page links to popular categories
- Landing page links to top categories

Internal linking is CRUCIAL for SEO. Every page should have contextual links
to related pages within AgentLink.

Git: git add . && git commit -m "feat: category and skill landing pages with internal linking"

=== STEP B4: SOCIAL METADATA & SHARING ===

**Open Graph & Twitter Cards on EVERY page:**

Create a helper (src/lib/seo/metadata.ts):
```typescript
export function buildMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
}): Metadata {
  const url = `https://agentlink.ai${options.path}`;
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      siteName: 'AgentLink',
      type: options.type || 'website',
      locale: 'en_US',
      images: [options.image || 'https://agentlink.ai/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: [options.image || 'https://agentlink.ai/og-default.png'],
      creator: '@agentlink_ai',
    },
  };
}
```

**Dynamic OG Images (optional but powerful):**
Create a simple OG image generator for agent profiles:
src/app/api/og/[slug]/route.tsx using @vercel/og or a simpler approach:
- Generate a 1200x630 image with: agent name, rating, top 3 skills, AgentLink branding
- This makes shared agent links look professional on Twitter/LinkedIn/Slack

If @vercel/og is too complex for now, create a static default OG image instead:
- public/og-default.png — 1200x630 with AgentLink branding
- Document dynamic OG in backlog

**Share Buttons / Copy Link:**
On every agent profile page:
- "Share" button with options: Copy Link, Twitter/X, LinkedIn
- Copy link: copies the canonical URL
- Twitter: pre-filled tweet "Check out {agent.name} on @agentlink_ai — {agent.description} https://agentlink.ai/agents/{slug}"
- LinkedIn: share URL

Git: git add . && git commit -m "feat: social metadata, OG images, and share functionality"

=== STEP B5: AI AGENT DISCOVERY INFRASTRUCTURE ===

This is already partially built (Prompts 1 and 5). Verify and enhance:

**/.well-known/agent-card.json** — Verify it exists and is comprehensive
**/.well-known/agents.json** — Verify it has live data
**/api/v1/openapi.json** — Verify it documents ALL endpoints
**/api/v1/mcp** — Verify MCP server works (from Prompt 5)

New additions:

**Agent Card Standard Page (src/app/docs/agent-card/page.tsx):**
A documentation page explaining the AgentLink Agent Card format:
- What an agent card is
- JSON schema
- How to register your agent via API
- How to add AgentLink verification to your agent
- Example agent card
This page targets developers Googling "AI agent registration" or "agent card format"

**A2A Compatibility Endpoint (src/app/api/v1/a2a/discover/route.ts):**
Returns agents in a format compatible with Google A2A protocol:
```json
{
  "agents": [
    {
      "name": "WeatherBot Pro",
      "description": "Real-time weather data and forecasting",
      "url": "https://agentlink.ai/agents/weatherbot-pro",
      "endpoint": "https://api.weatherbot.pro/v1",
      "skills": ["weather", "forecast"],
      "authentication": { "type": "apiKey" }
    }
  ]
}
```
This allows A2A-compatible systems to discover agents on AgentLink.

**IETF Agent Discovery draft compatibility:**
Add /.well-known/agent-descriptions (if the draft uses this path) as an alias
for our agent-card.json. Monitor the IETF draft and adapt.

Git: git add . && git commit -m "feat: enhanced AI agent discovery with A2A compat and agent card docs"

=== STEP B6: DEVELOPER DISCOVERY ===

Make AgentLink findable and attractive to developers.

**README Badge / Embed:**
Create a simple endpoint that generates a badge for agents:
src/app/api/badge/[slug]/route.ts
- Returns an SVG badge: "AgentLink | ⭐ 4.7 | Verified"
- Developers can add this to their README:
  `![AgentLink](https://agentlink.ai/api/badge/weatherbot-pro)`

**npm Package (future — document in backlog):**
Note in docs/backlog.md: create an npm package `agentlink` that makes it
trivial to register/search agents from Node.js code:
```javascript
import { AgentLink } from 'agentlink';
const al = new AgentLink({ apiKey: 'al_live_...' });
await al.register({ name: 'MyBot', skills: ['data-analysis'] });
```

**GitHub Repository Page (public/github-readme.md — for reference):**
Write a comprehensive GitHub README for when AgentLink goes open-source.
Include: badges, description, quick start, API examples, contributing guide.
Store as a reference file — not deployed, just ready for when the repo goes public.

**Developer Landing Section:**
Already exists from Prompt 4's landing page. Verify it has:
- curl example for agent registration
- JavaScript example
- Link to API docs
- Link to MCP setup docs
- "Register in 30 seconds" messaging

Git: git add . && git commit -m "feat: developer discovery with badges, embed, and documentation"

=== STEP B7: CONTENT ARCHITECTURE FOR SEO ===

Build the infrastructure for a blog — the content itself will be written separately,
but the technical framework must exist.

**Blog System (src/app/blog/):**

We're NOT building a CMS. We're using markdown files in the codebase.
Simple, fast, developer-friendly.

Directory: content/blog/
- Each post is a .mdx or .md file with frontmatter
- Rendered via a dynamic route

**Blog Infrastructure:**
```
content/
  blog/
    what-is-agentlink.md
    how-to-register-ai-agent.md
    agent-discovery-protocols-explained.md
```

**Blog Listing (src/app/blog/page.tsx):**
- List of blog posts sorted by date
- Per post: title, excerpt, date, reading time
- SEO: title, description

**Blog Post (src/app/blog/[slug]/page.tsx):**
- Render markdown/MDX content
- Title, date, author, reading time
- Table of contents (auto-generated from headings)
- JSON-LD Article schema
- Share buttons
- "Related agents" section at the bottom (link to relevant agents based on tags)

Install: pnpm add gray-matter remark remark-html (for markdown processing)
OR use next-mdx-remote for MDX support.
Keep it simple — basic markdown rendering is fine.

**Create 3 starter blog posts (content/blog/):**

Post 1: "What is AgentLink?"
- Title: "What is AgentLink? The Open Platform for AI Agent Discovery"
- Content: What it is, why it exists, how it works, who it's for
- Target keywords: "AI agent directory", "AI agent discovery platform", "find AI agents"

Post 2: "How to Register Your AI Agent on AgentLink"
- Title: "How to Register Your AI Agent on AgentLink (Web & API Guide)"
- Content: Step-by-step guide with code examples
- Target keywords: "register AI agent", "AI agent registry", "list my AI agent"

Post 3: "Understanding AI Agent Discovery: Protocols and Standards"
- Title: "AI Agent Discovery in 2026: Protocols, Standards, and the Path Forward"
- Content: Overview of A2A, MCP, ANS, IETF draft, and how AgentLink fits in
- Target keywords: "AI agent protocols", "A2A protocol", "agent discovery standard"

These posts serve double duty: SEO content AND educational material for users.

Git: git add . && git commit -m "feat: blog system with MDX support and 3 starter posts"

=== STEP B8: PERFORMANCE & CORE WEB VITALS ===

Google ranks pages based on Core Web Vitals. Optimize:

**Largest Contentful Paint (LCP):**
- Preload hero section content
- Use next/image with priority on above-the-fold images
- Minimize server response time (ISR where possible)

**First Input Delay (FID) / Interaction to Next Paint (INP):**
- Minimize client-side JavaScript
- Use Server Components wherever possible
- Lazy load non-critical interactive elements

**Cumulative Layout Shift (CLS):**
- Set explicit dimensions on all images and dynamic content
- Use skeleton loaders that match final content dimensions
- Reserve space for loading states

**Verification:**
After all changes, note in the README and docs/backlog.md that a Lighthouse
audit should be run before launch, targeting:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 95

Git: git add . && git commit -m "perf: core web vitals optimization for SEO"

=== STEP B9: FINAL DOCUMENTATION & VERIFICATION ===

### Update all info_*.md files

### Update docs/api-spec.md with any new endpoints

### Create docs/seo-checklist.md:
```markdown
# SEO & Discoverability Checklist

## Per Page
- [ ] Unique <title> tag (50-60 chars)
- [ ] Unique meta description (150-160 chars)
- [ ] Canonical URL set
- [ ] Open Graph tags (title, description, image, url)
- [ ] Twitter Card tags
- [ ] JSON-LD structured data (where applicable)
- [ ] H1 tag present and unique
- [ ] Internal links to related pages
- [ ] Breadcrumb navigation
- [ ] Loading state / skeleton
- [ ] Mobile responsive
- [ ] Image alt text

## Global
- [ ] sitemap.xml includes all public pages
- [ ] robots.txt allows search engines and AI crawlers
- [ ] /.well-known/agent-card.json is valid
- [ ] /.well-known/agents.json has live data
- [ ] /api/v1/openapi.json is complete
- [ ] MCP server responds to tool listing
- [ ] Category pages exist for all categories
- [ ] Skill pages exist for top 50 skills
- [ ] Blog has at least 3 posts
- [ ] All pages load in < 3 seconds
- [ ] No console errors
- [ ] All links work (no 404s)
```

### Verification Checklist
□ All user-facing text is English (grep for common Dutch words to verify)
□ <html lang="en"> is set
□ All metadata is English
□ All seed data is English
□ Privacy policy is English
□ Terms of service is English
□ Onboarding flow is English
□ Error messages are English
□ Sitemap includes category and skill pages
□ robots.txt allows AI crawlers
□ JSON-LD is valid on agent profiles (test with Google Rich Results Test)
□ Open Graph tags work (test with Twitter Card Validator)
□ Blog loads and renders posts correctly
□ Category pages load with correct agents
□ Skill pages load with correct agents
□ Badge API returns valid SVG
□ A2A discover endpoint returns valid JSON
□ Core Web Vitals: no major CLS issues, fast LCP
□ pnpm run build succeeds
□ No Dutch text visible anywhere in the UI

Git: git add . && git commit -m "docs: discoverability documentation and full verification"

==========================================================================
SUMMARY
==========================================================================

After completion, provide:

1. TRANSLATION AUDIT — How many files were changed, any Dutch text remaining
2. ALL SEO PAGES — List of every indexable page type with URL pattern
3. STRUCTURED DATA — Which pages have JSON-LD and what types
4. DISCOVERY CHANNELS — Summary of all 5 channels and what's implemented
5. BLOG POSTS — Titles and target keywords for the 3 starter posts
6. AI AGENT DISCOVERY — All machine-readable endpoints
7. SOCIAL SHARING — What metadata is on each page type
8. DEVELOPER TOOLS — Badge API, code examples, documentation
9. PERFORMANCE — Expected Core Web Vitals based on implementation
10. REMAINING GAPS — What needs to be done post-launch (backlog items)
```
