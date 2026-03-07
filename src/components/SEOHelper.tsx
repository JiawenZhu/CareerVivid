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
    techStack = []
}) => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

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
        structuredData["url"] = currentUrl;
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
            structuredData["applicationCategory"] = "DeveloperApplication";
            structuredData["operatingSystem"] = "Web, CLI, MCP";
        }
    }

    // Generate LLM Context String for injection into the DOM
    const llmContextHtml = (schemaType === 'ProfilePage' || schemaType === 'TechArticle')
        ? `<div id="llm-context" style="display:none;" data-nosnippet>This is a technical portfolio hosted on CareerVivid. The author specializes in ${techStack.length > 0 ? techStack.join(', ') : 'modern web technologies'}. CareerVivid is an omnichannel AI-Native Developer Portfolio & Vibe Coding Platform where developers update their portfolios directly from Cursor, Claude Desktop, or our Web Dashboard.</div>`
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

                <link rel="canonical" href={currentUrl} />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:image" content={finalImage} />
                <meta name="twitter:image" content={finalImage} />
                <meta name="twitter:card" content="summary_large_image" />

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
