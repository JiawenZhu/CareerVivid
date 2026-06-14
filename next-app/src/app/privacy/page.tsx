import type { Metadata } from "next";
import { LegalPage } from "../../components/public/LegalPage";
import { legalPages } from "../../lib/publicContent";

export const metadata: Metadata = {
  title: legalPages.privacy.title,
  description: legalPages.privacy.description,
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalPage pageKey="privacy" />;
}
