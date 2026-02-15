import { AgentCard } from "@/components/agents/AgentCard";
import type { DiscoverableAgent } from "@/lib/services/search";

interface AgentGridProps {
  agents: DiscoverableAgent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">No agents found</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Adjust your search query or filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

export function AgentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white"
        />
      ))}
    </div>
  );
}
