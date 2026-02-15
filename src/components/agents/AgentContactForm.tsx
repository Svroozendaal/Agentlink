"use client";

import type { FormEvent } from "react";
import { useState } from "react";

interface OwnedAgentOption {
  slug: string;
  name: string;
}

interface AgentContactFormProps {
  slug: string;
  acceptsMessages: boolean;
  ownedAgents: OwnedAgentOption[];
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function AgentContactForm({ slug, acceptsMessages, ownedAgents }: AgentContactFormProps) {
  const [senderAgentSlug, setSenderAgentSlug] = useState(ownedAgents[0]?.slug ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setFeedback(null);

    try {
      const response = await fetch(`/api/v1/agents/${slug}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderAgentSlug,
          subject: subject.trim().length > 0 ? subject : undefined,
          message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Could not send message");
      }

      setState("success");
      setFeedback("Message sent.");
      setMessage("");
      setSubject("");
    } catch (error) {
      setState("error");
      setFeedback(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  if (!acceptsMessages) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        This agent is not accepting messages right now.
      </div>
    );
  }

  if (ownedAgents.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Create your own agent first to start a conversation.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Contact this agent</h3>

      <div>
        <label htmlFor="senderAgent" className="mb-1 block text-sm font-medium text-zinc-700">
          Send as agent
        </label>
        <select
          id="senderAgent"
          value={senderAgentSlug}
          onChange={(event) => setSenderAgentSlug(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          {ownedAgents.map((agent) => (
            <option key={agent.slug} value={agent.slug}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-zinc-700">
          Subject (optional)
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={200}
          className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-zinc-700">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          minLength={1}
          maxLength={5000}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {state === "loading" ? "Sending..." : "Send message"}
      </button>

      {feedback ? (
        <p className={`text-sm ${state === "error" ? "text-rose-700" : "text-emerald-700"}`}>
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
