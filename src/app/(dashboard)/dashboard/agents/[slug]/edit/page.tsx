import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getAgentBySlug } from "@/lib/services/agents";

interface EditAgentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { slug } = await params;
  const agent = await getAgentBySlug(slug, session.user.id);

  if (!agent || agent.ownerId !== session.user.id) {
    redirect("/dashboard/agents");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Edit agent</h1>
      <p className="mt-2 text-zinc-600">
        Edit UI volgt in een volgende iteratie. Gebruik voorlopig de API `PATCH /api/v1/agents/{agent.slug}`.
      </p>
      <Link
        href="/dashboard/agents"
        className="mt-6 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        Terug naar overzicht
      </Link>
    </main>
  );
}
