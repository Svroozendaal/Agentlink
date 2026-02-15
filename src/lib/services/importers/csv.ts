import type { RawAgentData } from "@/lib/services/importers/normalize";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseImportCsv(content: string): RawAgentData[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const skills = row.skills
      ? row.skills
          .split("|")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    return {
      name: row.name,
      description: row.description,
      skills,
      sourceUrl: row.url,
      websiteUrl: row.url,
      endpointUrl: row.endpoint || row.url,
      category: row.category,
    } satisfies RawAgentData;
  });
}

