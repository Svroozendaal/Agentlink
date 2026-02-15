"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface StatusCount {
  status: string;
  count: number;
}

interface MethodCount {
  method: string;
  count: number;
}

interface RecentAttempt {
  id: string;
  targetName: string;
  targetUrl: string;
  contactMethod: string;
  status: string;
  responseStatus: number | null;
  attemptNumber: number;
  campaign: string;
  createdAt: string;
  errorMessage: string | null;
}

interface OptOutDomain {
  id: string;
  domain: string;
  reason: string | null;
  createdAt: string;
}

interface InitialStatus {
  totalAttempts: number;
  byStatus: StatusCount[];
  byMethod: MethodCount[];
  byCampaign?: Array<{ campaign: string; count: number }>;
  bySource?: Array<{ source: string; count: number }>;
  funnel?: {
    contacted: number;
    delivered: number;
    interested: number;
    registered: number;
  };
  recentResults: RecentAttempt[];
  optOutCount: number;
  optOutDomains: OptOutDomain[];
}

interface QualifiedItem {
  id: string;
  name: string;
  sourcePlatform: string;
  sourceUrl: string;
  score: number;
  reasons: string[];
  strategies: Array<{
    method: string;
    url: string;
    priority: number;
    description: string;
  }>;
}

interface PreviewMessage {
  importedAgentId: string;
  agentName: string;
  source: string;
  method: string;
  contactUrl: string;
  subject: string;
  body: string;
  inviteUrl: string;
  inviteToken: string;
}

interface RecruitmentClientProps {
  initialStatus: InitialStatus;
  initialQualified: QualifiedItem[];
}

function statusColor(status: string) {
  if (["DELIVERED", "INTERESTED", "REGISTERED"].includes(status)) {
    return "text-emerald-700";
  }

  if (["SENT", "PENDING"].includes(status)) {
    return "text-amber-700";
  }

  if (["FAILED", "DECLINED"].includes(status)) {
    return "text-rose-700";
  }

  return "text-zinc-600";
}

function toCsv(messages: PreviewMessage[]) {
  const header = ["agentName", "source", "method", "contactUrl", "inviteUrl", "subject"];
  const rows = messages.map((message) => [
    message.agentName,
    message.source,
    message.method,
    message.contactUrl,
    message.inviteUrl,
    message.subject.replace(/\n/g, " "),
  ]);

  const lines = [header, ...rows].map((row) =>
    row
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return lines.join("\n");
}

export function RecruitmentClient({ initialStatus, initialQualified }: RecruitmentClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [qualified, setQualified] = useState(initialQualified);
  const [preview, setPreview] = useState<PreviewMessage[]>([]);

  const [campaign, setCampaign] = useState("auto");
  const [limit, setLimit] = useState(20);
  const [dryRun, setDryRun] = useState(true);

  const [selectedQualified, setSelectedQualified] = useState<string[]>(
    initialQualified.map((item) => item.id),
  );
  const [selectedPreview, setSelectedPreview] = useState<string[]>([]);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [optOutDomain, setOptOutDomain] = useState("");
  const [optOutReason, setOptOutReason] = useState("");

  async function refreshStatus() {
    const response = await fetch("/api/v1/admin/recruitment/status");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Failed to load recruitment status");
    }

    setStatus(payload.data as InitialStatus);
  }

  async function runAction(name: string, run: () => Promise<void>) {
    setLoadingAction(name);
    setError(null);
    setMessage(null);

    try {
      await run();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Request failed");
    } finally {
      setLoadingAction(null);
    }
  }

  function toggleSelectedQualified(id: string) {
    setSelectedQualified((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function toggleSelectedPreview(id: string) {
    setSelectedPreview((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  const filteredLogs = useMemo(() => {
    return status.recentResults.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) {
        return false;
      }

      if (methodFilter !== "all" && entry.contactMethod !== methodFilter) {
        return false;
      }

      if (campaignFilter !== "all" && entry.campaign !== campaignFilter) {
        return false;
      }

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
        if (new Date(entry.createdAt).getTime() < from) {
          return false;
        }
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999Z`).getTime();
        if (new Date(entry.createdAt).getTime() > to) {
          return false;
        }
      }

      return true;
    });
  }, [campaignFilter, dateFrom, dateTo, methodFilter, status.recentResults, statusFilter]);

  const availableCampaigns = useMemo(() => {
    return Array.from(new Set(status.recentResults.map((entry) => entry.campaign))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [status.recentResults]);

  const selectedPreviewMessages = preview.filter((messageItem) =>
    selectedPreview.includes(messageItem.importedAgentId),
  );

  async function onRunDiscover() {
    await runAction("discover", async () => {
      const response = await fetch("/api/v1/admin/recruitment/discover", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Discovery failed");
      }

      setMessage(`Discovery completed: ${payload.data.newAgents} new imported agents.`);
      await refreshStatus();
    });
  }

  async function onRunQualify() {
    await runAction("qualify", async () => {
      const response = await fetch("/api/v1/admin/recruitment/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, minScore: 1 }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Qualification failed");
      }

      const nextQualified = (payload.data.qualified as QualifiedItem[]) ?? [];
      setQualified(nextQualified);
      setSelectedQualified(nextQualified.map((item) => item.id));
      setMessage(`Qualified ${nextQualified.length} candidates.`);
    });
  }

  async function onRunPreview() {
    await runAction("preview", async () => {
      if (selectedQualified.length === 0) {
        throw new Error("Select at least one qualified candidate for preview");
      }

      const response = await fetch("/api/v1/admin/recruitment/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          agentIds: selectedQualified,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Preview generation failed");
      }

      const nextPreview = (payload.data.messages as PreviewMessage[]) ?? [];
      setPreview(nextPreview);
      setSelectedPreview(nextPreview.map((item) => item.importedAgentId));
      setMessage(`Prepared ${nextPreview.length} preview messages.`);
    });
  }

  async function onRunPipeline() {
    await runAction("pipeline", async () => {
      const response = await fetch("/api/v1/admin/recruitment/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          limit,
          dryRun,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Pipeline run failed");
      }

      const data = payload.data as {
        discovered: number;
        qualified: number;
        prepared: number;
        sent: number;
        delivered: number;
        failed: number;
        preview: PreviewMessage[];
      };

      if (dryRun) {
        setPreview(data.preview ?? []);
        setSelectedPreview((data.preview ?? []).map((item) => item.importedAgentId));
        setMessage(
          `Dry run completed: discovered ${data.discovered}, qualified ${data.qualified}, prepared ${data.prepared}.`,
        );
      } else {
        setMessage(
          `Pipeline executed: sent ${data.sent}, delivered ${data.delivered}, failed ${data.failed}.`,
        );
      }

      await refreshStatus();
      router.refresh();
    });
  }

  async function onExecuteSelected() {
    await runAction("execute", async () => {
      if (selectedPreview.length === 0) {
        throw new Error("Select at least one preview message to execute");
      }

      const response = await fetch("/api/v1/admin/recruitment/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          agentIds: selectedPreview,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Execution failed");
      }

      const summary = payload.data.summary as {
        sent: number;
        delivered: number;
        failed: number;
        skipped: number;
      };
      setMessage(
        `Execution completed: sent ${summary.sent}, delivered ${summary.delivered}, failed ${summary.failed}, skipped ${summary.skipped}.`,
      );

      await refreshStatus();
      router.refresh();
    });
  }

  function onDownloadCsv() {
    if (selectedPreviewMessages.length === 0) {
      setError("Select at least one preview row before exporting CSV.");
      return;
    }

    const csv = toCsv(selectedPreviewMessages);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recruitment-preview-${campaign}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function onAddOptOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction("optout-add", async () => {
      const response = await fetch("/api/v1/admin/recruitment/opt-outs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: optOutDomain,
          reason: optOutReason || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to add opt-out domain");
      }

      setOptOutDomain("");
      setOptOutReason("");
      setMessage(`Domain ${payload.data.domain} added to opt-out list.`);
      await refreshStatus();
    });
  }

  async function onRemoveOptOut(domain: string) {
    await runAction(`optout-remove-${domain}`, async () => {
      const response = await fetch("/api/v1/admin/recruitment/opt-outs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to remove opt-out domain");
      }

      setMessage(`Removed ${domain} from opt-out list.`);
      await refreshStatus();
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total attempts</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{status.totalAttempts}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Delivered</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {status.byStatus.find((entry) => entry.status === "DELIVERED")?.count ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Interested</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {status.byStatus.find((entry) => entry.status === "INTERESTED")?.count ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Opt-outs</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{status.optOutCount}</p>
        </article>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Pipeline control</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-medium text-zinc-700">
            Campaign
            <input
              value={campaign}
              onChange={(event) => setCampaign(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Limit
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value) || 20)}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium text-zinc-700">
            Dry run
            <select
              value={dryRun ? "true" : "false"}
              onChange={(event) => setDryRun(event.target.value === "true")}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void onRunPipeline()}
              disabled={loadingAction !== null}
              className="h-10 w-full rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAction === "pipeline" ? "Running..." : "Run full pipeline"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onRunDiscover()}
            disabled={loadingAction !== null}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            {loadingAction === "discover" ? "Running..." : "Discover only"}
          </button>
          <button
            type="button"
            onClick={() => void onRunQualify()}
            disabled={loadingAction !== null}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            {loadingAction === "qualify" ? "Running..." : "Qualify"}
          </button>
          <button
            type="button"
            onClick={() => void onRunPreview()}
            disabled={loadingAction !== null}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            {loadingAction === "preview" ? "Running..." : "Preview messages"}
          </button>
          <button
            type="button"
            onClick={() => void onExecuteSelected()}
            disabled={loadingAction !== null || selectedPreview.length === 0}
            className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {loadingAction === "execute" ? "Sending..." : "Approve selected and send"}
          </button>
          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={selectedPreview.length === 0}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            Download CSV
          </button>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Quality queue</h2>
        {qualified.length > 0 ? (
          <div className="space-y-2">
            {qualified.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedQualified.includes(item.id)}
                  onChange={() => toggleSelectedQualified(item.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="text-zinc-600">
                    {item.sourcePlatform} | score {item.score} | {item.sourceUrl}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Primary strategy: {item.strategies[0]?.method ?? "N/A"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No qualified candidates yet.</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Pipeline preview</h2>
        {preview.length > 0 ? (
          <div className="space-y-2">
            {preview.map((item) => (
              <label key={item.importedAgentId} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedPreview.includes(item.importedAgentId)}
                  onChange={() => toggleSelectedPreview(item.importedAgentId)}
                  className="mt-1"
                />
                <div className="w-full">
                  <p className="font-medium text-zinc-900">
                    {item.agentName} ({item.method})
                  </p>
                  <p className="text-xs text-zinc-600">{item.contactUrl}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-700">{item.subject}</p>
                  <a href={item.inviteUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-sky-700 hover:text-sky-800">
                    {item.inviteUrl}
                  </a>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Generate preview messages to review outbound invitations.</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">By method</h2>
          <div className="mt-2 space-y-1 text-sm text-zinc-700">
            {status.byMethod.length > 0 ? (
              status.byMethod.map((entry) => (
                <p key={entry.method}>
                  {entry.method}: {entry.count}
                </p>
              ))
            ) : (
              <p>No method data yet.</p>
            )}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">By campaign</h2>
          <div className="mt-2 space-y-1 text-sm text-zinc-700">
            {(status.byCampaign ?? []).length > 0 ? (
              (status.byCampaign ?? []).map((entry) => (
                <p key={entry.campaign}>
                  {entry.campaign}: {entry.count}
                </p>
              ))
            ) : (
              <p>No campaign data yet.</p>
            )}
          </div>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Funnel</h2>
          <div className="mt-2 space-y-1 text-sm text-zinc-700">
            <p>Contacted: {status.funnel?.contacted ?? 0}</p>
            <p>Delivered: {status.funnel?.delivered ?? 0}</p>
            <p>Interested: {status.funnel?.interested ?? 0}</p>
            <p>Registered: {status.funnel?.registered ?? 0}</p>
          </div>
          <div className="mt-3 space-y-1 text-xs text-zinc-600">
            {(status.bySource ?? []).length > 0 ? (
              (status.bySource ?? []).map((entry) => (
                <p key={entry.source}>
                  Source {entry.source}: {entry.count}
                </p>
              ))
            ) : (
              <p>No source data yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Recruitment log</h2>
        <div className="grid gap-2 sm:grid-cols-5">
          <label className="text-xs font-medium text-zinc-700">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 px-2 text-xs"
            >
              <option value="all">all</option>
              {status.byStatus.map((entry) => (
                <option key={entry.status} value={entry.status}>
                  {entry.status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Method
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 px-2 text-xs"
            >
              <option value="all">all</option>
              {status.byMethod.map((entry) => (
                <option key={entry.method} value={entry.method}>
                  {entry.method}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Campaign
            <select
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 px-2 text-xs"
            >
              <option value="all">all</option>
              {availableCampaigns.map((campaignItem) => (
                <option key={campaignItem} value={campaignItem}>
                  {campaignItem}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 px-2 text-xs"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 px-2 text-xs"
            />
          </label>
        </div>

        <div className="space-y-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="font-medium text-zinc-900">
                  {entry.targetName} | {entry.contactMethod} | <span className={statusColor(entry.status)}>{entry.status}</span>
                </p>
                <p className="text-xs text-zinc-600">
                  Campaign {entry.campaign} | Response {entry.responseStatus ?? "-"} | Attempt #{entry.attemptNumber} | {new Date(entry.createdAt).toLocaleString("en-US")}
                </p>
                {entry.errorMessage ? <p className="text-xs text-rose-700">{entry.errorMessage}</p> : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No records match the selected filters.</p>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Opt-out management</h2>
        <form onSubmit={(event) => void onAddOptOut(event)} className="grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
          <input
            value={optOutDomain}
            onChange={(event) => setOptOutDomain(event.target.value)}
            placeholder="example.com"
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm"
          />
          <input
            value={optOutReason}
            onChange={(event) => setOptOutReason(event.target.value)}
            placeholder="Reason (optional)"
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={loadingAction !== null}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            Add domain
          </button>
        </form>

        <div className="space-y-2">
          {status.optOutDomains.length > 0 ? (
            status.optOutDomains.map((entry) => (
              <article key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <div>
                  <p className="font-medium text-zinc-900">{entry.domain}</p>
                  <p className="text-xs text-zinc-600">
                    {entry.reason ?? "No reason provided"} | {new Date(entry.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemoveOptOut(entry.domain)}
                  disabled={loadingAction !== null}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                >
                  Remove
                </button>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No domains opted out yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
