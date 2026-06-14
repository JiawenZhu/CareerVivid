import type { Metadata } from "next";
import { PartnerPage } from "../../../components/public/PartnerPage";
import { partnerPages } from "../../../lib/publicContent";

export const metadata: Metadata = {
  title: "Hiring Partners",
  description: partnerPages.hiring.description,
  alternates: {
    canonical: "/partners/hiring",
  },
};

export default function HiringPartnersPage() {
  return <PartnerPage content={partnerPages.hiring} />;
}
