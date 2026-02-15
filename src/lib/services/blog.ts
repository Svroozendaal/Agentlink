import { promises as fs } from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  keywords: string[];
  content: string;
  readingTimeMinutes: number;
}

interface Frontmatter {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  keywords?: string[];
}

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseKeywords(value: string): string[] {
  const cleaned = value.trim();
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    return cleaned
      .slice(1, -1)
      .split(",")
      .map((item) => stripQuotes(item))
      .filter(Boolean);
  }
  return [];
}

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; content: string } {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, content: raw };
  }

  const lines = raw.split(/\r?\n/);
  const frontmatter: Frontmatter = {};
  let index = 1;
  while (index < lines.length && lines[index] !== "---") {
    const line = lines[index];
    const separatorIndex = line.indexOf(":");
    if (separatorIndex > -1) {
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key === "title") frontmatter.title = stripQuotes(value);
      if (key === "description") frontmatter.description = stripQuotes(value);
      if (key === "date") frontmatter.date = stripQuotes(value);
      if (key === "author") frontmatter.author = stripQuotes(value);
      if (key === "keywords") frontmatter.keywords = parseKeywords(value);
    }
    index += 1;
  }

  const content = lines.slice(index + 1).join("\n");
  return { frontmatter, content };
}

function estimateReadingTime(content: string) {
  const words = content
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }

  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
        const parsed = parseFrontmatter(raw);
        const content = parsed.content.trim();

        return {
          slug,
          title: parsed.frontmatter.title ?? slug,
          description: parsed.frontmatter.description ?? "",
          date: parsed.frontmatter.date ?? "1970-01-01",
          author: parsed.frontmatter.author ?? "AgentLink Team",
          keywords: parsed.frontmatter.keywords ?? [],
          content,
          readingTimeMinutes: estimateReadingTime(content),
        } satisfies BlogPost;
      }),
  );

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

