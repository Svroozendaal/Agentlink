const MAX_SLUG_LENGTH = 80;

export function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const compact = normalized.replace(/-+/g, "-");
  const trimmed = compact.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");

  if (trimmed.length === 0) {
    return "agent";
  }

  return trimmed;
}

export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let currentSlug = baseSlug;
  let suffix = 2;

  while (await exists(currentSlug)) {
    currentSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return currentSlug;
}
