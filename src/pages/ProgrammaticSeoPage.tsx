import React from 'react';
import { Helmet } from 'react-helmet-async';
import { seoPagesData } from '../data/seoPages';
import SEOHelper from '../components/SEOHelper';

interface Props {
  slug: string;
}

const ProgrammaticSeoPage: React.FC<Props> = ({ slug }) => {

  if (!slug || !seoPagesData[slug]) {
    // If we're not using react-router-dom, we should handle rendering NotFoundPage here
    // Let me check how App.tsx handles not found. It just renders <NotFoundPage />
    // However, App.tsx uses its own window.location based routing for the most part, though maybe we use `slug` passed as a prop if we parse it in App.tsx
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Page Not Found</h1>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a href="/" className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Go back home</a>
        </div>
      </div>
    );
  }

  const data = seoPagesData[slug];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.metaDescription} />
      </Helmet>
      
      <SEOHelper 
        title={data.title}
        description={data.metaDescription}
      />

      <main className="isolate">
        {/* Hero section */}
        <div className="relative isolate pt-14">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
          </div>
          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                  {data.h1}
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                  {data.content.heroSubtitle}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <a href="/signup" className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    Get started
                  </a>
                  <a href="/demo" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
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
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-2xl ring-1 ring-inset ring-gray-200 dark:ring-gray-800">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                  {section.heading}
                </h2>
                <p className="text-lg leading-7 text-gray-600 dark:text-gray-300">
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
