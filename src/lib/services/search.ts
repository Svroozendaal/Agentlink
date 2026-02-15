import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { SearchAgentsQueryInput } from "@/lib/validations/agent";
import type { AgentProtocol, PricingModel } from "@/types/agent";

interface SearchRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  skills: string[];
  tags: string[];
  category: string;
  protocols: string[];
  pricingModel: PricingModel;
  isPublished: boolean;
  isVerified: boolean;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number | null;
  reviewCount: number;
  endorsementCount: number;
  acceptsMessages: boolean;
  playgroundEnabled: boolean;
  connectEnabled: boolean;
  isEarlyAdopter: boolean;
  relevance: number;
}

interface CountRow {
  total: number;
}

interface CategoryCountRow {
  category: string;
  count: number;
}

interface ValueRow {
  value: string;
}

export interface DiscoverableAgent {
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
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number | null;
  reviewCount: number;
  endorsementCount: number;
  acceptsMessages: boolean;
  playgroundEnabled: boolean;
  connectEnabled: boolean;
  isEarlyAdopter: boolean;
}

export interface AgentSearchResult {
  agents: DiscoverableAgent[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DiscoveryFilterOptions {
  skills: string[];
  protocols: string[];
  categories: string[];
  endpointTypes: string[];
}

export interface AgentCategoryCount {
  category: string;
  count: number;
}

export interface PlatformStats {
  agents: number;
  reviews: number;
  endorsements: number;
}

function normalizeSort(
  sort: SearchAgentsQueryInput["sort"],
  hasQuery: boolean,
): SearchAgentsQueryInput["sort"] {
  if (sort === "relevance" && !hasQuery) {
    return "newest";
  }

  return sort;
}

export function buildSearchOrderBy(
  sort: SearchAgentsQueryInput["sort"],
  hasQuery: boolean,
): Prisma.Sql {
  const normalizedSort = normalizeSort(sort, hasQuery);

  switch (normalizedSort) {
    case "rating":
      return Prisma.sql`"rating" DESC NULLS LAST, "reviewCount" DESC, a.updated_at DESC`;
    case "newest":
      return Prisma.sql`a.created_at DESC`;
    case "name":
      return Prisma.sql`LOWER(a.name) ASC, a.created_at DESC`;
    case "relevance":
    default:
      return Prisma.sql`"relevance" DESC, "rating" DESC NULLS LAST, a.updated_at DESC`;
  }
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function mapSearchRow(row: SearchRow): DiscoverableAgent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    skills: row.skills,
    tags: row.tags,
    category: row.category,
    protocols: row.protocols as AgentProtocol[],
    pricingModel: row.pricingModel,
    isPublished: row.isPublished,
    isVerified: row.isVerified,
    logoUrl: row.logoUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rating: row.rating,
    reviewCount: row.reviewCount,
    endorsementCount: row.endorsementCount,
    acceptsMessages: row.acceptsMessages,
    playgroundEnabled: row.playgroundEnabled,
    connectEnabled: row.connectEnabled,
    isEarlyAdopter: row.isEarlyAdopter,
  };
}

export async function searchAgents(query: SearchAgentsQueryInput): Promise<AgentSearchResult> {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;
  const hasQuery = Boolean(query.q);

  const searchVector = Prisma.sql`to_tsvector('simple', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '') || ' ' || COALESCE(a.long_description, ''))`;
  const whereClauses: Prisma.Sql[] = [Prisma.sql`a.is_published = TRUE`];

  if (query.q) {
    whereClauses.push(
      Prisma.sql`${searchVector} @@ plainto_tsquery('simple', ${query.q})`,
    );
  }

  if (query.skills && query.skills.length > 0) {
    whereClauses.push(
      Prisma.sql`a.skills && ARRAY[${Prisma.join(query.skills)}]::text[]`,
    );
  }

  if (query.protocols && query.protocols.length > 0) {
    whereClauses.push(
      Prisma.sql`a.protocols && ARRAY[${Prisma.join(query.protocols)}]::text[]`,
    );
  }

  if (query.category) {
    whereClauses.push(Prisma.sql`LOWER(a.category) = LOWER(${query.category})`);
  }

  if (query.pricing) {
    whereClauses.push(Prisma.sql`a.pricing_model::text = ${query.pricing}`);
  }

  if (query.verified !== undefined) {
    whereClauses.push(Prisma.sql`a.is_verified = ${query.verified}`);
  }

  if (query.playground !== undefined) {
    whereClauses.push(Prisma.sql`a.playground_enabled = ${query.playground}`);
  }

  if (query.connect !== undefined) {
    whereClauses.push(Prisma.sql`a.connect_enabled = ${query.connect}`);
  }

  if (query.endpointTypes && query.endpointTypes.length > 0) {
    whereClauses.push(
      Prisma.sql`EXISTS (
        SELECT 1
        FROM agent_endpoints e
        WHERE e.agent_id = a.id
        AND e.type::text = ANY(ARRAY[${Prisma.join(query.endpointTypes)}]::text[])
      )`,
    );
  }

  const whereSql = Prisma.join(whereClauses, " AND ");
  const relevanceSql = query.q
    ? Prisma.sql`ts_rank(${searchVector}, plainto_tsquery('simple', ${query.q}))`
    : Prisma.sql`0`;
  const orderBySql = buildSearchOrderBy(query.sort, hasQuery);

  const [countRows, rows] = await db.$transaction([
    db.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS "total"
      FROM agent_profiles a
      WHERE ${whereSql}
    `),
    db.$queryRaw<SearchRow[]>(Prisma.sql`
      SELECT
        a.id AS "id",
        a.slug AS "slug",
        a.name AS "name",
        a.description AS "description",
        a.skills AS "skills",
        a.tags AS "tags",
        a.category AS "category",
        a.protocols AS "protocols",
        a.pricing_model::text AS "pricingModel",
        a.is_published AS "isPublished",
        a.is_verified AS "isVerified",
        a.logo_url AS "logoUrl",
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        CASE WHEN a.review_count > 0 THEN a.average_rating ELSE NULL END AS "rating",
        a.review_count::int AS "reviewCount",
        a.endorsement_count::int AS "endorsementCount",
        a.accepts_messages AS "acceptsMessages",
        a.playground_enabled AS "playgroundEnabled",
        a.connect_enabled AS "connectEnabled",
        a.is_early_adopter AS "isEarlyAdopter",
        ${relevanceSql} AS "relevance"
      FROM agent_profiles a
      WHERE ${whereSql}
      ORDER BY ${orderBySql}
      LIMIT ${limit}
      OFFSET ${offset}
    `),
  ]);

  const total = countRows[0]?.total ?? 0;

  return {
    agents: rows.map(mapSearchRow),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getDiscoveryFilterOptions(): Promise<DiscoveryFilterOptions> {
  const [skillRows, protocolRows, categoryRows, endpointTypeRows] = await Promise.all([
    db.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT DISTINCT skill AS "value"
      FROM agent_profiles, UNNEST(skills) AS skill
      WHERE is_published = TRUE
      ORDER BY skill ASC
      LIMIT 100
    `),
    db.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT DISTINCT protocol AS "value"
      FROM agent_profiles, UNNEST(protocols) AS protocol
      WHERE is_published = TRUE
      ORDER BY protocol ASC
      LIMIT 20
    `),
    db.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT DISTINCT category AS "value"
      FROM agent_profiles
      WHERE is_published = TRUE
      ORDER BY category ASC
      LIMIT 30
    `),
    db.$queryRaw<ValueRow[]>(Prisma.sql`
      SELECT DISTINCT e.type::text AS "value"
      FROM agent_endpoints e
      INNER JOIN agent_profiles a ON a.id = e.agent_id
      WHERE a.is_published = TRUE
      ORDER BY e.type::text ASC
    `),
  ]);

  return {
    skills: uniqueSorted(skillRows.map((row) => row.value)),
    protocols: uniqueSorted(protocolRows.map((row) => row.value)),
    categories: uniqueSorted(categoryRows.map((row) => row.value)),
    endpointTypes: uniqueSorted(endpointTypeRows.map((row) => row.value)),
  };
}

export async function getFeaturedAgents(limit = 6): Promise<DiscoverableAgent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 24));

  const rows = await db.$queryRaw<SearchRow[]>(Prisma.sql`
    SELECT
      a.id AS "id",
      a.slug AS "slug",
      a.name AS "name",
      a.description AS "description",
      a.skills AS "skills",
      a.tags AS "tags",
      a.category AS "category",
      a.protocols AS "protocols",
      a.pricing_model::text AS "pricingModel",
      a.is_published AS "isPublished",
      a.is_verified AS "isVerified",
      a.logo_url AS "logoUrl",
      a.created_at AS "createdAt",
      a.updated_at AS "updatedAt",
      CASE WHEN a.review_count > 0 THEN a.average_rating ELSE NULL END AS "rating",
      a.review_count::int AS "reviewCount",
      a.endorsement_count::int AS "endorsementCount",
      a.accepts_messages AS "acceptsMessages",
      a.playground_enabled AS "playgroundEnabled",
      a.connect_enabled AS "connectEnabled",
      a.is_early_adopter AS "isEarlyAdopter",
      0 AS "relevance"
    FROM agent_profiles a
    WHERE a.is_published = TRUE
    ORDER BY
      (
        (a.review_count * 2) +
        (a.average_rating * 10) +
        (a.endorsement_count * 1) +
        (CASE WHEN a.is_early_adopter THEN 20 ELSE 0 END) +
        (CASE WHEN a.playground_enabled THEN 15 ELSE 0 END) +
        (CASE WHEN a.connect_enabled THEN 5 ELSE 0 END) +
        (CASE WHEN a.is_verified THEN 10 ELSE 0 END)
      ) DESC,
      a.updated_at DESC
    LIMIT ${safeLimit}
  `);

  return rows.map(mapSearchRow);
}

export async function getTopCategories(limit = 8): Promise<AgentCategoryCount[]> {
  const safeLimit = Math.max(1, Math.min(limit, 24));

  const rows = await db.$queryRaw<CategoryCountRow[]>(Prisma.sql`
    SELECT
      category AS "category",
      COUNT(*)::int AS "count"
    FROM agent_profiles
    WHERE is_published = TRUE
    GROUP BY category
    ORDER BY "count" DESC, category ASC
    LIMIT ${safeLimit}
  `);

  return rows;
}

export async function getTopSkills(limit = 50): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const rows = await db.$queryRaw<ValueRow[]>(Prisma.sql`
    SELECT skill.value AS "value"
    FROM (
      SELECT UNNEST(skills) AS value
      FROM agent_profiles
      WHERE is_published = TRUE
    ) skill
    GROUP BY skill.value
    ORDER BY COUNT(*) DESC, skill.value ASC
    LIMIT ${safeLimit}
  `);

  return rows.map((row) => row.value);
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [agents, reviews, endorsements] = await db.$transaction([
    db.agentProfile.count({
      where: { isPublished: true },
    }),
    db.review.count({
      where: { status: "PUBLISHED" },
    }),
    db.endorsement.count(),
  ]);

  return {
    agents,
    reviews,
    endorsements,
  };
}
