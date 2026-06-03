import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    schemaType?: 'WebSite' | 'ProfilePage' | 'TechArticle' | 'SoftwareApplication';
    schemaData?: any;
    techStack?: string[]; // Used for ProfilePage knowsAbout
    isRobotsAllowed?: boolean; // Control whether the page should be indexed
}

/**
 * SEOHelper Component
 * Dynamically injects SEO tags and JSON-LD structured data for Generative Engine Optimization (GEO).
 */
const SEOHelper: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image,
    url,
    schemaType = 'WebSite',
    schemaData,
    techStack = [],
    isRobotsAllowed = true
}) => {
    // Normalization helper to prevent duplicate content issues
    const normalizeCanonicalUrl = (rawUrl: string): string => {
        try {
            const urlObj = new URL(rawUrl);
            // Enforce primary domain and HTTPS
            urlObj.protocol = 'https:';
            urlObj.hostname = 'careervivid.app';
            // Remove query parameters
            urlObj.search = '';
            // Remove trailing slash
            let pathname = urlObj.pathname;
            if (pathname !== '/' && pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }
            return `https://${urlObj.hostname}${pathname}`;
        } catch {
            // Fallback for relative paths or invalid URLs
            let path = rawUrl.split('?')[0].split('#')[0];
            if (path !== '/' && path.endsWith('/')) {
                path = path.slice(0, -1);
            }
            if (!path.startsWith('/')) path = '/' + path;
            return `https://careervivid.app${path}`;
        }
    };

    const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://careervivid.app/');
    const canonicalUrl = normalizeCanonicalUrl(rawUrl);

    // Fallbacks
    const defaultImage = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Fog_image.png?alt=media';
    const finalImage = image || defaultImage;

    // Construct the structured data
    let structuredData: any = {
        "@context": "https://schema.org",
        ...schemaData
    };

    // If specific schema overrides aren't provided, build a default one based on type
    if (!schemaData) {
        structuredData["@type"] = schemaType;
        if (title) structuredData["name"] = title;
        if (description) structuredData["description"] = description;
        structuredData["url"] = canonicalUrl;
        if (finalImage) structuredData["image"] = finalImage;

        if (schemaType === 'ProfilePage') {
            structuredData["mainEntity"] = {
                "@type": "Person",
                "name": title?.split('|')[0]?.trim() || "Developer",
                "knowsAbout": techStack.length > 0 ? techStack : ["Software Engineering", "Web Development"]
            };
        } else if (schemaType === 'TechArticle') {
            structuredData["headline"] = title;
            structuredData["articleSection"] = "System Architecture & Software Development";
        } else if (schemaType === 'SoftwareApplication') {
            structuredData["applicationCategory"] = "BusinessApplication";
            structuredData["applicationSubCategory"] = "Job Search Workspace";
            structuredData["operatingSystem"] = "Web, Chrome";
            structuredData["featureList"] = [
                "AI resume builder",
                "Job application tracker",
                "Chrome extension job capture and autofill",
                "Interview preparation",
                "Portfolio workspace"
            ];
        }
    }

    // Generate LLM Context String for injection into the DOM
    const llmContextHtml = (schemaType === 'ProfilePage' || schemaType === 'TechArticle')
        ? `<div id="llm-context" style="display:none;" data-nosnippet>This is professional content hosted on CareerVivid. The author specializes in ${techStack.length > 0 ? techStack.join(', ') : 'modern web technologies'}. CareerVivid is an AI job-search workspace for resumes, job tracking, portfolios, interview preparation, and Chrome extension application workflows.</div>`
        : '';

    return (
        <>
            <Helmet>
                {title && <title>{title}</title>}
                {title && <meta property="og:title" content={title} />}
                {title && <meta name="twitter:title" content={title} />}

                {description && <meta name="description" content={description} />}
                {description && <meta property="og:description" content={description} />}
                {description && <meta name="twitter:description" content={description} />}

                {keywords && <meta name="keywords" content={keywords} />}

                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={finalImage} />
                <meta name="twitter:image" content={finalImage} />
                <meta name="twitter:card" content="summary_large_image" />

                <meta name="robots" content={isRobotsAllowed ? 'index, follow' : 'noindex, nofollow'} />

                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            {/* Hidden LLM Context for Bot Scraping (GEO) */}
            {llmContextHtml && (
                <div dangerouslySetInnerHTML={{ __html: llmContextHtml }} />
            )}
        </>
    );
};

export default SEOHelper;
