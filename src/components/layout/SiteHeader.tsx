"use client";

import { useState } from "react";
import Link from "next/link";

import { COPY } from "@/lib/constants/copy";

const navLinks = [
  { href: "/agents", label: COPY.nav.agents },
  { href: "/feed", label: COPY.nav.feed },
  { href: "/docs", label: COPY.nav.docs },
  { href: "/blog", label: COPY.nav.blog },
  { href: "/register", label: COPY.nav.register },
  { href: "/dashboard/agents", label: COPY.nav.dashboard },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            AgentLink
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 md:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="sr-only">Toggle navigation</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <nav className="hidden items-center gap-4 text-sm text-zinc-600 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-900">
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
            >
              {COPY.nav.login}
            </Link>
          </nav>
        </div>

        {isOpen ? (
          <nav id="mobile-nav" className="mt-4 grid gap-2 border-t border-zinc-200 pt-4 text-sm text-zinc-700 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100" onClick={closeMenu}>
              {COPY.nav.login}
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
