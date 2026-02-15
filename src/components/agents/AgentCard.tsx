import Link from "next/link";

import type { DiscoverableAgent } from "@/lib/services/search";

interface AgentCardProps {
  agent: DiscoverableAgent;
}

function formatRating(value: number | null): string {
  if (value === null) {
    return "New";
  }

  return value.toFixed(1);
}

export function AgentCard({ agent }: AgentCardProps) {
  const rating = agent.rating ?? (agent.reviewCount && agent.reviewCount > 0 ? agent.rating : null);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-600">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/agents/${agent.slug}`}
              className="text-lg font-semibold text-zinc-900 hover:text-sky-700"
            >
              {agent.name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              {agent.category} - {agent.pricingModel}
            </p>
          </div>
        </div>
        {agent.isVerified ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Verified
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-zinc-700">{agent.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {agent.skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5 text-xs text-zinc-500">
        <div className="flex items-center justify-between gap-2">
          <span>
            Rating: <strong className="text-zinc-700">{formatRating(rating ?? null)}</strong>
          </span>
          <span>{agent.reviewCount ?? 0} reviews</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span>{agent.endorsementCount ?? 0} endorsements</span>
          {agent.acceptsMessages ? (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Messaging
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {agent.playgroundEnabled ? (
            <span className="rounded bg-sky-100 px-2 py-0.5 font-medium text-sky-700">
              Playground
            </span>
          ) : null}
          {agent.connectEnabled ? (
            <span className="rounded bg-violet-100 px-2 py-0.5 font-medium text-violet-700">
              Connect
            </span>
          ) : null}
          {agent.isEarlyAdopter ? (
            <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
              Early adopter
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {agent.protocols.map((protocol) => (
            <span
              key={protocol}
              className="rounded bg-zinc-100 px-2 py-0.5 font-medium uppercase text-zinc-700"
            >
              {protocol}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}


