import path from "node:path";

import { fetchHuggingFaceSpaces } from "../src/lib/services/importers/huggingface";
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

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const limit = readInt(args, "limit", 2000, 1, 5000);
  const minLikes = readInt(args, "minLikes", 2, 0, 1_000_000);
  const batchSize = readInt(args, "batch", 100, 1, 1000);
  const delayMs = readInt(args, "delayMs", 2000, 0, 60_000);
  const reportDir =
    readString(args, "reportDir") ??
    path.join(process.cwd(), "agentlink-output", "development", "reports", "imports");

  console.info("[phase1][huggingface] discovering spaces", { limit, minLikes });
  const discovered = await fetchHuggingFaceSpaces({ limit, minLikes });
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
    const result = await importFromSource("huggingface", batch);

    aggregate.imported += result.imported;
    aggregate.skipped += result.skipped;
    aggregate.errors += result.errors;
    aggregate.skippedDetails?.push(...(result.skippedDetails ?? []));
    aggregate.errorDetails?.push(...(result.errorDetails ?? []));

    console.info("[phase1][huggingface] batch complete", {
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
    source: "huggingface",
    discovered: discovered.length,
    imported: aggregate.imported,
    skipped: aggregate.skipped,
    errors: aggregate.errors,
    generatedAt: new Date().toISOString(),
  };

  await writeJson(path.join(reportDir, `huggingface-summary-${timestamp}.json`), {
    ...summary,
    skippedDetails: aggregate.skippedDetails,
    errorDetails: aggregate.errorDetails,
  });

  await writeText(
    path.join(reportDir, `huggingface-discovered-${timestamp}.csv`),
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
      path.join(reportDir, `huggingface-errors-${timestamp}.log`),
      aggregate.errorDetails!.join("\n"),
    );
  }

  console.info("[phase1][huggingface] done", summary);
}

main().catch((error) => {
  console.error("[phase1][huggingface] failed", error);
  process.exitCode = 1;
});

