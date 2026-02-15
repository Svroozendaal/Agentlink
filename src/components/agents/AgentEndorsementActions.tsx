"use client";

import { useMemo, useState } from "react";

interface AgentEndorsementActionsProps {
  slug: string;
  skills: string[];
  canEndorse: boolean;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function AgentEndorsementActions({ slug, skills, canEndorse }: AgentEndorsementActionsProps) {
  const availableSkills = useMemo(
    () => Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean))),
    [skills],
  );
  const [selectedSkill, setSelectedSkill] = useState(availableSkills[0] ?? "");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (availableSkills.length === 0) {
    return null;
  }

  async function endorse() {
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/endorsements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skill: selectedSkill }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Could not endorse skill");
      }

      setState("success");
      setMessage("Endorsement opgeslagen.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Er ging iets mis.");
    }
  }

  async function removeEndorsement() {
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/agents/${slug}/endorsements/${encodeURIComponent(selectedSkill)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Could not remove endorsement");
      }

      setState("success");
      setMessage("Endorsement verwijderd.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Er ging iets mis.");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Skill endorsen</h3>
      {canEndorse ? (
        <div className="mt-3 space-y-3">
          <select
            value={selectedSkill}
            onChange={(event) => setSelectedSkill(event.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
          >
            {availableSkills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={endorse}
              disabled={state === "loading"}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Endorse
            </button>
            <button
              type="button"
              onClick={removeEndorsement}
              disabled={state === "loading"}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Verwijder mijn endorsement
            </button>
          </div>

          {message ? (
            <p className={`text-xs ${state === "error" ? "text-rose-700" : "text-emerald-700"}`}>
              {message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">Log in om skills te endorsen.</p>
      )}
    </div>
  );
}
