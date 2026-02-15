export function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHost(hostname: string) {
  const cleaned = hostname.trim().toLowerCase();
  if (cleaned.startsWith("www.")) {
    return cleaned.slice(4);
  }
  return cleaned;
}

export function domainFromUrl(input: string) {
  try {
    const url = new URL(input);
    return normalizeHost(url.hostname);
  } catch {
    return normalizeHost(input.replace(/^https?:\/\//i, "").split("/")[0] ?? input);
  }
}

export function domainOptOutCandidates(input: string) {
  const domain = domainFromUrl(input);
  const candidates = new Set<string>([domain]);

  if (domain.startsWith("www.")) {
    candidates.add(domain.slice(4));
  }

  const parts = domain.split(".").filter(Boolean);
  if (parts.length >= 2) {
    candidates.add(parts.slice(-2).join("."));
  }

  return Array.from(candidates);
}

export function domainPolitenessKey(input: string) {
  try {
    const parsed = new URL(input);
    const host = normalizeHost(parsed.hostname);
    if (host === "github.com") {
      const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
      if (owner && repo) {
        return `${host}/${owner}/${repo}`.toLowerCase();
      }
    }
    return host;
  } catch {
    return domainFromUrl(input);
  }
}

export function parseGithubRepo(input: string) {
  try {
    const parsed = new URL(input);
    if (parsed.hostname !== "github.com") {
      return null;
    }

    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return { owner, repo: repo.replace(/\.git$/i, "") };
  } catch {
    return null;
  }
}

export function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function stringifyUnknown(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}


