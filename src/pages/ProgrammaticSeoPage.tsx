import React from 'react';
import { Helmet } from 'react-helmet-async';
import { seoPagesData } from '../data/seoPages';
import SEOHelper from '../components/SEOHelper';
import PublicHeader from '../components/PublicHeader';

interface Props {
  slug: string;
}

const ProgrammaticSeoPage: React.FC<Props> = ({ slug }) => {

  if (!slug || !seoPagesData[slug]) {
    // If we're not using react-router-dom, we should handle rendering NotFoundPage here
    // Let me check how App.tsx handles not found. It just renders <NotFoundPage />
    // However, App.tsx uses its own window.location based routing for the most part, though maybe we use `slug` passed as a prop if we parse it in App.tsx
    return (
      <div className="cv-warm-page cv-warm-grid flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="cv-warm-heading text-4xl sm:text-5xl">Page Not Found</h1>
        <p className="cv-warm-body mt-4 text-base">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a href="/" className="rounded-md bg-[#211b16] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3a2b20] dark:bg-[#f4f1e9] dark:text-[#1f1f1d]">Go back home</a>
        </div>
      </div>
    );
  }

  const data = seoPagesData[slug];

  return (
    <div className="cv-warm-page cv-warm-grid">
      <PublicHeader variant="editorial" />
      <Helmet titleTemplate="%s">
        <title>{data.title}</title>
        <meta name="description" content={data.metaDescription} />
      </Helmet>
      
      <SEOHelper 
        title={data.title}
        description={data.metaDescription}
      />

      <main className="isolate pt-20">
        {/* Hero section */}
        <div className="relative isolate pt-14">
          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <div className="cv-warm-eyebrow mb-4">CareerVivid guide</div>
                <h1 className="cv-warm-heading text-4xl sm:text-6xl">
                  {data.h1}
                </h1>
                <p className="cv-warm-body mt-6 text-lg">
                  {data.content.heroSubtitle}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <a href="/signup" className="rounded-md bg-[#211b16] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3a2b20] dark:bg-[#f4f1e9] dark:text-[#1f1f1d]">
                    Get started
                  </a>
                  <a href="/" className="text-sm font-semibold leading-6 text-[#665a4a] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24 sm:pb-32">
          <div className="mx-auto max-w-3xl space-y-16">
            {data.content.sections.map((section, index) => (
              <div key={index} className="cv-warm-card p-8">
                <h2 className="cv-warm-heading mb-4 text-2xl">
                  {section.heading}
                </h2>
                <p className="cv-warm-body text-lg">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProgrammaticSeoPage;
