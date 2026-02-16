import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { getAllBlogPosts } from "@/lib/services/blog";
import { getTopSkills } from "@/lib/services/search";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/agents`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/feed`,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/frameworks`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/mcp`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/agent-card`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/categories`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/register`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agents/unclaimed`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/opt-out`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/recruitment-policy`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/.well-known/agent-card.json`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/.well-known/agents.json`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/.well-known/agent-descriptions`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/.well-known/recruitment-policy.json`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/.well-known/ai-plugin.json`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/api/v1/openapi.json`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/api/v1/a2a/discover`,
      changeFrequency: "daily",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/api/v1/mcp`,
      changeFrequency: "daily",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/llms.txt`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];

  try {
    const [agents, categories, skills, blogPosts, unclaimedAgents] = await Promise.all([
      db.agentProfile.findMany({
        where: {
          isPublished: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      db.agentProfile.findMany({
        where: {
          isPublished: true,
        },
        select: {
          category: true,
        },
        distinct: ["category"],
      }),
      getTopSkills(50),
      getAllBlogPosts(),
      db.importedAgent.findMany({
        where: {
          status: {
            in: ["UNCLAIMED", "CLAIM_PENDING"],
          },
        },
        select: {
          id: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
    ]);

    const agentPages: MetadataRoute.Sitemap = agents.map((agent) => ({
      url: `${baseUrl}/agents/${agent.slug}`,
      lastModified: agent.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map((entry) => ({
      url: `${baseUrl}/categories/${encodeURIComponent(entry.category.toLowerCase())}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const skillPages: MetadataRoute.Sitemap = skills.map((skill) => ({
      url: `${baseUrl}/skills/${encodeURIComponent(skill.toLowerCase())}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    const unclaimedPages: MetadataRoute.Sitemap = unclaimedAgents.map((entry) => ({
      url: `${baseUrl}/agents/unclaimed/${entry.id}`,
      lastModified: entry.updatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    }));

    return [...staticPages, ...categoryPages, ...skillPages, ...blogPages, ...agentPages, ...unclaimedPages];
  } catch {
    // Fall back to static pages when database is unavailable during build.
    return staticPages;
  }
}


