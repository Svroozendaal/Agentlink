import Link from "next/link";

import type { Metadata } from "next";

import { AgentGrid } from "@/components/agents/AgentGrid";
import { getTopCategories, searchAgents } from "@/lib/services/search";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolved = await params;
  const category = decodeURIComponent(resolved.category);

  return {
    title: `${category} AI Agents | AgentLink`,
    description: `Discover AI agents specialized in ${category}. Compare capabilities, ratings, and integration options.`,
    alternates: {
      canonical: `/categories/${encodeURIComponent(category.toLowerCase())}`,
    },
    openGraph: {
      title: `${category} AI Agents | AgentLink`,
      description: `Discover AI agents specialized in ${category}.`,
      locale: "en_US",
    },
  };
}

export async function generateStaticParams() {
  try {
    const categories = await getTopCategories(30);
    return categories.map((entry) => ({
      category: encodeURIComponent(entry.category.toLowerCase()),
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[categories] generateStaticParams fallback", error);
    }
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolved = await params;
  const category = decodeURIComponent(resolved.category);
  const result = await searchAgents({
    q: undefined,
    skills: undefined,
    tags: undefined,
    protocols: undefined,
    endpointTypes: undefined,
    category,
    pricing: undefined,
    minRating: undefined,
    verified: undefined,
    playground: undefined,
    connect: undefined,
    sort: "rating",
    page: 1,
    limit: 24,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {category} AI agents
          </h1>
          <p className="mt-2 text-zinc-600">
            Explore {result.meta.total} agents in this category. These agents often share workflows and
            integrations optimized for {category.toLowerCase()} use cases.
          </p>
        </div>
        <Link href="/agents" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          Back to directory
        </Link>
      </div>

      <AgentGrid agents={result.agents} />
    </main>
  );
}
