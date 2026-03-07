import { FAQEntry } from '../types';

/**
 * GEO Formatting Utility
 * Handles parsing and validation of GEO-specific content rules.
 */

export interface GEOParseResult {
    content: string;
    faqs: FAQEntry[];
    hasTLDR: boolean;
}

/**
 * Parses markdown content to extract GEO-specific sections like TL;DR and FAQ.
 * 
 * Rules:
 * 1. TL;DR: Look for "TL;DR" or "Key Takeaways" headers at the start.
 * 2. FAQ: Extract Q&A pairs from a "Frequently Asked Questions" section at the end.
 */
export const parseGEOContent = (markdown: string): GEOParseResult => {
    let content = markdown.trim();
    const faqs: FAQEntry[] = [];

    // 1. Check for TL;DR / Key Takeaways at the start
    // Looking for a header followed by at least 3 bullet points
    const tldrRegex = /^(?:#+|(\*\*))(?:\s*)(?:TL;DR|Key Takeaways|How it was built|Architecture Highlights|Vibe Coding Stack)(?:.*)\n(?:(?:\s*[-*+]\s+.*\n?){3,})/i;
    const hasTLDR = tldrRegex.test(content);

    // 2. Extract FAQ section
    // Look for "Frequently Asked Questions" header
    const faqHeaderRegex = /(?:^|\n)(?:#+)\s*Frequently Asked Questions\s*\n([\s\S]*)$/i;
    const faqMatch = content.match(faqHeaderRegex);

    if (faqMatch) {
        const faqSection = faqMatch[1];
        // Split by "**Q:" or "Q:" or "### Q:"
        const qnaRegex = /(?:\*\*Q:?|### Q:?|Q:?)\s*(.*?)\n(?:\*\*A:?|A:?)\s*(.*?)(?=\n(?:\*\*Q|### Q|Q)|$)/gs;

        let qnaMatch;
        while ((qnaMatch = qnaRegex.exec(faqSection)) !== null) {
            const question = qnaMatch[1].trim();
            const answer = qnaMatch[2].trim();
            if (question && answer) {
                faqs.push({ question, answer });
            }
        }

        // Optional: We could remove the FAQ section from the content if we only want it in structured data,
        // but typically it's kept in the body for human readers too.
        // For now, we keep it in the content.
    }

    return {
        content,
        faqs,
        hasTLDR
    };
};

/**
 * Provides a GEO-optimized template for the editor.
 */
export const getGEOTemplate = (title: string = "Article Title") => {
    return `# ${title}

## TL;DR / Key Takeaways
- **Key Point 1**: Concise, info-dense summary point.
- **Key Point 2**: Verifiable data or statistic (e.g. 85% of users improve X).
- **Key Point 3**: Core industry terms like **GEO** or **LLM Optimization**.

[Your high-density article content goes here. Remember to **bold** key terms.]

## Frequently Asked Questions
**Q: How does this help with AI search?**
A: By providing clear Q&A pairs and info-dense hooks, AI models can easily parse and cite your content.

**Q: What is the benefit of TL;DR sections?**
A: They provide immediate value and serve as a "direct answer" snippet for AI search results.

**Q: Can I customize these questions?**
A: Yes, ensure they are relevant to what a user might ask an AI about this topic.`;
};
