"use client";

import { useCallback } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const handleSignIn = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("callbackUrl");

    let callbackUrl = "/dashboard";
    if (!raw) {
      void signIn("github", { callbackUrl });
      return;
    }

    if (raw.startsWith("/") && raw !== "/") {
      callbackUrl = raw;
    }

    void signIn("github", { callbackUrl });
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in with GitHub to use AgentLink.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          onClick={handleSignIn}
        >
          Continue with GitHub
        </button>
      </section>
    </main>
  );
}
