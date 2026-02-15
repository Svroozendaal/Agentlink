"use client";

import { useState } from "react";

interface ClaimImportedAgentProps {
  importedAgentId: string;
}

interface ClaimState {
  claimId?: string;
  instructions?: string;
  claimedSlug?: string;
  error?: string;
}

export function ClaimImportedAgent({ importedAgentId }: ClaimImportedAgentProps) {
  const [state, setState] = useState<ClaimState>({});
  const [loading, setLoading] = useState(false);

  async function startClaim() {
    setLoading(true);
    setState({});
    try {
      const response = await fetch(`/api/v1/agents/unclaimed/${importedAgentId}/claim`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to start claim");
      }

      setState({
        claimId: payload.data.claimId,
        instructions: payload.data.verification.instructions,
      });
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Failed to start claim",
      });
    } finally {
      setLoading(false);
    }
  }

  async function completeClaim() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/agents/unclaimed/${importedAgentId}/claim/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: state.claimId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to complete claim");
      }

      setState({
        ...state,
        claimedSlug: payload.data.agentProfile.slug,
      });
    } catch (error) {
      setState({
        ...state,
        error: error instanceof Error ? error.message : "Failed to complete claim",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startClaim}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Working..." : "Start claim"}
      </button>

      {state.instructions ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">Verification step</p>
          <p className="mt-1">{state.instructions}</p>
          <button
            type="button"
            onClick={completeClaim}
            disabled={loading}
            className="mt-3 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Complete verification
          </button>
        </div>
      ) : null}

      {state.claimedSlug ? (
        <a
          href={`/agents/${state.claimedSlug}`}
          className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
        >
          Claim complete - open profile
        </a>
      ) : null}

      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
    </div>
  );
}

