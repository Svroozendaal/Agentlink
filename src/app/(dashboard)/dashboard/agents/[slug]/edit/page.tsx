import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getAgentBySlug } from "@/lib/services/agents";

import { EditAgentForm } from "./edit-agent-form";
import { EndpointManager } from "./endpoint-manager";

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
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Edit agent</h1>
        <p className="mt-2 text-zinc-600">
          Update profile information and manage messaging, playground, and connect settings.
        </p>
      </div>

      <EditAgentForm
        slug={agent.slug}
        initialValues={{
          name: agent.name,
          description: agent.description,
          longDescription: agent.longDescription ?? "",
          isPublished: agent.isPublished,
          acceptsMessages: agent.acceptsMessages,
          playgroundEnabled: agent.playgroundEnabled,
          connectEnabled: agent.connectEnabled,
        }}
      />

      <EndpointManager slug={agent.slug} />

      <Link
        href="/dashboard/agents"
        className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        Back to overview
      </Link>
    </main>
  );
}
