import React from 'react';
import { Helmet } from 'react-helmet-async';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import CommunityShowcaseHero from '../components/Landing/CommunityShowcaseHero';
import LearnPracticeHiredSection from '../components/Landing/LearnPracticeHiredSection';
import CourseShowcaseSection from '../components/Landing/CourseShowcaseSection';
import InterviewShowcaseSection from '../components/Landing/InterviewShowcaseSection';
import {
    FAQSection,
    FinalCTA,
    DemoVideoSection,
    PricingPreviewSection,
    UserStoriesSection,
} from '../components/Landing/LandingTrustSections';

const SEO_TITLE = 'CareerVivid | Learn the Skills. Practice the Interview. Land the Job.';
const SEO_DESCRIPTION = 'Interactive AI courses, real company mock interview loops with a live voice AI, and a feed of verified apply-ready jobs. Practice Google, Amazon, Figma and 300+ company interviews free — then apply with a tailored resume from the same workspace.';
const SEO_KEYWORDS = 'mock interview practice, AI interview practice, company interview questions, free AI courses, learn AI agents, LLM course, AI voice interviewer, coding interview practice, system design practice, verified job listings, AI resume builder, job tracker, interview coach';
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
                'Interactive AI courses with hands-on playgrounds, quizzes, and code labs',
                'Company-specific mock interview loops for 300+ companies',
                'Realtime voice AI interviewer with scored feedback',
                'In-browser coding rounds with real test execution',
                'Whiteboard system-design rounds graded by AI',
                'Verified apply-ready job feed from official company career boards',
                'AI resume builder and tailoring',
                'ATS resume checker and readiness score',
                'Job application tracker',
                'Chrome extension job capture and autofill',
                'XP and progress tracking across courses and interviews',
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
                        text: 'CareerVivid is a career platform that takes you from learning to hired in one place: interactive AI courses that teach by doing, mock interview loops for 300+ real companies with a live voice AI interviewer, and a feed of verified apply-ready jobs — plus resume tailoring and application tracking.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Can I practice a Google or Amazon interview on CareerVivid?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes. CareerVivid has company-specific interview quests for 300+ companies including Google, Amazon, Meta, Apple, OpenAI, and Figma. Each quest mirrors the company\'s real loop — recruiter screen, live coding with test execution, whiteboard system design, and behavioral rounds — and a voice AI interviews and scores you. Every quest page is free to browse; running stages requires a free account.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Are the CareerVivid AI courses free?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'The Foundations course is completely free — no account required. It includes interactive playgrounds where you watch a language model predict tokens, sort the AI stack, and experiment with temperature. Creating a free account saves progress and XP; paid plans unlock all 10 courses and 60+ hands-on lessons.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'How do CareerVivid mock interviews work?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'A realtime voice AI interviews you with questions drawn from the company\'s verified interview guide, adapts to your answers, and produces a scored feedback report covering communication, confidence, and relevance. Coding rounds run your code against real tests in the browser; system design rounds are drawn on a whiteboard and graded by AI.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Where do CareerVivid\'s recommended jobs come from?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Jobs are ingested directly from 160+ companies\' official career boards (Greenhouse, Lever, and Ashby) every six hours, and every apply link is validated before it appears — expired or broken postings are removed automatically.',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'Do I need a credit card to start?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'No. You can browse all courses, company interview quests, and the community without an account, and a free account — no credit card — unlocks the Foundations course, saved progress, and starter AI credits for mock interviews.',
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
            {/* Slim narrative: hero → journey → real courses → real interview loops → demo → proof → pricing → FAQ → CTA */}
            <CommunityShowcaseHero />
            <LearnPracticeHiredSection />
            <CourseShowcaseSection />
            <InterviewShowcaseSection />
            <DemoVideoSection />
            <UserStoriesSection />
            <PricingPreviewSection />
            <FAQSection />
            <FinalCTA />
        </main>
        <Footer />
    </div>
);

export default LandingPage;
