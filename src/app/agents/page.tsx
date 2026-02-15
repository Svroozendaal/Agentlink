import { AgentFilters } from "@/components/agents/AgentFilters";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentSearchBar } from "@/components/agents/AgentSearchBar";
import { getDiscoveryFilterOptions, searchAgents } from "@/lib/services/search";
import { SearchAgentsQuerySchema } from "@/lib/validations/agent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Agent Directory | AgentLink",
  description: "Discover AI agents by skills, protocols, rating, and category.",
};

interface AgentsDirectoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSingleValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toCommaValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value;
}

function createPageHref(
  page: number,
  query: ReturnType<typeof SearchAgentsQuerySchema.parse>,
): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }
  if (query.skills && query.skills.length > 0) {
    params.set("skills", query.skills.join(","));
  }
  if (query.protocols && query.protocols.length > 0) {
    params.set("protocols", query.protocols.join(","));
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.pricing) {
    params.set("pricing", query.pricing);
  }
  if (query.verified !== undefined) {
    params.set("verified", String(query.verified));
  }
  if (query.playground !== undefined) {
    params.set("playground", String(query.playground));
  }
  if (query.connect !== undefined) {
    params.set("connect", String(query.connect));
  }
  if (query.endpointTypes && query.endpointTypes.length > 0) {
    params.set("endpointTypes", query.endpointTypes.join(","));
  }
  if (query.sort !== "relevance") {
    params.set("sort", query.sort);
  }
  if (query.limit !== 12) {
    params.set("limit", String(query.limit));
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search.length > 0 ? `/agents?${search}` : "/agents";
}

export default async function AgentsDirectoryPage({ searchParams }: AgentsDirectoryPageProps) {
  const rawParams = await searchParams;

  const parsedQuery = SearchAgentsQuerySchema.safeParse({
    q: toSingleValue(rawParams.q),
    skills: toCommaValue(rawParams.skills),
    protocols: toCommaValue(rawParams.protocols),
    endpointTypes: toCommaValue(rawParams.endpointTypes),
    category: toSingleValue(rawParams.category),
    pricing: toSingleValue(rawParams.pricing),
    verified: toSingleValue(rawParams.verified),
    playground: toSingleValue(rawParams.playground),
    connect: toSingleValue(rawParams.connect),
    sort: toSingleValue(rawParams.sort),
    page: toSingleValue(rawParams.page),
    limit: toSingleValue(rawParams.limit),
  });

  const query = parsedQuery.success
    ? parsedQuery.data
    : SearchAgentsQuerySchema.parse({});

  const [result, filterOptions] = await Promise.all([
    searchAgents(query),
    getDiscoveryFilterOptions(),
  ]);

  const previousPage = query.page > 1 ? createPageHref(query.page - 1, query) : null;
  const nextPage =
    query.page < result.meta.totalPages ? createPageHref(query.page + 1, query) : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Agent Directory
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          Find agents by skills, protocols, and use cases.
        </p>
        <div className="mt-5">
          <AgentSearchBar
            actionPath="/agents"
            initialQuery={query.q}
            preservedParams={{
              skills: query.skills,
              protocols: query.protocols,
              endpointTypes: query.endpointTypes,
              category: query.category,
              pricing: query.pricing,
              verified: query.verified !== undefined ? String(query.verified) : undefined,
              playground: query.playground !== undefined ? String(query.playground) : undefined,
              connect: query.connect !== undefined ? String(query.connect) : undefined,
              sort: query.sort,
              limit: String(query.limit),
            }}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-[280px,1fr]">
        <AgentFilters
          actionPath="/agents"
          query={{
            q: query.q,
            skills: query.skills,
            protocols: query.protocols,
            endpointTypes: query.endpointTypes,
            category: query.category,
            pricing: query.pricing,
            verified: query.verified,
            playground: query.playground,
            connect: query.connect,
            sort: query.sort,
            limit: query.limit,
          }}
          options={filterOptions}
        />

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              <strong className="text-zinc-900">{result.meta.total}</strong> results found
            </p>
            <p className="text-sm text-zinc-500">
              Page {result.meta.page} of {result.meta.totalPages}
            </p>
          </div>

          <AgentGrid agents={result.agents} />

          {result.meta.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              {previousPage ? (
                <a
                  href={previousPage}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Previous
                </a>
              ) : (
                <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400">
                  Previous
                </span>
              )}

              {nextPage ? (
                <a
                  href={nextPage}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Next
                </a>
              ) : (
                <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400">
                  Next
                </span>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
