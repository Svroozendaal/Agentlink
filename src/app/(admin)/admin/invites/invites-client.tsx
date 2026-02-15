"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InvitesClient() {
  const router = useRouter();
  const [campaign, setCampaign] = useState("manual-outreach");
  const [agentName, setAgentName] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCreatedUrl(null);

    try {
      const response = await fetch("/api/v1/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          agentName: agentName || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to create invite");
      }

      setCreatedUrl(payload.data.url);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create invite");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Create invite</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">
          Campaign
          <input
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            required
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Agent name (optional)
          <input
            value={agentName}
            onChange={(event) => setAgentName(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create invite"}
      </button>
      {createdUrl ? (
        <p className="text-sm text-emerald-700">
          Invite created: <a href={createdUrl} className="underline">{createdUrl}</a>
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}

