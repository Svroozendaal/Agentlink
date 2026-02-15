import fs from "node:fs/promises";
import path from "node:path";

import { db } from "../src/lib/db";
import { ensureRecruiterIdentity } from "../src/lib/recruitment/identity";
import {
  executeRecruitmentMessages,
  previewRecruitmentMessages,
  qualifyImportedAgents,
} from "../src/lib/recruitment/pipeline";
import { importFromGithub, importFromHuggingFace, importFromSource } from "../src/lib/services/import";
import { parseImportCsv } from "../src/lib/services/importers/csv";
import {
  nowId,
  parseCliArgs,
  readBoolean,
  readInt,
  readString,
  writeJson,
} from "./phase1-utils";

function parseCsvList(raw?: string): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readCsvImportResult(csvPath: string) {
  const resolved = path.resolve(process.cwd(), csvPath);
  const content = await fs.readFile(resolved, "utf8");
  const rows = parseImportCsv(content);
  const result = await importFromSource("csv", rows);

  return {
    csvPath: resolved,
    discovered: rows.length,
    ...result,
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const campaign = readString(args, "campaign", "phase1-start") ?? "phase1-start";
  const dryRun = readBoolean(args, "dryRun", true);
  const skipHuggingFace = readBoolean(args, "skipHuggingFace", false);
  const skipGithub = readBoolean(args, "skipGithub", false);
  const skipOutreach = readBoolean(args, "skipOutreach", false);
  const hfLimit = readInt(args, "hfLimit", 300, 1, 2_000);
  const hfMinLikes = readInt(args, "hfMinLikes", 2, 0, 100_000);
  const ghLimit = readInt(args, "ghLimit", 300, 1, 2_000);
  const ghMinStars = readInt(args, "ghMinStars", 30, 0, 100_000);
  const outreachLimit = readInt(args, "outreachLimit", 50, 1, 200);
  const csvFiles = parseCsvList(readString(args, "csv"));
  const reportDir =
    readString(args, "reportDir") ??
    path.join(process.cwd(), "agentlink-output", "development", "reports", "phase1");

  const before = await Promise.all([
    db.importedAgent.count(),
    db.outreachRecord.count(),
    db.agentProfile.count(),
  ]);

  const importSummary: Record<string, unknown> = {};

  if (!skipHuggingFace) {
    importSummary.huggingface = await importFromHuggingFace({
      limit: hfLimit,
      minLikes: hfMinLikes,
    });
  }

  if (!skipGithub) {
    importSummary.github = await importFromGithub({
      limit: ghLimit,
      minStars: ghMinStars,
    });
  }

  if (csvFiles.length > 0) {
    const csvResults = [];
    for (const csvFile of csvFiles) {
      csvResults.push(await readCsvImportResult(csvFile));
    }
    importSummary.csv = csvResults;
  }

  let outreachSummary: Record<string, unknown> | null = null;

  if (!skipOutreach) {
    const qualified = await qualifyImportedAgents({
      limit: outreachLimit,
      minScore: 1,
    });

    const recruiter = await ensureRecruiterIdentity();
    const preview = await previewRecruitmentMessages({
      agentIds: qualified.qualified.map((entry) => entry.agent.id),
      campaign,
      adminUserId: recruiter.userId,
    });

    if (dryRun) {
      outreachSummary = {
        mode: "preview",
        qualified: qualified.qualified.length,
        preparedMessages: preview.messages.length,
      };
    } else {
      const execution = await executeRecruitmentMessages({
        agentIds: preview.messages.map((message) => message.importedAgentId),
        campaign,
      });

      outreachSummary = {
        mode: "execute",
        qualified: qualified.qualified.length,
        preparedMessages: preview.messages.length,
        ...execution.summary,
      };
    }
  }

  const after = await Promise.all([
    db.importedAgent.count(),
    db.outreachRecord.count(),
    db.agentProfile.count(),
  ]);

  const summary = {
    campaign,
    dryRun,
    executedAt: new Date().toISOString(),
    imports: importSummary,
    outreach: outreachSummary,
    counters: {
      before: {
        importedAgents: before[0],
        outreachRecords: before[1],
        agentProfiles: before[2],
      },
      after: {
        importedAgents: after[0],
        outreachRecords: after[1],
        agentProfiles: after[2],
      },
    },
    startCommands: [
      "pnpm install",
      "pnpm prisma:generate",
      "pnpm prisma:migrate",
      "pnpm dev",
    ],
  };

  const reportPath = path.join(reportDir, `phase1-start-${nowId()}.json`);
  await writeJson(reportPath, summary);

  console.info("[phase1] complete", {
    reportPath,
    imports: Object.keys(importSummary),
    outreach: outreachSummary?.mode ?? "skipped",
    dryRun,
  });
}

main().catch((error) => {
  console.error("[phase1] failed", error);
  process.exitCode = 1;
});
