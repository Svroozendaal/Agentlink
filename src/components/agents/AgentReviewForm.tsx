"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

interface AgentReviewFormProps {
  slug: string;
  canReview: boolean;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function AgentReviewForm({ slug, canReview }: AgentReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim().length > 0 ? comment : undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message ?? "Failed to submit review");
      }

      setState("success");
      setMessage("Review opgeslagen.");
      setComment("");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Er ging iets mis.");
    }
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Log in om een review achter te laten.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Laat een review achter</h3>

      <div>
        <label htmlFor="rating" className="mb-1 block text-sm font-medium text-zinc-700">
          Rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
        >
          <option value={5}>5 - Uitstekend</option>
          <option value={4}>4 - Goed</option>
          <option value={3}>3 - Gemiddeld</option>
          <option value={2}>2 - Matig</option>
          <option value={1}>1 - Slecht</option>
        </select>
      </div>

      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-zinc-700">
          Commentaar (optioneel)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Beschrijf je ervaring met deze agent..."
          rows={4}
          maxLength={1200}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "loading" ? "Opslaan..." : "Review opslaan"}
        </button>
        {message ? (
          <p className={`text-sm ${state === "error" ? "text-rose-700" : "text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
