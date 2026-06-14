import type { Metadata } from "next";
import { PublicShell, SectionLabel } from "../../components/public/PublicShell";
import { blogPosts } from "../../lib/blogContent";

export const metadata: Metadata = {
  title: "CareerVivid Blog",
  description:
    "CareerVivid articles about job tracking, resume tailoring, interview preparation, Chrome extension workflows, and AI career tools.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <SectionLabel>CareerVivid blog</SectionLabel>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
            Practical notes for a clearer job search.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
            Articles about building better application routines with saved job
            context, resume tailoring, interview preparation, and AI tools.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-14 md:grid-cols-3">
          {blogPosts.map((post) => (
            <a key={post.slug} href={`/blog/${post.slug}`} className="rounded-[1.25rem] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm transition hover:border-[#caa26c]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a97935]">{post.category}</p>
              <h2 className="mt-3 text-2xl font-black leading-tight">{post.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#665a4a]">{post.description}</p>
              <p className="mt-5 text-xs font-bold text-[#665a4a]">
                {post.author} · {post.readTime}
              </p>
            </a>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
