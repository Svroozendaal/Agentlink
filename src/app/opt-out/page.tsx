import type { Metadata } from "next";

import { OptOutForm } from "./opt-out-form";

export const metadata: Metadata = {
  title: "Recruitment Opt-out | AgentLink",
  description: "Opt out your domain from AgentLink automated recruitment invitations.",
  alternates: {
    canonical: "/opt-out",
  },
};

export default function OptOutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <OptOutForm />
    </main>
  );
}
