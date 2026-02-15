import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "agent-l.ink" }],
        destination: "https://www.agent-l.ink/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "agentlink.ai" }],
        destination: "https://www.agent-l.ink/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.agentlink.ai" }],
        destination: "https://www.agent-l.ink/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "agentlink-web-production.up.railway.app" }],
        destination: "https://www.agent-l.ink/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/api/v1/agents",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=300" }],
      },
      {
        source: "/api/v1/agents/:slug",
        headers: [{ key: "Cache-Control", value: "public, max-age=30, stale-while-revalidate=120" }],
      },
      {
        source: "/api/v1/feed",
        headers: [{ key: "Cache-Control", value: "public, max-age=30, stale-while-revalidate=120" }],
      },
    ];
  },
};

export default nextConfig;

