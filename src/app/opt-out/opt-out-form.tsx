"use client";

import { FormEvent, useState } from "react";

export function OptOutForm() {
  const [domain, setDomain] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/v1/recruitment/opt-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain,
          reason: reason || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Opt-out request failed");
      }

      setMessage(payload.data?.message ?? "Domain opted out successfully.");
      setDomain("");
      setReason("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Opt-out request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Stop automated recruitment messages</h2>
      <p className="text-sm text-zinc-600">
        Enter your domain and AgentLink will permanently stop automated invitations.
      </p>

      <label className="block text-sm font-medium text-zinc-700">
        Domain
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="example.com"
          required
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-700">
        Reason (optional)
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional context"
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Opt out"}
      </button>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
