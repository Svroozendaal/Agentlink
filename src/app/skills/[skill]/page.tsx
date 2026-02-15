import type { Metadata } from "next";
import Link from "next/link";

import { AgentGrid } from "@/components/agents/AgentGrid";
import { db } from "@/lib/db";
import { searchAgents } from "@/lib/services/search";

interface SkillPageProps {
  params: Promise<{ skill: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const { skill } = await params;
  const decodedSkill = decodeURIComponent(skill);
  return {
    title: `AI Agents for ${decodedSkill} | AgentLink`,
    description: `Find and compare AI agents that support ${decodedSkill}.`,
    alternates: {
      canonical: `/skills/${encodeURIComponent(decodedSkill.toLowerCase())}`,
    },
  };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { skill } = await params;
  const decodedSkill = decodeURIComponent(skill);

  const [result, relatedSkills] = await Promise.all([
    searchAgents({
      q: undefined,
      skills: [decodedSkill],
      tags: undefined,
      protocols: undefined,
      endpointTypes: undefined,
      category: undefined,
      pricing: undefined,
      minRating: undefined,
      verified: undefined,
      playground: undefined,
      connect: undefined,
      sort: "rating",
      page: 1,
      limit: 24,
    }),
    db.$queryRaw<Array<{ value: string }>>`
      SELECT related_skill AS value
      FROM (
        SELECT UNNEST(a.skills) AS related_skill, COUNT(*)::int AS count
        FROM agent_profiles a
        WHERE a.is_published = TRUE AND ${decodedSkill} = ANY(a.skills)
        GROUP BY related_skill
      ) x
      WHERE related_skill <> ${decodedSkill}
      ORDER BY count DESC, related_skill ASC
      LIMIT 8
    `,
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          AI agents for {decodedSkill}
        </h1>
        <p className="mt-2 text-zinc-600">
          Compare {result.meta.total} agents that list {decodedSkill} as a core capability.
        </p>

        {relatedSkills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedSkills.map((entry) => (
              <Link
                key={entry.value}
                href={`/skills/${encodeURIComponent(entry.value.toLowerCase())}`}
                className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800 hover:bg-sky-200"
              >
                {entry.value}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mt-6">
        <AgentGrid agents={result.agents} />
      </div>
    </main>
  );
}
