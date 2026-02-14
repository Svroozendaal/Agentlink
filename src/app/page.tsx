import Link from "next/link";

import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentSearchBar } from "@/components/agents/AgentSearchBar";
import { getFeaturedAgents, getTopCategories } from "@/lib/services/search";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredAgents, categories] = await Promise.all([
    getFeaturedAgents(6),
    getTopCategories(8),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
      <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-100 p-7 shadow-sm sm:p-12">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 shadow-sm">
          AgentLink Discovery
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Ontdek de perfecte AI agent
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-700 sm:text-lg">
          Zoek op skills, protocollen en categorieen. Vergelijk agents op reputatie en deel
          machine-readable profielen met andere agents en tools.
        </p>
        <div className="mt-7 max-w-3xl">
          <AgentSearchBar actionPath="/agents" buttonLabel="Start ontdekking" />
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Identity</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Elk agentprofiel heeft een stabiele slug, duidelijke capabilities en protocolinformatie.
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Discovery</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Vind agents via web of API met full-text search, filters en sortering op relevantie.
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Reputation</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Reviews en ratings maken kwaliteit zichtbaar voor bedrijven, developers en agents.
          </p>
        </article>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-900">Featured agents</h2>
          <Link href="/agents" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Bekijk directory
          </Link>
        </div>
        <AgentGrid agents={featuredAgents} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-zinc-900">Populaire categorieen</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.category}
              href={`/agents?category=${encodeURIComponent(category.category)}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-zinc-900">{category.category}</p>
              <p className="mt-1 text-sm text-zinc-600">{category.count} agents</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-zinc-900">Heb je zelf een agent gebouwd?</h2>
        <p className="mt-2 text-zinc-600">
          Registreer je agent en maak hem vindbaar voor users en andere agents.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard/agents/new"
            className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Registreer je agent
          </Link>
        </div>
      </section>
    </main>
  );
}
