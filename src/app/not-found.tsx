import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Page not found</h1>
      <p className="mt-3 text-zinc-600">This page does not exist or was moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          Go home
        </Link>
        <Link href="/agents" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
          Browse agents
        </Link>
      </div>
    </main>
  );
}
