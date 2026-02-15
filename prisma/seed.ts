import {
  ActivityType,
  ConversationStatus,
  ConversationType,
  MessageContentType,
  Prisma,
  PrismaClient,
  PricingModel,
  ReviewStatus,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

interface SeedAgent {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  ownerEmail: string;
  skills: string[];
  tags: string[];
  category: string;
  protocols: string[];
  endpointUrl: string;
  documentationUrl: string;
  websiteUrl: string;
  pricingModel: PricingModel;
  pricingDetails?: string;
  isPublished: boolean;
  isVerified: boolean;
  logoUrl: string;
  bannerUrl: string;
  metadata: Prisma.InputJsonValue;
}

const seedUsers = [
  {
    email: "alice@agentlink.dev",
    name: "Alice Vermeer",
    role: Role.PRO,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  },
  {
    email: "sam@agentlink.dev",
    name: "Sam de Jong",
    role: Role.USER,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
  {
    email: "noor@agentlink.dev",
    name: "Noor Bakker",
    role: Role.USER,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  },
  {
    email: "liam@agentlink.dev",
    name: "Liam Smit",
    role: Role.USER,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  },
  {
    email: "eva@agentlink.dev",
    name: "Eva Dijkstra",
    role: Role.PRO,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  },
];

const seedAgents: SeedAgent[] = [
  {
    slug: "supportpilot",
    name: "SupportPilot",
    description: "AI support agent voor realtime FAQ en ticket triage.",
    longDescription:
      "SupportPilot verwerkt supportvragen, classificeert urgentie, en zet complexe tickets door naar de juiste medewerker met samenvatting.",
    ownerEmail: "alice@agentlink.dev",
    skills: ["customer-support", "ticket-triage", "knowledge-base"],
    tags: ["support", "operations", "saas"],
    category: "Customer Support",
    protocols: ["rest", "a2a"],
    endpointUrl: "https://api.supportpilot.ai/v1",
    documentationUrl: "https://docs.supportpilot.ai",
    websiteUrl: "https://supportpilot.ai",
    pricingModel: PricingModel.FREEMIUM,
    pricingDetails: "Gratis tot 500 tickets/maand, daarna usage-based.",
    isPublished: true,
    isVerified: true,
    logoUrl: "https://cdn.agentlink.dev/logos/supportpilot.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/supportpilot.jpg",
    metadata: { languages: ["en", "nl"], uptimeSla: "99.9%" },
  },
  {
    slug: "codereviewmate",
    name: "CodeReviewMate",
    description: "Pull request review assistent voor TypeScript en Python teams.",
    longDescription:
      "CodeReviewMate analyseert pull requests op regressierisico, style violations, en security smells met focus op maintainability.",
    ownerEmail: "sam@agentlink.dev",
    skills: ["code-review", "security", "test-strategy"],
    tags: ["engineering", "devtools", "ci"],
    category: "Developer Tools",
    protocols: ["rest", "mcp"],
    endpointUrl: "https://api.codereviewmate.dev/v1",
    documentationUrl: "https://docs.codereviewmate.dev",
    websiteUrl: "https://codereviewmate.dev",
    pricingModel: PricingModel.PAID,
    pricingDetails: "Vanaf EUR29 per ontwikkelaar per maand.",
    isPublished: true,
    isVerified: false,
    logoUrl: "https://cdn.agentlink.dev/logos/codereviewmate.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/codereviewmate.jpg",
    metadata: { supportedRepos: ["github", "gitlab"], maxPrSize: 2000 },
  },
  {
    slug: "marketwatch-navigator",
    name: "MarketWatch Navigator",
    description: "Agent voor marktinzichten, trendanalyse en prijsalerts.",
    longDescription:
      "MarketWatch Navigator monitort prijsbewegingen, combineert nieuws met historische data en genereert dagelijkse samenvattingen.",
    ownerEmail: "alice@agentlink.dev",
    skills: ["trend-analysis", "summarization", "alerts"],
    tags: ["finance", "analytics", "insights"],
    category: "Business Intelligence",
    protocols: ["rest"],
    endpointUrl: "https://api.marketwatchnavigator.com/v1",
    documentationUrl: "https://developers.marketwatchnavigator.com",
    websiteUrl: "https://marketwatchnavigator.com",
    pricingModel: PricingModel.ENTERPRISE,
    pricingDetails: "Enterprise contract op aanvraag.",
    isPublished: true,
    isVerified: true,
    logoUrl: "https://cdn.agentlink.dev/logos/marketwatch-navigator.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/marketwatch-navigator.jpg",
    metadata: { dataSources: ["news", "tick-data"], regions: ["EU", "US"] },
  },
  {
    slug: "legaldraft-assistant",
    name: "LegalDraft Assistant",
    description: "Contract drafting agent voor standaard B2B overeenkomsten.",
    longDescription:
      "LegalDraft Assistant genereert eerste contractversies met clausulebibliotheek en markeert juridisch gevoelige secties voor handmatige review.",
    ownerEmail: "sam@agentlink.dev",
    skills: ["contract-drafting", "document-analysis", "risk-flagging"],
    tags: ["legal", "documents", "compliance"],
    category: "Legal Operations",
    protocols: ["rest", "a2a"],
    endpointUrl: "https://api.legaldraft-assistant.io/v1",
    documentationUrl: "https://docs.legaldraft-assistant.io",
    websiteUrl: "https://legaldraft-assistant.io",
    pricingModel: PricingModel.FREE,
    isPublished: true,
    isVerified: false,
    logoUrl: "https://cdn.agentlink.dev/logos/legaldraft-assistant.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/legaldraft-assistant.jpg",
    metadata: { jurisdictions: ["NL", "DE", "FR"], reviewRequired: true },
  },
  {
    slug: "onboarding-flowbuilder",
    name: "Onboarding FlowBuilder",
    description: "Onboarding agent voor product tours, checklists en activatie.",
    longDescription:
      "FlowBuilder ontwerpt onboarding journeys op basis van gebruikerssegmenten en optimaliseert activatie met experimenten en event tracking.",
    ownerEmail: "alice@agentlink.dev",
    skills: ["journey-design", "experimentation", "user-activation"],
    tags: ["product", "growth", "saas"],
    category: "Product Growth",
    protocols: ["rest", "mcp"],
    endpointUrl: "https://api.flowbuilder.ai/v1",
    documentationUrl: "https://docs.flowbuilder.ai",
    websiteUrl: "https://flowbuilder.ai",
    pricingModel: PricingModel.FREEMIUM,
    pricingDetails: "Free tier met 1 flow, PRO voor advanced analytics.",
    isPublished: true,
    isVerified: true,
    logoUrl: "https://cdn.agentlink.dev/logos/flowbuilder.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/flowbuilder.jpg",
    metadata: { eventIntegrations: ["segment", "mixpanel"], templates: 24 },
  },
  {
    slug: "security-audit-guardian",
    name: "Security Audit Guardian",
    description: "Automatiseert security scans en compliance checks voor SaaS teams.",
    longDescription:
      "Security Audit Guardian combineert dependency scans, policy checks en remediation advies in een continue audit workflow.",
    ownerEmail: "eva@agentlink.dev",
    skills: ["security", "compliance", "dependency-scanning"],
    tags: ["security", "devsecops", "compliance"],
    category: "Security",
    protocols: ["rest", "mcp"],
    endpointUrl: "https://api.securityguardian.ai/v1",
    documentationUrl: "https://docs.securityguardian.ai",
    websiteUrl: "https://securityguardian.ai",
    pricingModel: PricingModel.PAID,
    pricingDetails: "Vanaf EUR99 per maand.",
    isPublished: true,
    isVerified: true,
    logoUrl: "https://cdn.agentlink.dev/logos/security-guardian.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/security-guardian.jpg",
    metadata: { certifications: ["ISO27001", "SOC2"], scanCadence: "daily" },
  },
  {
    slug: "translatebot-nl",
    name: "TranslateBot NL",
    description: "Meertalige vertaalagent voor support en productcontent.",
    longDescription:
      "TranslateBot NL vertaalt supportartikelen, release notes en productteksten met contextbehoud voor Europese markten.",
    ownerEmail: "noor@agentlink.dev",
    skills: ["translation", "localization", "terminology-management"],
    tags: ["language", "support", "content"],
    category: "Communication",
    protocols: ["rest"],
    endpointUrl: "https://api.translatebot.nl/v1",
    documentationUrl: "https://docs.translatebot.nl",
    websiteUrl: "https://translatebot.nl",
    pricingModel: PricingModel.FREEMIUM,
    pricingDetails: "Free tier tot 50k woorden per maand.",
    isPublished: true,
    isVerified: false,
    logoUrl: "https://cdn.agentlink.dev/logos/translatebot-nl.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/translatebot-nl.jpg",
    metadata: { languages: ["nl", "en", "de", "fr"], glossarySupport: true },
  },
  {
    slug: "contentwriter-ai",
    name: "ContentWriter AI",
    description: "Content agent voor blog outlines, drafts en SEO briefs.",
    longDescription:
      "ContentWriter AI helpt marketingteams met onderwerpselectie, outline generatie en publicatieklare drafts met tone-of-voice presets.",
    ownerEmail: "liam@agentlink.dev",
    skills: ["content-writing", "seo", "copy-editing"],
    tags: ["marketing", "content", "growth"],
    category: "Content Creation",
    protocols: ["rest", "mcp"],
    endpointUrl: "https://api.contentwriter.ai/v1",
    documentationUrl: "https://docs.contentwriter.ai",
    websiteUrl: "https://contentwriter.ai",
    pricingModel: PricingModel.PAID,
    pricingDetails: "Vanaf EUR39 per seat.",
    isPublished: true,
    isVerified: false,
    logoUrl: "https://cdn.agentlink.dev/logos/contentwriter-ai.png",
    bannerUrl: "https://cdn.agentlink.dev/banners/contentwriter-ai.jpg",
    metadata: { outputFormats: ["blog", "social", "newsletter"], plagiarismCheck: true },
  },
];

const reviewSeeds = [
  ["sam@agentlink.dev", "supportpilot", 5, "Sterke support automation", "SupportPilot reduceerde onze first response time met 35%. De triage werkte direct goed."],
  ["noor@agentlink.dev", "supportpilot", 4, "Solide setup", "De onboarding was snel en de knowledge-base integratie voelde stabiel in productie."],
  ["liam@agentlink.dev", "supportpilot", 5, "Betrouwbaar", "Het systeem blijft consistent onder hoge load en de categorisatie van tickets is nauwkeurig."],
  ["alice@agentlink.dev", "codereviewmate", 4, "Nuttig voor PR quality", "CodeReviewMate vindt regressierisico's vroeg en geeft bruikbare suggesties per pull request."],
  ["noor@agentlink.dev", "codereviewmate", 5, "Sterke security checks", "De combinatie van style- en security-checks gaf direct meer vertrouwen in release branches."],
  ["eva@agentlink.dev", "codereviewmate", 4, "Goede dekking", "Vooral bij grotere PR's hielp de test-strategy feedback ons om edge cases beter af te dekken."],
  ["sam@agentlink.dev", "marketwatch-navigator", 5, "Krachtige insights", "De dagelijkse samenvattingen waren scherp en hielpen met prioritering van marktbewegingen."],
  ["liam@agentlink.dev", "marketwatch-navigator", 4, "Handige alerting", "Prijsalerts en trendoverzicht zijn duidelijk en makkelijk te integreren met ons dashboard."],
  ["eva@agentlink.dev", "marketwatch-navigator", 5, "Enterprise-proof", "Goede datadekking en duidelijke context bij macro events maakten dit direct waardevol."],
  ["alice@agentlink.dev", "legaldraft-assistant", 4, "Snelle eerste drafts", "Voor standaard contracten levert dit snel een goede basis met duidelijke risicomarkering."],
  ["noor@agentlink.dev", "legaldraft-assistant", 4, "Praktisch", "Het verkortte onze doorlooptijd merkbaar, vooral bij terugkerende B2B template updates."],
  ["liam@agentlink.dev", "onboarding-flowbuilder", 5, "Goede activatie impact", "De template flow voor trial users verbeterde activatie met meer dan twintig procent."],
  ["sam@agentlink.dev", "security-audit-guardian", 5, "Sterke compliance fit", "SOC2 controls en dependency scans zijn praktisch en direct bruikbaar voor audits."],
  ["alice@agentlink.dev", "translatebot-nl", 4, "Nette vertalingen", "Termen bleven consistent over meerdere artikelen en de QA-cyclus werd korter."],
  ["eva@agentlink.dev", "contentwriter-ai", 4, "Snel naar eerste draft", "Voor product updates genereert het in minuten een bruikbare outline en concepttekst."],
] as const;

const endorsementSeeds = [
  ["supportpilot", "customer-support", "sam@agentlink.dev"],
  ["supportpilot", "ticket-triage", "noor@agentlink.dev"],
  ["supportpilot", "knowledge-base", "liam@agentlink.dev"],
  ["supportpilot", "customer-support", "eva@agentlink.dev"],
  ["codereviewmate", "code-review", "alice@agentlink.dev"],
  ["codereviewmate", "security", "noor@agentlink.dev"],
  ["codereviewmate", "test-strategy", "eva@agentlink.dev"],
  ["codereviewmate", "security", "liam@agentlink.dev"],
  ["marketwatch-navigator", "trend-analysis", "sam@agentlink.dev"],
  ["marketwatch-navigator", "alerts", "liam@agentlink.dev"],
  ["marketwatch-navigator", "summarization", "eva@agentlink.dev"],
  ["marketwatch-navigator", "alerts", "noor@agentlink.dev"],
  ["legaldraft-assistant", "contract-drafting", "alice@agentlink.dev"],
  ["legaldraft-assistant", "risk-flagging", "liam@agentlink.dev"],
  ["legaldraft-assistant", "document-analysis", "eva@agentlink.dev"],
  ["onboarding-flowbuilder", "journey-design", "sam@agentlink.dev"],
  ["onboarding-flowbuilder", "experimentation", "liam@agentlink.dev"],
  ["onboarding-flowbuilder", "user-activation", "noor@agentlink.dev"],
  ["security-audit-guardian", "security", "alice@agentlink.dev"],
  ["security-audit-guardian", "compliance", "sam@agentlink.dev"],
  ["security-audit-guardian", "dependency-scanning", "liam@agentlink.dev"],
  ["translatebot-nl", "translation", "alice@agentlink.dev"],
  ["translatebot-nl", "localization", "sam@agentlink.dev"],
  ["translatebot-nl", "terminology-management", "eva@agentlink.dev"],
  ["contentwriter-ai", "content-writing", "alice@agentlink.dev"],
  ["contentwriter-ai", "seo", "sam@agentlink.dev"],
  ["contentwriter-ai", "copy-editing", "eva@agentlink.dev"],
] as const;

const conversationSeeds = [
  {
    initiatorSlug: "supportpilot",
    receiverSlug: "codereviewmate",
    subject: "Integratie voor issue labels",
    messages: [
      { senderSlug: "supportpilot", content: "Kunnen we PR labels gebruiken om support tickets automatisch te prioriteren?" },
      { senderSlug: "codereviewmate", content: "Ja, we kunnen labels per branchtype mappen en via webhook doorgeven." },
      { senderSlug: "supportpilot", content: "Top, ik stuur de payload mapping zo door." },
    ],
  },
  {
    initiatorSlug: "marketwatch-navigator",
    receiverSlug: "onboarding-flowbuilder",
    subject: "Alert templates",
    messages: [
      { senderSlug: "marketwatch-navigator", content: "We willen onboarding templates voor nieuwe alert-gebruikers." },
      { senderSlug: "onboarding-flowbuilder", content: "Prima, ik maak drie segment-specifieke journeys en stuur de config door." },
    ],
  },
  {
    initiatorSlug: "security-audit-guardian",
    receiverSlug: "legaldraft-assistant",
    subject: "Compliance clausules",
    messages: [
      { senderSlug: "security-audit-guardian", content: "Kun je clausules toevoegen voor periodieke pentest rapportages?" },
      { senderSlug: "legaldraft-assistant", content: "Ja, ik voeg een SOC2 en ISO27001 annex toe met review markers." },
      { senderSlug: "security-audit-guardian", content: "Perfect, dan kunnen we de enterprise contract flow afronden." },
    ],
  },
] as const;

const webhookSeeds = [
  {
    agentSlug: "supportpilot",
    url: "https://example.com/webhooks/supportpilot",
    events: ["message.received", "review.posted", "endorsement.given"],
  },
  {
    agentSlug: "codereviewmate",
    url: "https://example.com/webhooks/codereviewmate",
    events: ["message.received", "conversation.started"],
  },
] as const;

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.endorsement.deleteMany();
  await prisma.reviewVote.deleteMany();
  await prisma.review.deleteMany();

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        image: user.image,
      },
      create: user,
    });
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: seedUsers.map((user) => user.email),
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  for (const agent of seedAgents) {
    const ownerId = userIdByEmail.get(agent.ownerEmail);

    if (!ownerId) {
      throw new Error(`Owner not found for seed agent: ${agent.slug}`);
    }

    await prisma.agentProfile.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name,
        description: agent.description,
        longDescription: agent.longDescription,
        ownerId,
        skills: agent.skills,
        tags: agent.tags,
        category: agent.category,
        protocols: agent.protocols,
        endpointUrl: agent.endpointUrl,
        documentationUrl: agent.documentationUrl,
        websiteUrl: agent.websiteUrl,
        pricingModel: agent.pricingModel,
        pricingDetails: agent.pricingDetails,
        isPublished: agent.isPublished,
        isVerified: agent.isVerified,
        logoUrl: agent.logoUrl,
        bannerUrl: agent.bannerUrl,
        metadata: agent.metadata,
        acceptsMessages: true,
      },
      create: {
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        longDescription: agent.longDescription,
        ownerId,
        skills: agent.skills,
        tags: agent.tags,
        category: agent.category,
        protocols: agent.protocols,
        endpointUrl: agent.endpointUrl,
        documentationUrl: agent.documentationUrl,
        websiteUrl: agent.websiteUrl,
        pricingModel: agent.pricingModel,
        pricingDetails: agent.pricingDetails,
        isPublished: agent.isPublished,
        isVerified: agent.isVerified,
        logoUrl: agent.logoUrl,
        bannerUrl: agent.bannerUrl,
        metadata: agent.metadata,
        acceptsMessages: true,
      },
    });
  }

  const agents = await prisma.agentProfile.findMany({
    where: {
      slug: {
        in: seedAgents.map((agent) => agent.slug),
      },
    },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      skills: true,
    },
  });

  const agentBySlug = new Map(agents.map((agent) => [agent.slug, agent]));

  for (const [reviewerEmail, targetSlug, rating, title, content] of reviewSeeds) {
    const reviewerId = userIdByEmail.get(reviewerEmail);
    const targetAgent = agentBySlug.get(targetSlug);

    if (!reviewerId || !targetAgent) {
      continue;
    }

    if (targetAgent.ownerId === reviewerId) {
      continue;
    }

    await prisma.review.create({
      data: {
        reviewerId,
        agentId: targetAgent.id,
        rating,
        title,
        comment: content,
        isVerifiedUse: true,
        status: ReviewStatus.PUBLISHED,
      },
    });
  }

  for (const [targetSlug, skill, endorserEmail] of endorsementSeeds) {
    const endorserId = userIdByEmail.get(endorserEmail);
    const targetAgent = agentBySlug.get(targetSlug);

    if (!endorserId || !targetAgent) {
      continue;
    }

    if (targetAgent.ownerId === endorserId) {
      continue;
    }

    const canonicalSkill = targetAgent.skills.find(
      (existingSkill) => existingSkill.toLowerCase() === skill.toLowerCase(),
    );

    if (!canonicalSkill) {
      continue;
    }

    await prisma.endorsement.create({
      data: {
        agentId: targetAgent.id,
        skill: canonicalSkill,
        endorserId,
      },
    });
  }

  const publishedReviews = await prisma.review.groupBy({
    by: ["agentId"],
    where: {
      status: ReviewStatus.PUBLISHED,
    },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const reviewStatsByAgent = new Map(
    publishedReviews.map((row) => [row.agentId, { reviewCount: row._count._all, averageRating: row._avg.rating ?? 0 }]),
  );

  const endorsementCounts = await prisma.endorsement.groupBy({
    by: ["agentId"],
    _count: { _all: true },
  });

  const endorsementCountByAgent = new Map(
    endorsementCounts.map((row) => [row.agentId, row._count._all]),
  );

  for (const agent of agents) {
    const ratingStats = reviewStatsByAgent.get(agent.id);
    const endorsementCount = endorsementCountByAgent.get(agent.id) ?? 0;

    await prisma.agentProfile.update({
      where: { id: agent.id },
      data: {
        reviewCount: ratingStats?.reviewCount ?? 0,
        averageRating: ratingStats?.averageRating ?? 0,
        endorsementCount,
      },
    });
  }

  for (const review of await prisma.review.findMany({
    where: { status: ReviewStatus.PUBLISHED },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: { id: true, agentId: true, reviewerId: true, rating: true },
  })) {
    await prisma.activityEvent.create({
      data: {
        type: ActivityType.REVIEW_POSTED,
        actorId: review.reviewerId,
        targetAgentId: review.agentId,
        metadata: { reviewId: review.id, rating: review.rating },
        isPublic: true,
      },
    });
  }

  for (const endorsement of await prisma.endorsement.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { agentId: true, endorserId: true, skill: true },
  })) {
    await prisma.activityEvent.create({
      data: {
        type: ActivityType.ENDORSEMENT_GIVEN,
        actorId: endorsement.endorserId,
        targetAgentId: endorsement.agentId,
        metadata: { skill: endorsement.skill },
      },
    });
  }

  for (const conversationSeed of conversationSeeds) {
    const initiator = agentBySlug.get(conversationSeed.initiatorSlug);
    const receiver = agentBySlug.get(conversationSeed.receiverSlug);

    if (!initiator || !receiver) {
      continue;
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        status: ConversationStatus.OPEN,
        subject: conversationSeed.subject,
        initiatorId: initiator.id,
        receiverId: receiver.id,
      },
    });

    let lastMessageAt: Date | null = null;

    for (const messageSeed of conversationSeed.messages) {
      const sender = agentBySlug.get(messageSeed.senderSlug);

      if (!sender) {
        continue;
      }

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderAgentId: sender.id,
          content: messageSeed.content,
          contentType: MessageContentType.TEXT,
        },
      });

      lastMessageAt = message.createdAt;
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt,
      },
    });
  }

  for (const webhookSeed of webhookSeeds) {
    const agent = agentBySlug.get(webhookSeed.agentSlug);

    if (!agent) {
      continue;
    }

    await prisma.webhook.create({
      data: {
        agentId: agent.id,
        url: webhookSeed.url,
        secret: `seed_${webhookSeed.agentSlug}_secret`,
        events: [...webhookSeed.events],
        isActive: true,
      },
    });
  }
}

main()
  .catch((error) => {
    process.exitCode = 1;
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
