"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditAgentFormProps {
  slug: string;
  initialValues: {
    name: string;
    description: string;
    longDescription: string;
    isPublished: boolean;
    acceptsMessages: boolean;
    playgroundEnabled: boolean;
    connectEnabled: boolean;
  };
}

export function EditAgentForm({ slug, initialValues }: EditAgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [longDescription, setLongDescription] = useState(initialValues.longDescription);
  const [isPublished, setIsPublished] = useState(initialValues.isPublished);
  const [acceptsMessages, setAcceptsMessages] = useState(initialValues.acceptsMessages);
  const [playgroundEnabled, setPlaygroundEnabled] = useState(initialValues.playgroundEnabled);
  const [connectEnabled, setConnectEnabled] = useState(initialValues.connectEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          longDescription,
          isPublished,
          acceptsMessages,
          playgroundEnabled,
          connectEnabled,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to save changes");
      }

      const nextSlug = payload?.data?.slug ?? slug;
      router.push(`/dashboard/agents/${nextSlug}/edit`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-zinc-700">
          Short description
        </label>
        <input
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="longDescription" className="mb-1 block text-sm font-medium text-zinc-700">
          Long description
        </label>
        <textarea
          id="longDescription"
          value={longDescription}
          onChange={(event) => setLongDescription(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={acceptsMessages}
          onChange={(event) => setAcceptsMessages(event.target.checked)}
        />
        Accept messages
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={playgroundEnabled}
          onChange={(event) => setPlaygroundEnabled(event.target.checked)}
        />
        Enable playground
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={connectEnabled}
          onChange={(event) => setConnectEnabled(event.target.checked)}
        />
        Enable connect API
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
        />
        Published
      </label>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
