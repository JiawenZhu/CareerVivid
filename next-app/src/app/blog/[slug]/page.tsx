import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { PublicShell, SectionLabel } from "../../../components/public/PublicShell";
import { blogPosts, findBlogPost } from "../../../lib/blogContent";

type Props = {
  params: Promise<{ slug: string }>;
};

const siteUrl = "https://careervivid.app";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findBlogPost(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = findBlogPost(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "CareerVivid",
      url: siteUrl,
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <PublicShell>
      <main>
        <article className="mx-auto max-w-3xl px-6 py-16">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
          />
          <a href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#625bd5]">
            <ArrowLeft size={16} />
            Back to blog
          </a>
          <header className="mt-8 text-center">
            <SectionLabel>{post.category}</SectionLabel>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal md:text-6xl">
              {post.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
              {post.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-[#665a4a]">
              <span className="inline-flex items-center gap-2">
                <User size={16} />
                {post.author}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar size={16} />
                {post.date}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={16} />
                {post.readTime}
              </span>
            </div>
          </header>

          <section className="mt-10 rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Article tools</p>
                <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">
                  Share this guide or use it as context while preparing your next application.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                  aria-label="Share on LinkedIn"
                  className="rounded-full border border-[#e4d3bc] bg-white p-3 text-[#2563eb] transition hover:border-[#caa26c]"
                >
                  in
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                  aria-label="Share on X"
                  className="rounded-full border border-[#e4d3bc] bg-white px-3 py-2 text-sm font-black text-[#211b16] transition hover:border-[#caa26c]"
                >
                  X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                  aria-label="Share on Facebook"
                  className="rounded-full border border-[#e4d3bc] bg-white p-3 text-[#2563eb] transition hover:border-[#caa26c]"
                >
                  f
                </a>
              </div>
            </div>
          </section>

          <div className="mt-12 space-y-6">
            {post.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-6">
                <h2 className="text-2xl font-black">{section.heading}</h2>
                <p className="mt-4 text-base leading-8 text-[#665a4a]">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
    </PublicShell>
  );
}
