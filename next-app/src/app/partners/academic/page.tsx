import type { Metadata } from "next";
import { PartnerPage } from "../../../components/public/PartnerPage";
import { partnerPages } from "../../../lib/publicContent";

export const metadata: Metadata = {
  title: "Academic Partners",
  description: partnerPages.academic.description,
  alternates: {
    canonical: "/partners/academic",
  },
};

export default function AcademicPartnersPage() {
  return <PartnerPage content={partnerPages.academic} />;
}
