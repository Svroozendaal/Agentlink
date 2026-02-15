import type { RawAgentData } from "@/lib/services/importers/normalize";

interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  topics?: string[];
}

interface GitHubSearchResponse {
  items: GitHubRepository[];
}

export async function fetchGithubTopicRepos(options?: {
  topics?: string[];
  minStars?: number;
  limit?: number;
}): Promise<RawAgentData[]> {
  const topics = options?.topics?.length
    ? options.topics
    : ["ai-agent", "chatbot", "llm-agent", "autonomous-agent"];
  const minStars = Math.max(0, options?.minStars ?? 10);
  const perTopicLimit = Math.max(1, Math.min(options?.limit ?? 25, 100));
  const authToken = process.env.GITHUB_TOKEN;
  const allRepos = new Map<string, GitHubRepository>();

  for (const topic of topics) {
    const query = encodeURIComponent(`topic:${topic} stars:>=${minStars}`);
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=${perTopicLimit}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          "User-Agent": "agentlink-importer/1.0",
        },
      },
    );

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as GitHubSearchResponse;
    for (const repo of payload.items ?? []) {
      allRepos.set(repo.html_url, repo);
    }
  }

  return Array.from(allRepos.values()).map((repo) => ({
    name: repo.name,
    description: repo.description ?? `GitHub repository ${repo.full_name}`,
    skills: repo.topics ?? [],
    tags: repo.topics ?? [],
    sourceUrl: repo.html_url,
    websiteUrl: repo.html_url,
  }));
}

