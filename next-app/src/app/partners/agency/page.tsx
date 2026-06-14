import type { Metadata } from "next";
import { PartnerPage } from "../../../components/public/PartnerPage";
import { partnerPages } from "../../../lib/publicContent";

export const metadata: Metadata = {
  title: "Agency Partner Pilot",
  description: partnerPages.agency.description,
  alternates: {
    canonical: "/partners/agency",
  },
};

export default function AgencyPartnersPage() {
  return <PartnerPage content={partnerPages.agency} />;
}
