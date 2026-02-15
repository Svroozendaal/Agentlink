import path from "node:path";

import { fetchGithubTopicRepos } from "../src/lib/services/importers/github";
import { importFromSource, type ImportResult } from "../src/lib/services/import";
import {
  chunk,
  nowId,
  parseCliArgs,
  readInt,
  readString,
  sleep,
  toCsv,
  writeJson,
  writeText,
} from "./phase1-utils";

function parseTopics(raw?: string): string[] | undefined {
  if (!raw) {
    return undefined;
  }

  const values = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const limit = readInt(args, "limit", 500, 1, 5000);
  const minStars = readInt(args, "minStars", 50, 0, 1_000_000);
  const batchSize = readInt(args, "batch", 50, 1, 1000);
  const delayMs = readInt(args, "delayMs", 1500, 0, 60_000);
  const topics = parseTopics(readString(args, "topics"));
  const reportDir =
    readString(args, "reportDir") ??
    path.join(process.cwd(), "agentlink-output", "development", "reports", "imports");

  console.info("[phase1][github] discovering repositories", { limit, minStars, topics });
  const discovered = await fetchGithubTopicRepos({ limit, minStars, topics });
  const batches = chunk(discovered, batchSize);

  const aggregate: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
    skippedDetails: [],
    errorDetails: [],
  };

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const result = await importFromSource("github", batch);

    aggregate.imported += result.imported;
    aggregate.skipped += result.skipped;
    aggregate.errors += result.errors;
    aggregate.skippedDetails?.push(...(result.skippedDetails ?? []));
    aggregate.errorDetails?.push(...(result.errorDetails ?? []));

    console.info("[phase1][github] batch complete", {
      batch: index + 1,
      totalBatches: batches.length,
      imported: aggregate.imported,
      skipped: aggregate.skipped,
      errors: aggregate.errors,
    });

    if (index < batches.length - 1) {
      await sleep(delayMs);
    }
  }

  const timestamp = nowId();
  const summary = {
    source: "github",
    discovered: discovered.length,
    imported: aggregate.imported,
    skipped: aggregate.skipped,
    errors: aggregate.errors,
    generatedAt: new Date().toISOString(),
  };

  await writeJson(path.join(reportDir, `github-summary-${timestamp}.json`), {
    ...summary,
    skippedDetails: aggregate.skippedDetails,
    errorDetails: aggregate.errorDetails,
  });

  await writeText(
    path.join(reportDir, `github-discovered-${timestamp}.csv`),
    toCsv(
      discovered.map((entry) => ({
        name: entry.name ?? "",
        description: entry.description ?? "",
        sourceUrl: entry.sourceUrl,
        category: entry.category ?? "",
        endpointUrl: entry.endpointUrl ?? "",
      })),
      ["name", "description", "sourceUrl", "category", "endpointUrl"],
    ),
  );

  if ((aggregate.errorDetails ?? []).length > 0) {
    await writeText(
      path.join(reportDir, `github-errors-${timestamp}.log`),
      aggregate.errorDetails!.join("\n"),
    );
  }

  console.info("[phase1][github] done", summary);
}

main().catch((error) => {
  console.error("[phase1][github] failed", error);
  process.exitCode = 1;
});

