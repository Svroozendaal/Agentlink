"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportsClientProps {
  initialStats: {
    total: number;
    unclaimed: number;
    claimPending: number;
    claimed: number;
    rejected: number;
    bySource: Array<{ source: string; count: number }>;
  };
}

export function ImportsClient({ initialStats }: ImportsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function trigger(path: string) {
    setLoading(path);
    setError(null);
    try {
      const response = await fetch(path, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Request failed");
      }

      router.refresh();
    } catch (triggerError) {
      setError(triggerError instanceof Error ? triggerError.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Import actions</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => trigger("/api/v1/admin/import/huggingface?limit=100")}
          disabled={loading !== null}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          {loading === "/api/v1/admin/import/huggingface?limit=100"
            ? "Running..."
            : "Import Hugging Face"}
        </button>
        <button
          type="button"
          onClick={() => trigger("/api/v1/admin/import/github?limit=40&minStars=10")}
          disabled={loading !== null}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          {loading === "/api/v1/admin/import/github?limit=40&minStars=10"
            ? "Running..."
            : "Import GitHub"}
        </button>
        <button
          type="button"
          onClick={() => trigger("/api/v1/admin/metrics/record")}
          disabled={loading !== null}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          {loading === "/api/v1/admin/metrics/record" ? "Running..." : "Record metrics"}
        </button>
      </div>

      <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-5">
        <p>Total: {initialStats.total}</p>
        <p>Unclaimed: {initialStats.unclaimed}</p>
        <p>Pending: {initialStats.claimPending}</p>
        <p>Claimed: {initialStats.claimed}</p>
        <p>Rejected: {initialStats.rejected}</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}

