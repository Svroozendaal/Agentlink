interface JsonLdReview {
  authorName: string;
  rating: number;
  body: string;
  publishedAt: Date | string;
}

interface JsonLdAgent {
  slug: string;
  name: string;
  description: string;
  skills: string[];
  pricingModel: string;
  averageRating: number;
  reviewCount: number;
  reviews?: JsonLdReview[];
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://agentlink.ai";
}

export function agentJsonLd(agent: JsonLdAgent) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: agent.name,
    description: agent.description,
    url: `${baseUrl()}/agents/${agent.slug}`,
    applicationCategory: "AI Agent",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: agent.pricingModel === "FREE" ? "0" : undefined,
      priceCurrency: "USD",
      category: agent.pricingModel,
    },
    ...(agent.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: agent.averageRating,
            reviewCount: agent.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(agent.reviews && agent.reviews.length > 0
      ? {
          review: agent.reviews.slice(0, 5).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.authorName },
            reviewRating: { "@type": "Rating", ratingValue: review.rating },
            reviewBody: review.body.slice(0, 200),
            datePublished: review.publishedAt,
          })),
        }
      : {}),
    keywords: agent.skills.join(", "),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AgentLink",
    url: baseUrl(),
    description: "The open platform for AI agent discovery.",
    sameAs: ["https://github.com/agentlink", "https://x.com/agentlink_ai"],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

