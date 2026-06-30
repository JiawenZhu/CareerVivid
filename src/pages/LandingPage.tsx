import React from 'react';
import { Helmet } from 'react-helmet-async';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import CommunityShowcaseHero from '../components/Landing/CommunityShowcaseHero';
import {
    FAQSection,
    FinalCTA,
    DemoVideoSection,
    ProductIndex,
    ProofSection,
    TeamsAndTrustSection,
    UserStoriesSection,
    WorkflowSection,
} from '../components/Landing/LandingTrustSections';

const SEO_TITLE = 'CareerVivid | The AI That Gets You Hired';
const SEO_DESCRIPTION = 'CareerVivid is your AI-powered co-pilot for the job search — build standout resumes, track applications, prep for interviews, and autofill job forms in seconds. Your next job starts here.';
const SEO_KEYWORDS = 'AI job search workspace, Chrome extension job autofill, AI resume builder, job tracker, resume match, interview coach, application tracker, ATS resume optimization';
const SEO_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Fog_image.png?alt=media';

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': 'https://careervivid.app/#organization',
            name: 'CareerVivid',
            url: 'https://careervivid.app/',
            logo: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55',
        },
        {
            '@type': 'WebSite',
            '@id': 'https://careervivid.app/#website',
            name: 'CareerVivid',
            url: 'https://careervivid.app/',
            description: SEO_DESCRIPTION,
            publisher: { '@id': 'https://careervivid.app/#organization' },
        },
        {
            '@type': 'WebApplication',
            '@id': 'https://careervivid.app/#job-workspace',
            name: 'CareerVivid',
            alternateName: 'CareerVivid Job Search Workspace',
            url: 'https://careervivid.app/',
            image: SEO_IMAGE,
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'Job Search Workspace',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'CareerVivid Free' },
            featureList: [
                'AI resume builder and tailoring',
                'Job application tracker',
                'Resume match scoring',
                'Interview preparation and feedback',
                'Portfolio and whiteboard workspace',
                'Chrome extension job capture and autofill',
                'Gemini-powered career workflows',
            ],
            description: SEO_DESCRIPTION,
            publisher: { '@id': 'https://careervivid.app/#organization' },
        },
        {
            '@type': 'BrowserApplication',
            '@id': 'https://careervivid.app/#chrome-extension',
            name: 'CareerVivid Chrome Extension',
            url: 'https://careervivid.app/extension-welcome',
            browserRequirements: 'Chrome',
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'Job Application Autofill',
            operatingSystem: 'Chrome',
            featureList: [
                'Save job postings from the browser',
                'Autofill job applications',
                'Analyze resume match on job pages',
                'Send roles into the CareerVivid job tracker',
            ],
            description: 'The CareerVivid Chrome extension helps job seekers save roles, autofill applications, analyze job fit, and keep browser work connected to their CareerVivid workspace.',
            publisher: { '@id': 'https://careervivid.app/#organization' },
        },
    ],
};

const LandingPage: React.FC = () => (
    <div className="cv-public-warm-page min-h-screen bg-white text-gray-900 selection:bg-amber-200/60 dark:bg-gray-950 dark:text-gray-100">
        <Helmet titleTemplate="%s">
            <title>{SEO_TITLE}</title>
            <meta name="title" content={SEO_TITLE} />
            <meta name="description" content={SEO_DESCRIPTION} />
            <meta name="keywords" content={SEO_KEYWORDS} />
            <link rel="canonical" href="https://careervivid.app/" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://careervivid.app/" />
            <meta property="og:site_name" content="CareerVivid" />
            <meta property="og:title" content={SEO_TITLE} />
            <meta property="og:description" content={SEO_DESCRIPTION} />
            <meta property="og:image" content={SEO_IMAGE} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={SEO_TITLE} />
            <meta name="twitter:description" content={SEO_DESCRIPTION} />
            <meta name="twitter:image" content={SEO_IMAGE} />
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
        <PublicHeader variant="editorial" />
        <main>
            <CommunityShowcaseHero />
            <ProductIndex />
            <DemoVideoSection />
            <UserStoriesSection />
            <ProofSection />
            <WorkflowSection />
            <TeamsAndTrustSection />
            <FAQSection />
            <FinalCTA />
        </main>
        <Footer />
    </div>
);

export default LandingPage;
