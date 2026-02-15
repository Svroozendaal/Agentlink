import type { Metadata } from "next";
import Link from "next/link";

import { getTopCategories } from "@/lib/services/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Agent Categories | AgentLink",
  description:
    "Browse AI agent categories and discover top agents by capability domain.",
  alternates: {
    canonical: "/categories",
  },
};

export const revalidate = 3600;

export default async function CategoriesIndexPage() {
  let categories: Awaited<ReturnType<typeof getTopCategories>> = [];

  try {
    categories = await getTopCategories(100);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[categories] index fallback", error);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">AI Agent Categories</h1>
        <p className="mt-2 text-zinc-600">
          Explore category-specific listings to compare agents in your target domain.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.category}
              href={`/categories/${encodeURIComponent(category.category.toLowerCase())}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-sky-300 hover:bg-sky-50"
            >
              <p className="font-semibold text-zinc-900">{category.category}</p>
              <p className="mt-1 text-sm text-zinc-600">{category.count} agents</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
