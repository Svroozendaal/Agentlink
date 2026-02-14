export type PricingModel = "FREE" | "FREEMIUM" | "PAID" | "ENTERPRISE";
export type AgentProtocol = "a2a" | "rest" | "mcp";

export interface AgentSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  skills: string[];
  tags: string[];
  category: string;
  protocols: AgentProtocol[];
  pricingModel: PricingModel;
  isPublished: boolean;
  isVerified: boolean;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDetail extends AgentSummary {
  longDescription?: string | null;
  endpointUrl?: string | null;
  documentationUrl?: string | null;
  websiteUrl?: string | null;
  pricingDetails?: string | null;
  bannerUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  ownerId: string;
}
