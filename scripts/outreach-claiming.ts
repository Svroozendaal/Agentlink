import path from "node:path";

import { ImportStatus, type Prisma } from "@prisma/client";

import { db } from "../src/lib/db";
import { OUTREACH_TEMPLATES, type OutreachTemplateKey } from "../src/lib/constants/outreach-templates";
import { ensureRecruiterIdentity } from "../src/lib/recruitment/identity";
import { createOutreachRecord, executeQueuedOutreach } from "../src/lib/services/outreach";
import {
  nowId,
  parseCliArgs,
  readBoolean,
  readInt,
  readString,
  toCsv,
  writeJson,
  writeText,
} from "./phase1-utils";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i;

interface ProcessRow {
  outreachId?: string;
  name: string;
  sourceUrl: string;
  platform: string;
  template: OutreachTemplateKey;
  status: "PREVIEW" | "QUEUED" | "SENT" | "SKIPPED" | "ERROR";
  reason: string;
  inviteUrl?: string;
}

function normalizePlatform(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  return raw.trim().toLowerCase();
}

function selectTemplate(
  sourcePlatform: string,
  explicitTemplate?: string,
): OutreachTemplateKey {
  if (explicitTemplate && explicitTemplate in OUTREACH_TEMPLATES) {
    return explicitTemplate as OutreachTemplateKey;
  }

  if (sourcePlatform === "github") {
    return "github_repo_owner";
  }
  if (sourcePlatform === "huggingface") {
    return "huggingface_space_owner";
  }
  return "generic_developer";
}

function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => variables[key] ?? `{${key}}`);
}

function parseSourceData(value: Prisma.JsonValue | null | undefined): unknown {
  return value ?? null;
}

function findEmail(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const matched = value.match(EMAIL_REGEX)?.[0];
    return matched ? matched.toLowerCase() : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findEmail(item);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    for (const [key, nested] of entries) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes("email") ||
        normalizedKey.includes("contact") ||
        normalizedKey.includes("owner")
      ) {
        const fromPreferred = findEmail(nested);
        if (fromPreferred) {
          return fromPreferred;
        }
      }
    }

    for (const [, nested] of entries) {
      const fromNested = findEmail(nested);
      if (fromNested) {
        return fromNested;
      }
    }
  }

  return undefined;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const batchSize = readInt(args, "batchSize", 50, 1, 500);
  const minDescriptionLength = readInt(args, "minDescriptionLength", 40, 0, 2_000);
  const platform = normalizePlatform(readString(args, "platform"));
  const campaign = readString(args, "campaign", "phase1-claiming") ?? "phase1-claiming";
  const explicitTemplate = readString(args, "template");
  const dryRun = readBoolean(args, "dryRun", true);
  const autoSend = readBoolean(args, "autoSend", true);
  const reportDir =
    readString(args, "reportDir") ??
    path.join(process.cwd(), "agentlink-output", "development", "reports", "outreach");

  const candidates = await db.importedAgent.findMany({
    where: {
      status: ImportStatus.UNCLAIMED,
      ...(platform ? { sourcePlatform: platform } : {}),
    },
    orderBy: { importedAt: "desc" },
    take: Math.max(batchSize * 4, 100),
    select: {
      id: true,
      name: true,
      description: true,
      sourceUrl: true,
      sourcePlatform: true,
      sourceData: true,
    },
  });

  const alreadyContacted = await db.outreachRecord.findMany({
    where: {
      targetUrl: {
        in: candidates.map((candidate) => candidate.sourceUrl),
      },
    },
    select: { targetUrl: true },
  });

  const contactedUrls = new Set(alreadyContacted.map((entry) => entry.targetUrl));
  const skippedExisting = candidates.filter((candidate) => contactedUrls.has(candidate.sourceUrl)).length;
  const skippedQuality = candidates.filter((candidate) => {
    if (contactedUrls.has(candidate.sourceUrl)) {
      return false;
    }
    return (candidate.description ?? "").trim().length < minDescriptionLength;
  }).length;
  const eligibleCount = candidates.length - skippedExisting - skippedQuality;

  const prepared = candidates
    .filter((candidate) => !contactedUrls.has(candidate.sourceUrl))
    .filter((candidate) => (candidate.description ?? "").trim().length >= minDescriptionLength)
    .slice(0, batchSize);

  const rows: ProcessRow[] = [];

  if (dryRun) {
    for (const candidate of prepared) {
      const templateKey = selectTemplate(candidate.sourcePlatform, explicitTemplate);
      const template = OUTREACH_TEMPLATES[templateKey];
      const placeholderInvite = "https://www.agent-l.ink/join/{generated-token}";

      rows.push({
        name: candidate.name,
        sourceUrl: candidate.sourceUrl,
        platform: candidate.sourcePlatform,
        template: templateKey,
        status: "PREVIEW",
        reason: renderTemplate(template.subject, {
          agentName: candidate.name,
          developerName: candidate.name,
          senderName: "AgentLink Team",
          inviteUrl: placeholderInvite,
        }),
        inviteUrl: placeholderInvite,
      });
    }
  } else {
    const recruiter = await ensureRecruiterIdentity();

    for (const candidate of prepared) {
      const templateKey = selectTemplate(candidate.sourcePlatform, explicitTemplate);
      const contactEmail = findEmail(parseSourceData(candidate.sourceData));

      try {
        const created = await createOutreachRecord({
          targetUrl: candidate.sourceUrl,
          targetName: candidate.name,
          platform: candidate.sourcePlatform,
          templateKey,
          adminUserId: recruiter.userId,
          campaign,
          email: contactEmail,
          agentName: candidate.name,
        });

        rows.push({
          outreachId: created.outreachId,
          name: candidate.name,
          sourceUrl: candidate.sourceUrl,
          platform: candidate.sourcePlatform,
          template: templateKey,
          status: "QUEUED",
          reason: "Outreach created",
          inviteUrl: created.message.inviteUrl,
        });
      } catch (error) {
        rows.push({
          name: candidate.name,
          sourceUrl: candidate.sourceUrl,
          platform: candidate.sourcePlatform,
          template: templateKey,
          status: "ERROR",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (autoSend) {
      const execution = await executeQueuedOutreach({
        campaign,
        platform,
        limit: rows.filter((row) => row.status === "QUEUED").length,
        dryRun: false,
      });

      const byOutreachId = new Map(execution.results.map((item) => [item.outreachId, item]));
      for (const row of rows) {
        if (!row.outreachId) {
          continue;
        }

        const executionRow = byOutreachId.get(row.outreachId);
        if (!executionRow) {
          continue;
        }

        if (executionRow.status === "SENT") {
          row.status = "SENT";
          row.reason = executionRow.method ? `Sent via ${executionRow.method}` : "Sent";
        } else if (executionRow.status === "SKIPPED" || executionRow.status === "OPTED_OUT") {
          row.status = "SKIPPED";
          row.reason = executionRow.reason ?? "Skipped";
        } else {
          row.status = "ERROR";
          row.reason = executionRow.reason ?? "Failed to send";
        }
      }
    }
  }

  const skippedCount = skippedExisting + skippedQuality + Math.max(0, eligibleCount - prepared.length);
  const summary = {
    campaign,
    platform: platform ?? "all",
    dryRun,
    autoSend,
    selected: candidates.length,
    prepared: prepared.length,
    queued: rows.filter((row) => row.status === "QUEUED").length,
    sent: rows.filter((row) => row.status === "SENT").length,
    preview: rows.filter((row) => row.status === "PREVIEW").length,
    errors: rows.filter((row) => row.status === "ERROR").length,
    skipped: skippedCount,
    generatedAt: new Date().toISOString(),
  };

  const timestamp = nowId();
  await writeJson(path.join(reportDir, `claiming-summary-${timestamp}.json`), {
    ...summary,
    rows,
  });
  await writeJson(path.join(reportDir, "daily_outreach_stats.json"), summary);
  await writeText(
    path.join(reportDir, `claiming-rows-${timestamp}.csv`),
    toCsv(
      rows.map((row) => ({
        name: row.name,
        platform: row.platform,
        sourceUrl: row.sourceUrl,
        template: row.template,
        status: row.status,
        reason: row.reason,
        outreachId: row.outreachId ?? "",
        inviteUrl: row.inviteUrl ?? "",
      })),
      ["name", "platform", "sourceUrl", "template", "status", "reason", "outreachId", "inviteUrl"],
    ),
  );

  console.info("[phase1][outreach] done", summary);
}

main().catch((error) => {
  console.error("[phase1][outreach] failed", error);
  process.exitCode = 1;
});
