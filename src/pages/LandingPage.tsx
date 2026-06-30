import React from 'react';
import { Helmet } from 'react-helmet-async';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import CommunityShowcaseHero from '../components/Landing/CommunityShowcaseHero';
import {
    FAQSection,
    FinalCTA,
    DemoVideoSection,
    PlatformAvailabilitySection,
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
const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/dmigeakdfokehlhigkhadglgoabceoag?utm_source=item-share-cb';

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': 'https://careervivid.app/#organization',
            name: 'CareerVivid',
            url: 'https://careervivid.app/',
            description: 'CareerVivid builds AI-powered tools for resumes, job tracking, interview prep, portfolios, and job application autofill.',
            logo: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55',
            sameAs: ['https://twitter.com/careervivid'],
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
            '@type': ['WebApplication', 'SoftwareApplication'],
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
                'iOS app coming soon',
                'Android app coming soon',
                'Gemini-powered career workflows',
            ],
            audience: [
                { '@type': 'Audience', audienceType: 'students' },
                { '@type': 'Audience', audienceType: 'new graduates' },
                { '@type': 'Audience', audienceType: 'career changers' },
                { '@type': 'Audience', audienceType: 'job seekers' },
            ],
            potentialAction: [
                {
                    '@type': 'RegisterAction',
                    name: 'Start for free',
                    target: 'https://careervivid.app/signup',
                },
                {
                    '@type': 'UseAction',
                    name: 'Build a resume',
                    target: 'https://careervivid.app/newresume',
                },
                {
                    '@type': 'DownloadAction',
                    name: 'Install the Chrome extension',
                    target: CHROME_EXTENSION_URL,
                },
            ],
            description: SEO_DESCRIPTION,
            publisher: { '@id': 'https://careervivid.app/#organization' },
        },
        {
            '@type': 'FAQPage',
            '@id': 'https://careervivid.app/#faq',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'What is CareerVivid?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'CareerVivid is your AI-powered co-pilot for the job search, bringing standout resumes, application tracking, interview prep, portfolios, and Chrome extension autofill into one account.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Who is CareerVivid built for?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'CareerVivid is built for students, new graduates, career changers, and job seekers who want one place to build resumes, track applications, prepare for interviews, and move faster through the job search.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Can I start CareerVivid for free?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. Job seekers can start CareerVivid for free and use the workspace to organize their job search before upgrading for advanced AI workflows.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Does CareerVivid have a Chrome extension and mobile apps?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'CareerVivid has a Chrome extension for saving job postings, autofilling applications, and connecting browser work to the workspace. CareerVivid iOS and Android apps are coming soon.',
                    },
                },
            ],
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
            downloadUrl: CHROME_EXTENSION_URL,
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
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <link rel="canonical" href="https://careervivid.app/" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://careervivid.app/" />
            <meta property="og:site_name" content="CareerVivid" />
            <meta property="og:locale" content="en_US" />
            <meta property="og:title" content={SEO_TITLE} />
            <meta property="og:description" content={SEO_DESCRIPTION} />
            <meta property="og:image" content={SEO_IMAGE} />
            <meta property="og:image:alt" content="CareerVivid AI-powered job search workspace" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@careervivid" />
            <meta name="twitter:creator" content="@careervivid" />
            <meta name="twitter:title" content={SEO_TITLE} />
            <meta name="twitter:description" content={SEO_DESCRIPTION} />
            <meta name="twitter:image" content={SEO_IMAGE} />
            <meta name="twitter:image:alt" content="CareerVivid AI-powered job search workspace" />
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
        <PublicHeader variant="editorial" />
        <main>
            <CommunityShowcaseHero />
            <ProductIndex />
            <PlatformAvailabilitySection />
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
