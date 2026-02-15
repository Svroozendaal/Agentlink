import Link from "next/link";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { AgentContactForm } from "@/components/agents/AgentContactForm";
import { AgentEndorsementActions } from "@/components/agents/AgentEndorsementActions";
import { AgentReviewForm } from "@/components/agents/AgentReviewForm";
import { ReviewVoteButtons } from "@/components/agents/ReviewVoteButtons";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAgentActivityPreview } from "@/lib/services/activity";
import { getAgentBySlug, listOwnedAgents } from "@/lib/services/agents";
import { listEndpoints } from "@/lib/services/endpoints";
import { listEndorsementsBySlug } from "@/lib/services/endorsements";
import { listAgentReviewsBySlug } from "@/lib/services/reviews";

interface AgentProfilePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

type ProfileTab = "overview" | "reviews" | "playground" | "api" | "activity";

function resolveTab(value: string | undefined): ProfileTab {
  if (value === "reviews" || value === "playground" || value === "api" || value === "activity") {
    return value;
  }

  return "overview";
}

function statusBadge(status: string) {
  if (status === "HEALTHY") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "DEGRADED") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "DOWN") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-zinc-100 text-zinc-700";
}

function endpointMethodLabel(method: string | null, type: string) {
  if (type !== "REST") {
    return type;
  }

  return method ?? "POST";
}

async function AgentProfileContent({
  slug,
  viewerUserId,
  viewerRole,
  activeTab,
}: {
  slug: string;
  viewerUserId?: string;
  viewerRole?: Role;
  activeTab: ProfileTab;
}) {
  const agent = await getAgentBySlug(slug, viewerUserId, viewerRole);

  if (!agent) {
    notFound();
  }

  const [reviewResult, endorsementResult, activityEvents, ownedAgents, endpoints, playgroundCount, connectCount] =
    await Promise.all([
      listAgentReviewsBySlug(slug, viewerUserId, {
        page: 1,
        limit: 10,
        sort: "newest",
      }),
      listEndorsementsBySlug(slug, viewerUserId),
      getAgentActivityPreview(agent.id, 12),
      viewerUserId ? listOwnedAgents(viewerUserId) : Promise.resolve([]),
      listEndpoints(slug, viewerUserId),
      db.playgroundSession.count({
        where: { agentId: agent.id },
      }),
      db.connectRequest.count({
        where: {
          toAgentId: agent.id,
        },
      }),
    ]);

  const averageRatingLabel =
    reviewResult.summary.averageRating === null
      ? "No rating yet"
      : `${reviewResult.summary.averageRating.toFixed(1)} / 5`;
  const canReview = Boolean(viewerUserId && viewerUserId !== agent.ownerId && agent.isPublished);
  const canEndorse = Boolean(viewerUserId && viewerUserId !== agent.ownerId && agent.isPublished);
  const defaultEndpoint = endpoints.find((endpoint) => endpoint.isDefault) ?? endpoints[0];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: agent.name,
    description: agent.description,
    applicationCategory: "AI Agent",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/UseAction",
      userInteractionCount: playgroundCount,
    },
    aggregateRating:
      reviewResult.summary.averageRating === null
        ? undefined
        : {
            "@type": "AggregateRating",
            ratingValue: reviewResult.summary.averageRating.toFixed(1),
            reviewCount: String(reviewResult.summary.reviewCount),
          },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{agent.name}</h1>
              {agent.isVerified ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              ) : null}
              {agent.isEarlyAdopter ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Early adopter
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-3xl text-zinc-600">{agent.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
              <span>
                Rating: <strong className="text-zinc-900">{averageRatingLabel}</strong>
              </span>
              <span>{reviewResult.summary.reviewCount} reviews</span>
              <span>{endorsementResult.endorsementCount} endorsements</span>
              <span>{playgroundCount} playground tests</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {agent.playgroundEnabled ? (
              <Link
                href={`/agents/${agent.slug}/playground`}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Try this agent
              </Link>
            ) : null}
            {agent.connectEnabled ? (
              <Link
                href={`/agents/${agent.slug}?tab=api`}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Connect via API
              </Link>
            ) : null}
            <a
              href={`/api/v1/agents/${agent.slug}/card`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Agent card
            </a>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {[
            ["overview", "Overview"],
            ["reviews", "Reviews"],
            ["playground", "Playground"],
            ["api", "API / Connect"],
            ["activity", "Activity"],
          ].map(([tab, label]) => (
            <Link
              key={tab}
              href={`/agents/${agent.slug}?tab=${tab}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeTab === tab ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {activeTab === "overview" ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Description</h2>
                <p className="mt-3 whitespace-pre-line text-zinc-700">
                  {agent.longDescription ?? "No extended description provided."}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.skills.map((skill) => (
                    <Link
                      key={skill}
                      href={`/skills/${encodeURIComponent(skill.toLowerCase())}`}
                      className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800 hover:bg-sky-200"
                    >
                      {skill}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Endorsements</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {endorsementResult.skills.length > 0 ? (
                    endorsementResult.skills.map((entry) => (
                      <span
                        key={entry.skill}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                      >
                        {entry.skill} ({entry.count})
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600">No endorsements yet.</p>
                  )}
                </div>
                <div className="mt-4">
                  <AgentEndorsementActions slug={slug} skills={agent.skills} canEndorse={canEndorse} />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Endpoints</h2>
                {endpoints.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {endpoints.map((endpoint) => (
                      <article key={endpoint.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                              {endpoint.type}
                            </span>
                            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                              {endpointMethodLabel(endpoint.method, endpoint.type)}
                            </span>
                            {endpoint.isDefault ? (
                              <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                Default
                              </span>
                            ) : null}
                            {agent.connectEnabled ? (
                              <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                                Connect-ready
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(endpoint.healthStatus)}`}
                          >
                            {endpoint.healthStatus.toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-2 break-all font-mono text-xs text-zinc-700">{endpoint.url}</p>
                        {endpoint.description ? (
                          <p className="mt-1 text-sm text-zinc-600">{endpoint.description}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-600">
                    No endpoint records found. Fallback endpoint:{" "}
                    {agent.endpointUrl ? (
                      <a href={agent.endpointUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                        {agent.endpointUrl}
                      </a>
                    ) : (
                      "not configured"
                    )}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Connection info</h2>
                <p className="mt-2 text-sm text-zinc-700">
                  Use the playground for manual testing, or call this agent through the Connect API for machine-to-machine workflows.
                </p>
                {defaultEndpoint ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                    <code>{`curl -X ${endpointMethodLabel(defaultEndpoint.method, defaultEndpoint.type)} '${defaultEndpoint.url}' \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"example"}'`}</code>
                  </pre>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.playgroundEnabled ? (
                    <Link
                      href={`/agents/${agent.slug}/playground`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Open playground
                    </Link>
                  ) : null}
                  {agent.documentationUrl ? (
                    <a
                      href={agent.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Developer docs
                    </a>
                  ) : null}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Contact</h2>
                <div className="mt-3">
                  <AgentContactForm
                    slug={agent.slug}
                    acceptsMessages={agent.acceptsMessages}
                    ownedAgents={ownedAgents.map((owned) => ({ slug: owned.slug, name: owned.name }))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "reviews" ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900">Reviews</h2>
              <div className="space-y-3">
                {reviewResult.reviews.length > 0 ? (
                  reviewResult.reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-zinc-800">{review.reviewer.name ?? "Anonymous reviewer"}</p>
                        <p className="text-zinc-600">{review.rating}/5</p>
                      </div>
                      {review.title ? <p className="mt-2 font-medium text-zinc-800">{review.title}</p> : null}
                      <p className="mt-1 whitespace-pre-line text-zinc-700">
                        {review.content ?? "No comment provided."}
                      </p>
                      <div className="mt-3">
                        <ReviewVoteButtons
                          reviewId={review.id}
                          helpfulCount={review.helpfulCount}
                          canVote={Boolean(viewerUserId && review.reviewer.id !== viewerUserId)}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-zinc-600">No reviews yet.</p>
                )}
              </div>
              <AgentReviewForm slug={slug} canReview={canReview} />
            </div>
          ) : null}

          {activeTab === "playground" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Playground</h2>
              {agent.playgroundEnabled ? (
                <>
                  <p className="text-sm text-zinc-700">
                    This agent supports direct testing through AgentLink&apos;s playground proxy.
                  </p>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                    <p>Total playground sessions: {playgroundCount}</p>
                  </div>
                  <Link
                    href={`/agents/${agent.slug}/playground`}
                    className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                  >
                    Open full playground
                  </Link>
                </>
              ) : (
                <p className="text-sm text-zinc-600">
                  Playground is not available for this agent.
                </p>
              )}
            </div>
          ) : null}

          {activeTab === "api" ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900">API / Connect</h2>
              <p className="text-sm text-zinc-700">
                Connect requests received: {connectCount}. Use <code>/api/v1/agents/{agent.slug}/connect</code> to call this agent through AgentLink.
              </p>
              {endpoints.length > 0 ? (
                <div className="space-y-3">
                  {endpoints.map((endpoint) => (
                    <article key={endpoint.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-zinc-800">
                          {endpoint.type} - {endpointMethodLabel(endpoint.method, endpoint.type)}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(endpoint.healthStatus)}`}
                        >
                          {endpoint.healthStatus.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-zinc-700">{endpoint.url}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">No endpoint details published yet.</p>
              )}

              {defaultEndpoint ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                    <code>{`# cURL
curl -X ${endpointMethodLabel(defaultEndpoint.method, defaultEndpoint.type)} '${defaultEndpoint.url}' \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"example"}'`}</code>
                  </pre>
                  <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                    <code>{`// JavaScript\nawait fetch('${defaultEndpoint.url}', {\n  method: '${endpointMethodLabel(defaultEndpoint.method, defaultEndpoint.type)}',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ query: 'example' }),\n});`}</code>
                  </pre>
                  <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                    <code>{`# Python\nimport requests\nrequests.request(\n  '${endpointMethodLabel(defaultEndpoint.method, defaultEndpoint.type)}',\n  '${defaultEndpoint.url}',\n  json={'query': 'example'},\n)`}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-900">Activity</h2>
              {activityEvents.length > 0 ? (
                activityEvents.map((event) => (
                  <article key={event.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
                    <p className="text-zinc-700">{event.text}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(event.timestamp)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No public activity yet.</p>
              )}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick info</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Category</dt>
                <dd className="text-right font-medium text-zinc-800">
                  <Link href={`/categories/${encodeURIComponent(agent.category.toLowerCase())}`} className="hover:text-sky-700">
                    {agent.category}
                  </Link>
                </dd>
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
                <dt className="text-zinc-500">Playground</dt>
                <dd className="text-right font-medium text-zinc-800">
                  {agent.playgroundEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Connect</dt>
                <dd className="text-right font-medium text-zinc-800">
                  {agent.connectEnabled ? "Enabled" : "Disabled"}
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
              {agent.documentationUrl ? (
                <li>
                  <a href={agent.documentationUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                    Documentation
                  </a>
                </li>
              ) : null}
              {agent.websiteUrl ? (
                <li>
                  <a href={agent.websiteUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                    Website
                  </a>
                </li>
              ) : null}
              <li>
                <a href={`/api/v1/agents/${agent.slug}/card`} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                  Machine-readable Agent Card
                </a>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </>
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
      type: "profile",
      locale: "en_US",
      url: `/agents/${agent.slug}`,
    },
    alternates: {
      canonical: `/agents/${agent.slug}`,
    },
  };
}

export default async function AgentProfilePage({
  params,
  searchParams,
}: AgentProfilePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolveTab(resolvedSearchParams.tab);
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <AgentProfileContent
        slug={slug}
        viewerUserId={session?.user?.id}
        viewerRole={session?.user?.role ?? Role.USER}
        activeTab={activeTab}
      />
    </main>
  );
}
