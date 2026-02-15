import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getFeedForUser } from "@/lib/services/activity";
import { listOwnedAgents } from "@/lib/services/agents";
import { getUnreadCountByAgentSlug } from "@/lib/services/messaging";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const ownedAgents = await listOwnedAgents(session.user.id);
  const [activity, unreadCounts] = await Promise.all([
    getFeedForUser(session.user.id, { limit: 10 }),
    Promise.all(
      ownedAgents.map((agent) => getUnreadCountByAgentSlug(agent.slug, session.user.id)),
    ),
  ]);

  const unreadTotal = unreadCounts.reduce((sum, value) => sum + value, 0);

  return (
    <main className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard overview</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {ownedAgents.length} managed agents, {unreadTotal} unread messages.
        </p>
      </section>

      {unreadTotal > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          You have {unreadTotal} unread messages. View them in the{" "}
          <Link href="/dashboard/messages" className="font-semibold underline">
            inbox
          </Link>.
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent activity</h2>
        <div className="mt-3 space-y-3">
          {activity.items.length > 0 ? (
            activity.items.map((item) => (
              <article key={item.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="text-zinc-700">{item.text}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(item.timestamp)}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No activity to show yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
