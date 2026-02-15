import type { RawAgentData } from "@/lib/services/importers/normalize";

interface HuggingFaceSpace {
  id: string;
  title?: string;
  likes?: number;
  sdk?: string;
  tags?: string[];
  description?: string;
}

export async function fetchHuggingFaceSpaces(options?: {
  limit?: number;
  minLikes?: number;
}): Promise<RawAgentData[]> {
  const safeLimit = Math.max(1, Math.min(options?.limit ?? 100, 500));
  const minLikes = Math.max(0, options?.minLikes ?? 0);

  const response = await fetch(`https://huggingface.co/api/spaces?limit=${safeLimit}`, {
    headers: {
      "User-Agent": "agentlink-importer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Hugging Face spaces");
  }

  const data = (await response.json()) as HuggingFaceSpace[];

  return data
    .filter((space) => (space.likes ?? 0) >= minLikes)
    .map((space) => {
      const title = space.title ?? space.id.split("/").pop() ?? space.id;
      const tags = (space.tags ?? []).slice(0, 20);
      const url = `https://huggingface.co/spaces/${space.id}`;

      return {
        name: title,
        description: space.description ?? `Hugging Face Space: ${title}`,
        skills: tags,
        tags,
        sourceUrl: url,
        websiteUrl: url,
        category: space.sdk ? `Hugging Face ${space.sdk}` : undefined,
      } satisfies RawAgentData;
    });
}

