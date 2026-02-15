import type { Metadata } from "next";

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
}

export function buildMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
}): Metadata {
  const url = `${baseUrl()}${options.path}`;
  const image = options.image ?? `${baseUrl()}/opengraph-image`;

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      siteName: "AgentLink",
      type: options.type ?? "website",
      locale: "en_US",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image],
      creator: "@agentlink_ai",
    },
  };
}



