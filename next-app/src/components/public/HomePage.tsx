import { CommunityShowcaseHero } from "./CommunityShowcaseHero";
import {
  FAQSection,
  FinalCTA,
  ProductIndex,
  ProofSection,
  TeamsAndTrustSection,
  UserStoriesSection,
  WorkflowSection,
} from "./LandingTrustSections";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#fbfbfe] text-gray-950 selection:bg-emerald-100 dark:bg-gray-950 dark:text-white">
      <PublicHeader />
      <main>
        <CommunityShowcaseHero />
        <ProductIndex />
        <UserStoriesSection />
        <ProofSection />
        <WorkflowSection />
        <TeamsAndTrustSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <PublicFooter />
    </div>
  );
}
