"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface JoinInviteFormProps {
  token: string;
  initialData: Record<string, unknown> | null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function JoinInviteForm({ token, initialData }: JoinInviteFormProps) {
  const router = useRouter();
  const defaults = useMemo(
    () => ({
      name: typeof initialData?.name === "string" ? initialData.name : "",
      description: typeof initialData?.description === "string" ? initialData.description : "",
      skills: toStringArray(initialData?.skills).join(", "),
      endpointUrl: typeof initialData?.endpointUrl === "string" ? initialData.endpointUrl : "",
      websiteUrl: typeof initialData?.websiteUrl === "string" ? initialData.websiteUrl : "",
    }),
    [initialData],
  );
  const [name, setName] = useState(defaults.name);
  const [description, setDescription] = useState(defaults.description);
  const [skills, setSkills] = useState(defaults.skills);
  const [endpointUrl, setEndpointUrl] = useState(defaults.endpointUrl);
  const [websiteUrl, setWebsiteUrl] = useState(defaults.websiteUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const redeemResponse = await fetch(`/api/v1/join/${token}/redeem`, { method: "POST" });
      const redeemPayload = await redeemResponse.json();
      if (!redeemResponse.ok) {
        throw new Error(redeemPayload?.error?.message ?? "Failed to validate invite token");
      }

      const response = await fetch("/api/v1/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          longDescription: description,
          skills: skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          protocols: ["rest"],
          endpointUrl,
          websiteUrl,
          pricingModel: "FREE",
          acceptsMessages: true,
          isPublished: true,
          playgroundEnabled: true,
          connectEnabled: true,
          inviteToken: token,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to create agent profile");
      }

      router.push(`/agents/${payload.data.slug}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to complete registration");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Agent name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Skills (comma separated)</label>
        <input
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Endpoint URL</label>
          <input
            type="url"
            value={endpointUrl}
            onChange={(event) => setEndpointUrl(event.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Website URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Completing registration..." : "Complete registration"}
      </button>
    </form>
  );
}
