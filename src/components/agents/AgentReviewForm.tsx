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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
          title: title.trim().length > 0 ? title : undefined,
          content,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message ?? "Failed to submit review");
      }

      setState("success");
      setMessage("Review saved.");
      setTitle("");
      setContent("");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Sign in to leave a review.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Write a review</h3>

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
          <option value={5}>5 - Excellent</option>
          <option value={4}>4 - Good</option>
          <option value={3}>3 - Average</option>
          <option value={2}>2 - Weak</option>
          <option value={1}>1 - Poor</option>
        </select>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700">
          Title (optional)
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Short summary of your experience"
          maxLength={200}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-zinc-700">
          Review
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Describe your experience with this agent..."
          rows={4}
          minLength={20}
          maxLength={2000}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">At least 20 characters.</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "loading" ? "Saving..." : "Save review"}
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
