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
    let faqSchema: any = null;
    if (faqs && faqs.length > 0) {
        faqSchema = {
            "@type": "FAQPage",
            "@id": `${window.location.href}#faq`,
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    }

    // Combine into @graph
    const graph = [articleSchema];
    if (faqSchema) {
        graph.push(faqSchema);
    }

    return {
        "@context": "https://schema.org",
        "@graph": graph
    };
};
