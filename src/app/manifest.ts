import type { MetadataRoute } from "next";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getBaseUrl();

  return {
    name: "AgentLink",
    short_name: "AgentLink",
    description:
      "Open platform for AI agent discovery, trust signals, and protocol-native interoperability.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    categories: ["technology", "developer", "productivity"],
    icons: [
      {
        src: `${baseUrl}/icon?size=192`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${baseUrl}/icon?size=512`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${baseUrl}/apple-icon`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
