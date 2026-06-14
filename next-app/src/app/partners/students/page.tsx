import type { Metadata } from "next";
import { PartnerPage } from "../../../components/public/PartnerPage";
import { partnerPages } from "../../../lib/publicContent";

export const metadata: Metadata = {
  title: "Student Ambassadors",
  description: partnerPages.students.description,
  alternates: {
    canonical: "/partners/students",
  },
};

export default function StudentAmbassadorsPage() {
  return <PartnerPage content={partnerPages.students} />;
}
