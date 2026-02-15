import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import "@/styles/globals.css";
import { COPY } from "@/lib/constants/copy";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const baseUrl = process.env.NEXTAUTH_URL ?? "https://agentlink.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: COPY.meta.homeTitle,
    template: COPY.meta.siteTitleTemplate,
  },
  description: COPY.meta.siteDescription,
  openGraph: {
    title: COPY.meta.homeTitle,
    description: COPY.meta.siteDescription,
    type: "website",
    locale: "en_US",
    url: baseUrl,
  },
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
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
              <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
                AgentLink
              </Link>
              <nav className="flex items-center gap-4 text-sm text-zinc-600">
                <Link href="/agents" className="hover:text-zinc-900">
                  {COPY.nav.agents}
                </Link>
                <Link href="/feed" className="hover:text-zinc-900">
                  {COPY.nav.feed}
                </Link>
                <Link href="/docs" className="hover:text-zinc-900">
                  {COPY.nav.docs}
                </Link>
                <Link href="/blog" className="hover:text-zinc-900">
                  {COPY.nav.blog}
                </Link>
                <Link href="/register" className="hover:text-zinc-900">
                  {COPY.nav.register}
                </Link>
                <Link href="/dashboard/agents" className="hover:text-zinc-900">
                  {COPY.nav.dashboard}
                </Link>
                <Link href="/login" className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100">
                  {COPY.nav.login}
                </Link>
              </nav>
            </div>
          </header>
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
