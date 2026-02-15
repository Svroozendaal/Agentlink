import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/services/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function renderMarkdown(content: string) {
  const lines = content.split(/\r?\n/);
  const blocks: Array<JSX.Element> = [];
  let inCode = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push(
          <pre key={`code-${index}`} className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
            <code>{codeBuffer.join("\n")}</code>
          </pre>,
        );
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${index}`} className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900">
          {line.replace(/^# /, "")}
        </h1>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${index}`} className="mt-6 text-2xl font-semibold text-zinc-900">
          {line.replace(/^## /, "")}
        </h2>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${index}`} className="mt-5 text-xl font-semibold text-zinc-900">
          {line.replace(/^### /, "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      blocks.push(
        <li key={`li-${index}`} className="ml-5 list-disc text-zinc-700">
          {line.replace(/^- /, "")}
        </li>,
      );
      return;
    }

    if (line.trim().length === 0) {
      blocks.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="text-zinc-700">
        {line}
      </p>,
    );
  });

  return blocks;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog post not found | AgentLink",
    };
  }

  return {
    title: `${post.title} | AgentLink`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "en_US",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    description: post.description,
    mainEntityOfPage: `https://agentlink.ai/blog/${post.slug}`,
  };

  const allPosts = await getAllBlogPosts();
  const relatedPosts = allPosts.filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {post.date} | {post.readingTimeMinutes} min read | {post.author}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{post.title}</h1>
        <p className="mt-2 text-zinc-600">{post.description}</p>

        <div className="mt-6 space-y-3">{renderMarkdown(post.content)}</div>
      </article>

      {relatedPosts.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Related articles</h2>
          <div className="mt-3 space-y-2 text-sm">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="block text-sky-700 hover:text-sky-800"
              >
                {relatedPost.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
