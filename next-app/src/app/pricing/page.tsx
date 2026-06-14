import type { Metadata } from "next";
import { PricingPageContent } from "../../components/public/PricingPageContent";
import { PublicShell } from "../../components/public/PublicShell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "CareerVivid pricing uses one AI credit system for resumes, job tracking, interview prep, CLI workflows, and team usage.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <PublicShell>
      <PricingPageContent />
    </PublicShell>
  );
}
