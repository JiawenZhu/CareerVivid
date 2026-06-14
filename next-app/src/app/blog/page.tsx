import type { Metadata } from "next";
import { BlogIndexContent } from "../../components/public/BlogIndexContent";
import { PublicShell } from "../../components/public/PublicShell";

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
      <BlogIndexContent />
    </PublicShell>
  );
}
