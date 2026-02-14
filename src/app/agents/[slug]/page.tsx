import { Suspense } from "react";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { AgentReviewForm } from "@/components/agents/AgentReviewForm";
import { authOptions } from "@/lib/auth";
import { getAgentBySlug } from "@/lib/services/agents";
import { listAgentReviewsBySlug } from "@/lib/services/reviews";

interface AgentProfilePageProps {
  params: Promise<{ slug: string }>;
}

interface AgentProfileContentProps {
  slug: string;
  viewerUserId?: string;
}

async function AgentProfileContent({ slug, viewerUserId }: AgentProfileContentProps) {
  const agent = await getAgentBySlug(slug, viewerUserId);

  if (!agent) {
    notFound();
  }

  const reviewResult = await listAgentReviewsBySlug(slug, viewerUserId, {
    page: 1,
    limit: 5,
  });
  const averageRatingLabel =
    reviewResult.summary.averageRating === null
      ? "Nog geen rating"
      : `${reviewResult.summary.averageRating.toFixed(1)} / 5`;
  const canReview = Boolean(viewerUserId && viewerUserId !== agent.ownerId && agent.isPublished);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-500">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{agent.name}</h1>
            <p className="mt-2 text-zinc-600">{agent.description}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Beschrijving</h2>
            <p className="mt-2 whitespace-pre-line text-zinc-700">
              {agent.longDescription ?? "Geen uitgebreide beschrijving beschikbaar."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Reputatie</h2>
            <p className="mt-2 text-sm text-zinc-700">
              <strong>{averageRatingLabel}</strong> ({reviewResult.summary.reviewCount} reviews)
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recente reviews</h2>
            <div className="mt-3 space-y-3">
              {reviewResult.reviews.length > 0 ? (
                reviewResult.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-zinc-800">
                        {review.reviewer.name ?? "Anonieme reviewer"}
                      </p>
                      <p className="text-zinc-600">{review.rating}/5</p>
                    </div>
                    <p className="mt-2 text-zinc-700">
                      {review.comment ?? "Geen commentaar toegevoegd."}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-zinc-600">Nog geen reviews beschikbaar.</p>
              )}
            </div>
          </div>

          <AgentReviewForm slug={slug} canReview={canReview} />
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick Info</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Categorie</dt>
              <dd className="text-right font-medium text-zinc-800">{agent.category}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Pricing</dt>
              <dd className="text-right font-medium text-zinc-800">{agent.pricingModel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Status</dt>
              <dd className="text-right font-medium text-zinc-800">
                {agent.isPublished ? "Published" : "Draft"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Rating</dt>
              <dd className="text-right font-medium text-zinc-800">{averageRatingLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Reviews</dt>
              <dd className="text-right font-medium text-zinc-800">
                {reviewResult.summary.reviewCount}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Protocols</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {agent.protocols.map((protocol) => (
              <span
                key={protocol}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800"
              >
                {protocol}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {agent.endpointUrl ? (
              <li>
                <a
                  href={agent.endpointUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:underline"
                >
                  Endpoint URL
                </a>
              </li>
            ) : null}
            {agent.documentationUrl ? (
              <li>
                <a
                  href={agent.documentationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:underline"
                >
                  Documentatie
                </a>
              </li>
            ) : null}
            {agent.websiteUrl ? (
              <li>
                <a
                  href={agent.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:underline"
                >
                  Website
                </a>
              </li>
            ) : null}
            <li>
              <a
                href={`/api/v1/agents/${agent.slug}/card`}
                target="_blank"
                rel="noreferrer"
                className="text-sky-700 hover:underline"
              >
                Machine-readable Agent Card
              </a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function AgentProfileSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="h-96 rounded-2xl border border-zinc-200 bg-white" />
      <div className="space-y-6">
        <div className="h-44 rounded-2xl border border-zinc-200 bg-white" />
        <div className="h-32 rounded-2xl border border-zinc-200 bg-white" />
        <div className="h-32 rounded-2xl border border-zinc-200 bg-white" />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: AgentProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    return {
      title: "Agent not found | AgentLink",
      description: "The requested agent profile could not be found.",
    };
  }

  return {
    title: `${agent.name} | AgentLink`,
    description: agent.description,
    openGraph: {
      title: `${agent.name} | AgentLink`,
      description: agent.description,
    },
  };
}

export default async function AgentProfilePage({ params }: AgentProfilePageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const viewerUserId = session?.user?.id;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <Suspense fallback={<AgentProfileSkeleton />}>
        <AgentProfileContent slug={slug} viewerUserId={viewerUserId} />
      </Suspense>
    </main>
  );
}
