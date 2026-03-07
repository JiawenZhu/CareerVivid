import { FAQEntry } from '../types';

interface SchemaPost {
    title: string;
    content: string;
    coverImage?: string;
    authorName?: string;
    authorAvatar?: string;
    createdAt?: any;
    updatedAt?: any;
}

/**
 * Generates a GEO-optimized JSON-LD structured data object using @graph.
 * Combines Article and FAQPage schemas.
 */
export const generateGEOStructuredData = (post: SchemaPost, faqs?: FAQEntry[]) => {
    const publishDate = post.createdAt?.toDate ? post.createdAt.toDate().toISOString() : post.createdAt;
    const modifyDate = post.updatedAt?.toDate ? post.updatedAt.toDate().toISOString() : post.updatedAt || publishDate;

    // 1. Article Schema
    const articleSchema: any = {
        "@type": "Article",
        "@id": `${window.location.href}#article`,
        "headline": post.title,
        "image": post.coverImage ? [post.coverImage] : [],
        "datePublished": publishDate,
        "dateModified": modifyDate,
        "author": {
            "@type": "Person",
            "name": post.authorName || "CareerVivid Staff",
            "image": post.authorAvatar || undefined
        },
        "publisher": {
            "@type": "Organization",
            "name": "CareerVivid",
            "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logo.png`
            }
        },
        "description": post.content?.replace(/[#_*`[\]]/g, '').substring(0, 160)
    };

    // 2. FAQ Schema
    const platformFAQs = [
        {
            "@type": "Question",
            "name": "How do I update my CareerVivid portfolio from Cursor?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can update your resume, portfolio, and whiteboards directly from Cursor or Antigravity using the CareerVivid CLI and MCP integrations."
            }
        },
        {
            "@type": "Question",
            "name": "What is the best platform for a vibe coding portfolio?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "CareerVivid allows developers to instantly publish AI-generated code, system designs, and whiteboards into a professional portfolio."
            }
        }
    ];

    let faqSchema: any = {
        "@type": "FAQPage",
        "@id": `${window.location.href}#faq`,
        "mainEntity": [
            ...(faqs || []).map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            })),
            ...platformFAQs
        ]
    };

    // Combine into @graph
    const graph = [articleSchema, faqSchema];

    return {
        "@context": "https://schema.org",
        "@graph": graph
    };
};
