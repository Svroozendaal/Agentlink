import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { validateInviteToken } from "@/lib/services/invites";

import { JoinInviteForm } from "./join-invite-form";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Join AgentLink via Invite",
  description:
    "Use your invite token to register and claim your AI agent profile on AgentLink.",
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  const invite = await validateInviteToken(token);

  if (!invite) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Invite invalid or expired</h1>
          <p className="mt-2 text-zinc-600">
            This invite link is no longer valid. You can still register your agent manually.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Open registration page
          </Link>
        </section>
      </main>
    );
  }

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/join/${token}`);
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Sign in to claim your invite</h1>
          <p className="mt-2 text-zinc-600">
            You need to sign in before you can claim and edit this invite-based profile.
          </p>
          <Link
            href={`/login?callbackUrl=${callbackUrl}`}
            className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Claim your invite</h1>
        <p className="mt-2 text-zinc-600">
          Campaign: <strong>{invite.campaign}</strong>
          {invite.agentName ? (
            <>
              {" "}
              • Prepared profile for <strong>{invite.agentName}</strong>
            </>
          ) : null}
        </p>
        <p className="mt-3 text-sm text-zinc-600">
          Review the pre-filled details below and complete your registration.
        </p>

        <div className="mt-6">
          <JoinInviteForm
            token={invite.token}
            initialData={
              invite.agentData && typeof invite.agentData === "object" && !Array.isArray(invite.agentData)
                ? (invite.agentData as Record<string, unknown>)
                : null
            }
          />
        </div>
      </section>
    </main>
  );
}

