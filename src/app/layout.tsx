import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import "@/styles/globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { COPY } from "@/lib/constants/copy";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.agent-l.ink";
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: "AgentLink",
  title: {
    default: COPY.meta.homeTitle,
    template: COPY.meta.siteTitleTemplate,
  },
  alternates: {
    canonical: "/",
  },
  description: COPY.meta.siteDescription,
  authors: [{ name: "AgentLink Team" }],
  creator: "AgentLink Team",
  publisher: "AgentLink",
  category: "technology",
  keywords: [
    "AI agent directory",
    "AI agent discovery",
    "MCP server registry",
    "A2A protocol",
    "Agent marketplace",
    "AgentLink",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: COPY.meta.homeTitle,
    description: COPY.meta.siteDescription,
    siteName: "AgentLink",
    type: "website",
    locale: "en_US",
    url: baseUrl,
    images: [`${baseUrl}/opengraph-image`],
  },
  twitter: {
    card: "summary_large_image",
    site: "@agentlink_ai",
    creator: "@agentlink_ai",
    title: COPY.meta.homeTitle,
    description: COPY.meta.siteDescription,
    images: [`${baseUrl}/opengraph-image`],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon?size=192", type: "image/png", sizes: "192x192" },
      { url: "/icon?size=512", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased`}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-zinc-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>{COPY.footer.tagline}</p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-zinc-900">
                  {COPY.footer.privacy}
                </Link>
                <Link href="/terms" className="hover:text-zinc-900">
                  {COPY.footer.terms}
                </Link>
                <Link href="/opt-out" className="hover:text-zinc-900">
                  {COPY.footer.optOut}
                </Link>
                <Link href="/recruitment-policy" className="hover:text-zinc-900">
                  {COPY.footer.recruitmentPolicy}
                </Link>
                <a href="/api/v1/openapi.json" className="hover:text-zinc-900">
                  {COPY.footer.openapi}
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


