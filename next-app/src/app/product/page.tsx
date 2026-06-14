import type { Metadata } from "next";
import { ProductPageContent } from "../../components/public/ProductPageContent";
import { PublicShell } from "../../components/public/PublicShell";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Explore CareerVivid's AI resume, job tracker, interview prep, and application workspace.",
  alternates: {
    canonical: "/product",
  },
};

export default function ProductPage() {
  return (
    <PublicShell>
      <ProductPageContent />
    </PublicShell>
  );
}
