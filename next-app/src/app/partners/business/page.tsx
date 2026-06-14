import type { Metadata } from "next";
import { PartnerPage } from "../../../components/public/PartnerPage";
import { partnerPages } from "../../../lib/publicContent";

export const metadata: Metadata = {
  title: "Business Partners",
  description: partnerPages.business.description,
  alternates: {
    canonical: "/partners/business",
  },
};

export default function BusinessPartnersPage() {
  return <PartnerPage content={partnerPages.business} />;
}
