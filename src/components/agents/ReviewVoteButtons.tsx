"use client";

import { useState } from "react";

interface ReviewVoteButtonsProps {
  reviewId: string;
  helpfulCount: number;
  canVote: boolean;
}

type VoteState = "idle" | "loading" | "error";

export function ReviewVoteButtons({ reviewId, helpfulCount, canVote }: ReviewVoteButtonsProps) {
  const [state, setState] = useState<VoteState>("idle");
  const [currentHelpfulCount, setCurrentHelpfulCount] = useState(helpfulCount);

  async function submitVote(isHelpful: boolean) {
    if (!canVote) {
      return;
    }

    setState("loading");

    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHelpful }),
      });

      if (!response.ok) {
        throw new Error("Vote failed");
      }

      const payload = (await response.json()) as { data: { helpfulCount: number } };
      setCurrentHelpfulCount(payload.data.helpfulCount);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (!canVote) {
    return <p className="text-xs text-zinc-500">Helpful: {currentHelpfulCount}</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void submitVote(true)}
        disabled={state === "loading"}
        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        Helpful
      </button>
      <button
        type="button"
        onClick={() => void submitVote(false)}
        disabled={state === "loading"}
        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        Not helpful
      </button>
      <span className="text-xs text-zinc-500">{currentHelpfulCount} helpful</span>
      {state === "error" ? <span className="text-xs text-rose-700">Error</span> : null}
    </div>
  );
}
