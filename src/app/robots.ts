import type { MetadataRoute } from "next";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/.well-known/", "/api/v1/openapi.json", "/api/v1/a2a/discover", "/api/v1/mcp", "/llms.txt"],
        disallow: ["/api/", "/api/auth/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "ChatGPT-User", "Google-Extended"],
        allow: ["/", "/.well-known/", "/api/v1/openapi.json", "/api/v1/a2a/discover", "/api/v1/mcp", "/llms.txt"],
        disallow: ["/dashboard/", "/admin/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}


