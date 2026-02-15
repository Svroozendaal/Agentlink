"use client";

import { useEffect, useMemo, useState } from "react";

interface AgentOption {
  slug: string;
  name: string;
}

interface ConversationItem {
  id: string;
  subject: string | null;
  status: string;
  lastMessageAt: string | null;
  otherAgent: {
    slug: string;
    name: string;
  };
  unreadCount: number;
}

interface MessageItem {
  id: string;
  content: string;
  contentType: string;
  createdAt: string;
  senderAgent: {
    slug: string;
    name: string;
  };
}

interface MessagesClientProps {
  agents: AgentOption[];
}

export function MessagesClient({ agents }: MessagesClientProps) {
  const [selectedAgentSlug, setSelectedAgentSlug] = useState(agents[0]?.slug ?? "");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  async function loadConversations(agentSlug: string) {
    if (!agentSlug) {
      return;
    }

    setLoadingConversations(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/agents/${agentSlug}/conversations?status=all&limit=30&page=1`,
      );

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const payload = (await response.json()) as { data: ConversationItem[] };
      setConversations(payload.data);
      const nextConversationId = payload.data[0]?.id ?? null;
      setSelectedConversationId(nextConversationId);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      setConversations([]);
      setSelectedConversationId(null);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string, agentSlug: string) {
    setLoadingMessages(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/conversations/${conversationId}/messages?agentSlug=${encodeURIComponent(agentSlug)}&limit=50`,
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const payload = (await response.json()) as { data: MessageItem[] };
      setMessages(payload.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage() {
    if (!selectedConversationId || !selectedAgentSlug || messageInput.trim().length === 0) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/v1/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderAgentSlug: selectedAgentSlug,
          content: messageInput,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        throw new Error(payload.error?.message ?? "Failed to send message");
      }

      setMessageInput("");
      await loadMessages(selectedConversationId, selectedAgentSlug);
      await loadConversations(selectedAgentSlug);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    }
  }

  async function closeConversation() {
    if (!selectedConversationId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/v1/conversations/${selectedConversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "closed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to close conversation");
      }

      await loadConversations(selectedAgentSlug);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    }
  }

  useEffect(() => {
    if (!selectedAgentSlug) {
      return;
    }

    void loadConversations(selectedAgentSlug);
  }, [selectedAgentSlug]);

  useEffect(() => {
    if (!selectedConversationId || !selectedAgentSlug) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedConversationId, selectedAgentSlug);
  }, [selectedConversationId, selectedAgentSlug]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <label htmlFor="agent-select" className="mb-2 block text-sm font-medium text-zinc-700">
          Send as agent
        </label>
        <select
          id="agent-select"
          value={selectedAgentSlug}
          onChange={(event) => setSelectedAgentSlug(event.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          {agents.map((agent) => (
            <option key={agent.slug} value={agent.slug}>
              {agent.name}
            </option>
          ))}
        </select>

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-zinc-500">Conversations</h2>
        <div className="mt-3 space-y-2">
          {loadingConversations ? (
            <p className="text-sm text-zinc-600">Loading...</p>
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  selectedConversationId === conversation.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <p className="font-semibold">{conversation.otherAgent.name}</p>
                <p className="mt-1 text-xs opacity-80">
                  {conversation.subject ?? "No subject"}
                </p>
                {conversation.unreadCount > 0 ? (
                  <p className="mt-1 text-xs">{conversation.unreadCount} unread</p>
                ) : null}
              </button>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No conversations yet.</p>
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {selectedConversation ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{selectedConversation.otherAgent.name}</h2>
                <p className="text-sm text-zinc-600">{selectedConversation.subject ?? "No subject"}</p>
              </div>
              <button
                type="button"
                onClick={() => void closeConversation()}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Close conversation
              </button>
            </div>

            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {loadingMessages ? (
                <p className="text-sm text-zinc-600">Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <article key={message.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-zinc-800">{message.senderAgent.name}</p>
                      <p className="text-xs text-zinc-500">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(message.createdAt))}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-zinc-700">{message.content}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No messages yet.</p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Type your message..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Send message
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-600">Select a conversation to view messages.</p>
        )}

        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </section>
    </div>
  );
}
