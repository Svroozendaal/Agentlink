import type { ContactResult } from "@/lib/recruitment/types";
import { parseGithubRepo, toObject } from "@/lib/recruitment/utils";

interface GithubIssuePayload {
  title: string;
  body: string;
}

export async function contactViaGithubIssue(
  repoUrl: string,
  invitation: GithubIssuePayload,
): Promise<ContactResult> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    return {
      success: false,
      sent: false,
      error: "Invalid GitHub repository URL",
    };
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return {
      success: false,
      sent: false,
      error: "GITHUB_TOKEN is missing",
    };
  }

  try {
    const existingIssuesResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues?state=all&labels=agentlink-invitation&per_page=20`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "AgentLink-Recruiter/1.0",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (existingIssuesResponse.ok) {
      const issues = (await existingIssuesResponse.json().catch(() => [])) as unknown[];
      const duplicate = issues.some((issue) => {
        const parsedIssue = toObject(issue);
        const title = parsedIssue?.title;
        return typeof title === "string" && title.toLowerCase().includes("agentlink");
      });

      if (duplicate) {
        return {
          success: true,
          sent: false,
          status: 200,
          note: "An AgentLink invitation issue already exists for this repository",
        };
      }
    }

    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "AgentLink-Recruiter/1.0",
        },
        body: JSON.stringify({
          title: invitation.title,
          body: invitation.body,
          labels: ["agentlink-invitation"],
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    const responseBody = await response.json().catch(() => null);

    return {
      success: response.ok,
      sent: response.ok,
      status: response.status,
      response: responseBody,
      error:
        response.ok
          ? undefined
          : typeof toObject(responseBody)?.message === "string"
            ? String(toObject(responseBody)?.message)
            : "Failed to create GitHub issue",
    };
  } catch (error) {
    return {
      success: false,
      sent: false,
      error: error instanceof Error ? error.message : "GitHub issue request failed",
    };
  }
}
