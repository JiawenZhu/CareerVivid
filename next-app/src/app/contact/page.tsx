import type { Metadata } from "next";
import { PublicShell, SectionLabel } from "../../components/public/PublicShell";
import { contactChannels, contactFaqs } from "../../lib/contactContent";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact CareerVivid for support, billing, partnerships, media, schools, agencies, and hiring team inquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-5xl px-6 py-16 text-center">
          <SectionLabel>Support and contact</SectionLabel>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
            Reach the right CareerVivid team.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
            Use the channel that matches your question. We keep support,
            billing, and partnership conversations separate so requests move to
            the right place faster.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-12 md:grid-cols-3">
          {contactChannels.map((channel) => (
            <a
              key={channel.email}
              href={`mailto:${channel.email}`}
              className="rounded-[1.25rem] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm transition hover:border-[#caa26c]"
            >
              <h2 className="text-xl font-black">{channel.title}</h2>
              <p className="mt-2 text-sm font-black text-[#625bd5]">{channel.email}</p>
              <p className="mt-4 text-sm leading-7 text-[#665a4a]">{channel.body}</p>
            </a>
          ))}
        </section>

        <section className="border-y border-[#e4d3bc] bg-[#fffaf1]/70">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <SectionLabel>Questions before you start</SectionLabel>
            <div className="mt-6 space-y-4">
              {contactFaqs.map((faq) => (
                <article key={faq.question} className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
                  <h2 className="text-lg font-black">{faq.question}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#665a4a]">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
