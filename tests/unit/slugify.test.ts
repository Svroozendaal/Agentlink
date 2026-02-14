import { describe, expect, it } from "vitest";

import { ensureUniqueSlug, slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("should normalize symbols and accents", () => {
    expect(slugify("  Héllo, Agent!!!  ")).toBe("hello-agent");
  });

  it("should fallback to 'agent' for empty normalized values", () => {
    expect(slugify("###")).toBe("agent");
  });

  it("should trim very long slugs", () => {
    const slug = slugify("a".repeat(200));
    expect(slug.length).toBeLessThanOrEqual(80);
  });
});

describe("ensureUniqueSlug", () => {
  it("should return base slug when not used", async () => {
    const slug = await ensureUniqueSlug("agent", async () => false);
    expect(slug).toBe("agent");
  });

  it("should append incrementing suffixes when collisions exist", async () => {
    const used = new Set(["agent", "agent-2", "agent-3"]);
    const slug = await ensureUniqueSlug("agent", async (candidate) => used.has(candidate));
    expect(slug).toBe("agent-4");
  });
});
