import type { Metadata } from "next";
import Link from "next/link";

import { getAllBlogPosts } from "@/lib/services/blog";

export const metadata: Metadata = {
  title: "Blog | AgentLink",
  description: "Guides and insights on AI agent discovery, registration, and protocol compatibility.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">AgentLink Blog</h1>
        <p className="mt-2 text-zinc-600">
          Practical resources on AI agent discovery, interoperability, and platform growth.
        </p>

        <div className="mt-6 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <article key={post.slug} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {post.date} • {post.readingTimeMinutes} min read
                </p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-900">{post.title}</h2>
                <p className="mt-2 text-sm text-zinc-700">{post.description}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Read article
                </Link>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No blog posts found.</p>
          )}
        </div>
      </section>
    </main>
  );
}

