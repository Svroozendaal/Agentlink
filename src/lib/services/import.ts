import { ImportStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { AgentServiceError } from "@/lib/services/agents";
import { parseImportCsv } from "@/lib/services/importers/csv";
import { fetchGithubTopicRepos } from "@/lib/services/importers/github";
import { fetchHuggingFaceSpaces } from "@/lib/services/importers/huggingface";
import { normalizeImportedAgent, type RawAgentData } from "@/lib/services/importers/normalize";
import { fetchProtocolRegistryAgents } from "@/lib/services/importers/protocols";

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  skippedDetails?: string[];
  errorDetails?: string[];
}

async function existsBySimilarName(name: string) {
  const normalized = name.trim().toLowerCase();

  const existing = await db.agentProfile.findFirst({
    where: {
      OR: [
        { slug: normalized.replace(/\s+/g, "-") },
        { name: { equals: name, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function importFromSource(sourcePlatform: string, data: RawAgentData[]): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const skippedDetails: string[] = [];
  const errorDetails: string[] = [];

  for (const item of data) {
    try {
      if (!item.sourceUrl) {
        skipped += 1;
        skippedDetails.push(`${item.name ?? "unknown"}: missing source URL`);
        continue;
      }

      const existingSource = await db.importedAgent.findUnique({
        where: { sourceUrl: item.sourceUrl },
        select: { id: true },
      });

      if (existingSource || (item.name && (await existsBySimilarName(item.name)))) {
        skipped += 1;
        skippedDetails.push(`${item.sourceUrl}: duplicate by source URL or similar name`);
        continue;
      }

      const normalized = normalizeImportedAgent(item);

      await db.importedAgent.create({
        data: {
          name: normalized.name,
          description: normalized.description,
          sourceUrl: item.sourceUrl,
          sourcePlatform,
          sourceData: item as Prisma.InputJsonValue,
          skills: normalized.skills,
          category: normalized.category,
          endpointUrl: normalized.endpointUrl,
          websiteUrl: normalized.websiteUrl,
          status: ImportStatus.UNCLAIMED,
        },
      });

      imported += 1;
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : "unknown import error";
      errorDetails.push(`${item.sourceUrl}: ${message}`);
    }
  }

  return {
    imported,
    skipped,
    errors,
    skippedDetails,
    errorDetails,
  };
}

export async function importFromHuggingFace(options?: { limit?: number; minLikes?: number }) {
  const data = await fetchHuggingFaceSpaces(options);
  return importFromSource("huggingface", data);
}

export async function importFromGithub(options?: { topics?: string[]; minStars?: number; limit?: number }) {
  const data = await fetchGithubTopicRepos(options);
  return importFromSource("github", data);
}

export async function importFromProtocolRegistries() {
  const data = await fetchProtocolRegistryAgents();
  return importFromSource("protocol-registry", data);
}

export async function importFromCsvContent(content: string) {
  const rows = parseImportCsv(content);
  return importFromSource("csv", rows);
}

export async function listUnclaimedImports(query: {
  search?: string;
  source?: string;
  page: number;
  limit: number;
}) {
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.ImportedAgentWhereInput = {
    status: {
      in: [ImportStatus.UNCLAIMED, ImportStatus.CLAIM_PENDING],
    },
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.source ? { sourcePlatform: query.source } : {}),
  };

  const [data, total] = await db.$transaction([
    db.importedAgent.findMany({
      where,
      orderBy: { importedAt: "desc" },
      skip,
      take: query.limit,
    }),
    db.importedAgent.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getImportedAgentById(id: string) {
  return db.importedAgent.findUnique({
    where: { id },
  });
}

export async function getImportStats() {
  const [total, unclaimed, claimPending, claimed, rejected, bySource] = await Promise.all([
    db.importedAgent.count(),
    db.importedAgent.count({ where: { status: ImportStatus.UNCLAIMED } }),
    db.importedAgent.count({ where: { status: ImportStatus.CLAIM_PENDING } }),
    db.importedAgent.count({ where: { status: ImportStatus.CLAIMED } }),
    db.importedAgent.count({ where: { status: ImportStatus.REJECTED } }),
    db.importedAgent.groupBy({
      by: ["sourcePlatform"],
      _count: { _all: true },
      orderBy: { sourcePlatform: "asc" },
    }),
  ]);

  return {
    total,
    unclaimed,
    claimPending,
    claimed,
    rejected,
    bySource: bySource.map((entry) => ({
      source: entry.sourcePlatform,
      count: entry._count._all,
    })),
  };
}

export async function rejectImportedAgent(importedAgentId: string) {
  const record = await db.importedAgent.findUnique({
    where: { id: importedAgentId },
    select: { id: true, status: true },
  });

  if (!record) {
    throw new AgentServiceError(404, "NOT_FOUND", "Imported agent not found");
  }

  if (record.status === ImportStatus.CLAIMED) {
    throw new AgentServiceError(400, "INVALID_STATE", "Claimed imports cannot be rejected");
  }

  return db.importedAgent.update({
    where: { id: importedAgentId },
    data: { status: ImportStatus.REJECTED },
  });
}
