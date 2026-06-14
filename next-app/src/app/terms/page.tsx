import type { Metadata } from "next";
import { LegalPage } from "../../components/public/LegalPage";
import { legalPages } from "../../lib/publicContent";

export const metadata: Metadata = {
  title: legalPages.terms.title,
  description: legalPages.terms.description,
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <LegalPage pageKey="terms" />;
}
