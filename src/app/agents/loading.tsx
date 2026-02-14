import { AgentGridSkeleton } from "@/components/agents/AgentGrid";

export default function AgentsLoadingPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
      <section className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-10 w-64 rounded bg-zinc-200" />
        <div className="mt-3 h-5 w-96 rounded bg-zinc-200" />
        <div className="mt-6 h-14 w-full rounded-xl bg-zinc-200" />
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-[280px,1fr]">
        <aside className="hidden h-[520px] animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 md:block" />
        <AgentGridSkeleton />
      </section>
    </main>
  );
}
