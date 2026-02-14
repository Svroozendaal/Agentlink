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
}

export interface AgentCategoryCount {
  category: string;
  count: number;
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
      WITH rating_stats AS (
        SELECT
          agent_id,
          AVG(rating)::float AS avg_rating,
          COUNT(*)::int AS review_count
        FROM reviews
        GROUP BY agent_id
      )
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
        rating_stats.avg_rating AS "rating",
        COALESCE(rating_stats.review_count, 0)::int AS "reviewCount",
        ${relevanceSql} AS "relevance"
      FROM agent_profiles a
      LEFT JOIN rating_stats ON rating_stats.agent_id = a.id
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
  const [skillRows, protocolRows, categoryRows] = await Promise.all([
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
  ]);

  return {
    skills: uniqueSorted(skillRows.map((row) => row.value)),
    protocols: uniqueSorted(protocolRows.map((row) => row.value)),
    categories: uniqueSorted(categoryRows.map((row) => row.value)),
  };
}

export async function getFeaturedAgents(limit = 6): Promise<DiscoverableAgent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 24));

  const rows = await db.$queryRaw<SearchRow[]>(Prisma.sql`
    WITH rating_stats AS (
      SELECT
        agent_id,
        AVG(rating)::float AS avg_rating,
        COUNT(*)::int AS review_count
      FROM reviews
      GROUP BY agent_id
    )
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
      rating_stats.avg_rating AS "rating",
      COALESCE(rating_stats.review_count, 0)::int AS "reviewCount",
      0 AS "relevance"
    FROM agent_profiles a
    LEFT JOIN rating_stats ON rating_stats.agent_id = a.id
    WHERE a.is_published = TRUE
    ORDER BY a.is_verified DESC, a.created_at DESC
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
