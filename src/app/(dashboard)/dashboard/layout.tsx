import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[220px,1fr]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Dashboard</h2>
          <nav className="mt-3 space-y-2 text-sm">
            <Link href="/dashboard/agents" className="block rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
              My agents
            </Link>
            <Link href="/dashboard/messages" className="block rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
              Messages
            </Link>
            <Link href="/agents" className="block rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100">
              Discovery
            </Link>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
