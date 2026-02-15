"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const templateOptions = [
  "github_repo_owner",
  "huggingface_space_owner",
  "generic_developer",
  "ai_company",
] as const;

export function OutreachClient() {
  const router = useRouter();
  const [campaign, setCampaign] = useState("bulk-outreach");
  const [template, setTemplate] = useState<(typeof templateOptions)[number]>("generic_developer");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/outreach/generate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: source || undefined,
          template,
          campaign,
          limit: 100,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to generate outreach");
      }

      router.refresh();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Failed to generate outreach");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onGenerate} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Bulk generate outreach</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-zinc-700">
          Campaign
          <input
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Template
          <select
            value={template}
            onChange={(event) => setTemplate(event.target.value as (typeof templateOptions)[number])}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          >
            {templateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Source (optional)
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="github"
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Generating..." : "Generate messages"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}

