import { Prisma, PrismaClient, PricingModel, Role } from "@prisma/client";

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
    isPublished: false,
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
];

async function main() {
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

  for (const agent of seedAgents) {
    const owner = await prisma.user.findUnique({
      where: { email: agent.ownerEmail },
      select: { id: true },
    });

    if (!owner) {
      throw new Error(`Owner not found for seed agent: ${agent.slug}`);
    }

    await prisma.agentProfile.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name,
        description: agent.description,
        longDescription: agent.longDescription,
        ownerId: owner.id,
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
      },
      create: {
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        longDescription: agent.longDescription,
        ownerId: owner.id,
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
