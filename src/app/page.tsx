import Link from "next/link";

import type { Metadata } from "next";

import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentSearchBar } from "@/components/agents/AgentSearchBar";
import { COPY } from "@/lib/constants/copy";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import { getFeaturedAgents, getPlatformStats, getTopCategories } from "@/lib/services/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: COPY.meta.homeTitle,
  description: COPY.meta.siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: COPY.meta.homeTitle,
    description: COPY.meta.siteDescription,
    type: "website",
    url: "/",
    locale: "en_US",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: COPY.meta.homeTitle,
    description: COPY.meta.siteDescription,
    images: ["/opengraph-image"],
  },
};

export default async function HomePage() {
  const [featuredAgents, categories, stats] = await Promise.all([
    getFeaturedAgents(6),
    getTopCategories(8),
    getPlatformStats(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-100 p-7 shadow-sm sm:p-12">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 shadow-sm">
          AgentLink Discovery
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          {COPY.landing.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-700 sm:text-lg">
          {COPY.landing.heroSubtitle}
        </p>
        <div className="mt-7 max-w-3xl">
          <AgentSearchBar actionPath="/agents" buttonLabel={COPY.landing.ctaPrimary} placeholder={COPY.landing.searchPlaceholder} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/agents"
            className="min-w-[11.5rem] whitespace-nowrap rounded-xl bg-zinc-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-700"
          >
            {COPY.landing.ctaPrimary}
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            {COPY.landing.ctaSecondary}
          </Link>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-zinc-900">{stats.agents}</p>
          <p className="mt-1 text-sm text-zinc-600">{COPY.landing.statsAgents}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-zinc-900">{stats.reviews}</p>
          <p className="mt-1 text-sm text-zinc-600">{COPY.landing.statsReviews}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-zinc-900">{stats.endorsements}</p>
          <p className="mt-1 text-sm text-zinc-600">{COPY.landing.statsEndorsements}</p>
        </article>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-900">{COPY.landing.featuredTitle}</h2>
          <Link href="/agents" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            {COPY.landing.featuredViewAll}
          </Link>
        </div>
        <AgentGrid agents={featuredAgents} />
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step 1</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">{COPY.landing.step1Title}</h3>
          <p className="mt-2 text-sm text-zinc-600">{COPY.landing.step1Desc}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step 2</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">{COPY.landing.step2Title}</h3>
          <p className="mt-2 text-sm text-zinc-600">{COPY.landing.step2Desc}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Step 3</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">{COPY.landing.step3Title}</h3>
          <p className="mt-2 text-sm text-zinc-600">{COPY.landing.step3Desc}</p>
        </article>
      </section>

      <section className="mt-12 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-zinc-900">{COPY.landing.devTitle}</h2>
        <p className="mt-2 text-zinc-600">{COPY.landing.devDesc}</p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
          <code>{`curl -X POST /api/v1/agents/register \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My Agent","description":"...","skills":["search"],"protocols":["rest"]}'`}</code>
        </pre>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/docs" className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-700">
            API documentation
          </Link>
          <Link href="/register" className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
            {COPY.landing.devCta}
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-900">Popular categories</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.category}
              href={`/categories/${encodeURIComponent(category.category.toLowerCase())}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">{category.category}</p>
              <p className="mt-1 text-sm text-zinc-600">{category.count} agents</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
