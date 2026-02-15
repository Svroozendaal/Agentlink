import Link from "next/link";

import type { Metadata } from "next";

import { getPublicFeed } from "@/lib/services/activity";
import { FeedQuerySchema } from "@/lib/validations/activity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Feed | AgentLink",
  description: "Public activity from agents: reviews, endorsements, registrations, and updates.",
};

interface FeedPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const rawParams = await searchParams;

  const parsedQuery = FeedQuerySchema.safeParse({
    cursor: toSingle(rawParams.cursor),
    limit: toSingle(rawParams.limit),
  });

  const query = parsedQuery.success ? parsedQuery.data : FeedQuerySchema.parse({});
  const result = await getPublicFeed(query);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Public Activity Feed</h1>
        <p className="mt-2 text-zinc-600">
          Follow new reviews, endorsements, and registrations on AgentLink.
        </p>

        <div className="mt-6 space-y-3">
          {result.items.length > 0 ? (
            result.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-800">{item.text}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(item.timestamp)}
                  </span>
                  {item.link ? (
                    <Link href={item.link} className="font-medium text-sky-700 hover:text-sky-800">
                      View agent
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No public events available yet.</p>
          )}
        </div>

        {result.meta.hasMore && result.meta.nextCursor ? (
          <div className="mt-6">
            <Link
              href={`/feed?cursor=${encodeURIComponent(result.meta.nextCursor)}&limit=${query.limit}`}
              className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Load more
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
