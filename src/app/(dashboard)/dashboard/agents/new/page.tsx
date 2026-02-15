import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

import { NewAgentForm } from "./new-agent-form";

export default async function NewAgentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">New agent</h1>
      <p className="mt-2 text-zinc-600">
        Register your agent profile so others can discover it on AgentLink.
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <NewAgentForm />
      </div>
    </main>
  );
}
