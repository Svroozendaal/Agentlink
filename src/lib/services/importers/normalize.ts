export interface RawAgentData {
  name?: string;
  description?: string;
  skills?: string[];
  tags?: string[];
  sourceUrl: string;
  endpointUrl?: string;
  websiteUrl?: string;
  category?: string;
  [key: string]: unknown;
}

export interface NormalizedImportData {
  name: string;
  description: string | null;
  skills: string[];
  category: string | null;
  endpointUrl: string | null;
  websiteUrl: string | null;
}

function stripMarkup(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`~>\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSkills(rawSkills: string[] | undefined, fallbackTags: string[] | undefined) {
  const combined = [...(rawSkills ?? []), ...(fallbackTags ?? [])]
    .map((skill) => skill.trim().toLowerCase())
    .filter((skill) => skill.length > 0);

  return Array.from(new Set(combined)).slice(0, 20);
}

function validUrlOrNull(input?: string) {
  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return input;
    }
    return null;
  } catch {
    return null;
  }
}

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: "Data & Analytics", keywords: ["weather", "forecast", "data", "analytics", "insight"] },
  { category: "Development Tools", keywords: ["code", "review", "debug", "test", "ci", "dev"] },
  { category: "Communication", keywords: ["translate", "language", "chat", "email", "support"] },
  { category: "Content Creation", keywords: ["write", "content", "seo", "copy", "blog"] },
  { category: "Automation", keywords: ["workflow", "agent", "automation", "orchestration"] },
];

function inferCategory(description: string | null, skills: string[], explicitCategory?: string) {
  if (explicitCategory && explicitCategory.trim().length > 0) {
    return explicitCategory.trim();
  }

  const haystack = `${description ?? ""} ${skills.join(" ")}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.category;
    }
  }

  return "General";
}

export function normalizeImportedAgent(raw: RawAgentData): NormalizedImportData {
  const cleanedName = (raw.name ?? "Unnamed Agent").trim().slice(0, 120);
  const cleanedDescription = raw.description ? stripMarkup(raw.description).slice(0, 500) : null;
  const skills = normalizeSkills(raw.skills, raw.tags);

  return {
    name: cleanedName.length > 0 ? cleanedName : "Unnamed Agent",
    description: cleanedDescription,
    skills,
    category: inferCategory(cleanedDescription, skills, raw.category),
    endpointUrl: validUrlOrNull(raw.endpointUrl),
    websiteUrl: validUrlOrNull(raw.websiteUrl),
  };
}

