import type { Metadata } from "next";
import { PartnerLandingContent } from "../../components/public/PartnerLandingContent";
import { PublicShell } from "../../components/public/PublicShell";
import { partnerLanding } from "../../lib/publicContent";

export const metadata: Metadata = {
  title: "Partner Programs",
  description: partnerLanding.description,
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnersPage() {
  return (
    <PublicShell>
      <PartnerLandingContent />
    </PublicShell>
  );
}
