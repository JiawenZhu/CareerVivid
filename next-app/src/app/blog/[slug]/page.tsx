import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell, SectionLabel } from "../../../components/public/PublicShell";
import { blogPosts, findBlogPost } from "../../../lib/blogContent";

type Props = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <PublicShell>
      <main>
        <article className="mx-auto max-w-3xl px-6 py-16">
          <a href="/blog" className="text-sm font-bold text-[#625bd5]">Back to blog</a>
          <header className="mt-8 text-center">
            <SectionLabel>{post.category}</SectionLabel>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal md:text-6xl">
              {post.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
              {post.description}
            </p>
            <p className="mt-5 text-sm font-bold text-[#665a4a]">
              {post.author} · {post.date} · {post.readTime}
            </p>
          </header>

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
