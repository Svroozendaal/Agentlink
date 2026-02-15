import fs from "node:fs/promises";
import path from "node:path";

export type CliArgValue = string | boolean;

export interface CliArgs {
  _: string[];
  values: Record<string, CliArgValue>;
}

export function parseCliArgs(argv: string[]): CliArgs {
  const positional: string[] = [];
  const values: Record<string, CliArgValue> = {};

  for (const entry of argv) {
    if (!entry.startsWith("--")) {
      positional.push(entry);
      continue;
    }

    const raw = entry.slice(2);
    const [key, rest] = raw.split("=", 2);
    if (!key) {
      continue;
    }

    values[key] = rest === undefined ? true : rest;
  }

  return { _: positional, values };
}

export function readString(
  args: CliArgs,
  key: string,
  fallback?: string,
): string | undefined {
  const value = args.values[key];
  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

export function readInt(
  args: CliArgs,
  key: string,
  fallback: number,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const value = args.values[key];
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

export function readBoolean(args: CliArgs, key: string, fallback = false): boolean {
  const value = args.values[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  return fallback;
}

export function nowId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function ensureDir(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function writeText(filePath: string, value: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, value, "utf8");
}

function escapeCsvValue(value: unknown): string {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(
  rows: Array<Record<string, unknown>>,
  headers: string[],
): string {
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
  }

  return lines.join("\n");
}

export function chunk<T>(input: T[], size: number): T[][] {
  const safeSize = Math.max(1, size);
  const chunks: T[][] = [];

  for (let index = 0; index < input.length; index += safeSize) {
    chunks.push(input.slice(index, index + safeSize));
  }

  return chunks;
}

export async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

