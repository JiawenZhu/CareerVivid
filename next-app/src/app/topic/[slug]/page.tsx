import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell, PrimaryLink, SectionLabel } from "../../../components/public/PublicShell";
import { topicPages } from "../../../lib/publicContent";

type TopicSlug = keyof typeof topicPages;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(topicPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicPages[slug as TopicSlug];

  if (!topic) {
    return {};
  }

  return {
    title: topic.title,
    description: topic.description,
    alternates: {
      canonical: `/topic/${slug}`,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = topicPages[slug as TopicSlug];

  if (!topic) {
    notFound();
  }

  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <SectionLabel>CareerVivid topic</SectionLabel>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
            {topic.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
            {topic.subtitle}
          </p>
          <div className="mt-8">
            <PrimaryLink href="/signup">Start a workspace</PrimaryLink>
          </div>
        </section>

        <section className="border-y border-[#e4d3bc] bg-[#fffaf1]/70">
          <div className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-2">
            {topic.sections.map((section) => (
              <article key={section.heading} className="rounded-2xl border border-[#e4d3bc] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">{section.heading}</h2>
                <p className="mt-4 text-sm leading-7 text-[#665a4a]">{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
