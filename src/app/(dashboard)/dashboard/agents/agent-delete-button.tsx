"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

interface AgentDeleteButtonProps {
  slug: string;
}

export function AgentDeleteButton({ slug }: AgentDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Weet je zeker dat je deze agent wilt unpublishen?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Kon agent niet verwijderen.");
      }

      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Onbekende fout");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
