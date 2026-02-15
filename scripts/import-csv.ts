import fs from "node:fs/promises";
import path from "node:path";

import { parseImportCsv } from "../src/lib/services/importers/csv";
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
  const csvPath = args._[0] ?? readString(args, "file");

  if (!csvPath) {
    throw new Error("Missing CSV path. Usage: pnpm import:csv -- data/imports/your-file.csv");
  }

  const resolvedCsvPath = path.resolve(process.cwd(), csvPath);
  const reportDir =
    readString(args, "reportDir") ??
    path.join(process.cwd(), "agentlink-output", "development", "reports", "imports");
  const batchSize = readInt(args, "batch", 100, 1, 1000);
  const delayMs = readInt(args, "delayMs", 500, 0, 60_000);

  const content = await fs.readFile(resolvedCsvPath, "utf8");
  const discovered = parseImportCsv(content);
  const batches = chunk(discovered, batchSize);

  const aggregate: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: 0,
    skippedDetails: [],
    errorDetails: [],
  };

  console.info("[phase1][csv] processing file", {
    csvPath: resolvedCsvPath,
    rows: discovered.length,
    batchSize,
  });

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const result = await importFromSource("csv", batch);

    aggregate.imported += result.imported;
    aggregate.skipped += result.skipped;
    aggregate.errors += result.errors;
    aggregate.skippedDetails?.push(...(result.skippedDetails ?? []));
    aggregate.errorDetails?.push(...(result.errorDetails ?? []));

    console.info("[phase1][csv] batch complete", {
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
  const fileBase = path.basename(resolvedCsvPath, path.extname(resolvedCsvPath));
  const summary = {
    source: "csv",
    file: resolvedCsvPath,
    discovered: discovered.length,
    imported: aggregate.imported,
    skipped: aggregate.skipped,
    errors: aggregate.errors,
    generatedAt: new Date().toISOString(),
  };

  await writeJson(path.join(reportDir, `${fileBase}-summary-${timestamp}.json`), {
    ...summary,
    skippedDetails: aggregate.skippedDetails,
    errorDetails: aggregate.errorDetails,
  });

  await writeText(
    path.join(reportDir, `${fileBase}-discovered-${timestamp}.csv`),
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
      path.join(reportDir, `${fileBase}-errors-${timestamp}.log`),
      aggregate.errorDetails!.join("\n"),
    );
  }

  console.info("[phase1][csv] done", summary);
}

main().catch((error) => {
  console.error("[phase1][csv] failed", error);
  process.exitCode = 1;
});

