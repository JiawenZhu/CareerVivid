---
name: seo-master
description: "SEO optimization and auditing capabilities. Validates meta tags, structured data, and performance. Generates JSON-LD. Uses Lighthouse, React Helmet, and Next SEO best practices."
---

# SEO Master - Search Engine Optimization Intelligence

Expert knowledge for auditing, implementing, and fixing SEO in React and Next.js applications.

## Capabilities

1.  **Audit**: Check pages for missing titles, descriptions, canonicals, and alt text.
2.  **Implement**: Add `react-helmet-async` or Next.js `Metadata` to pages.
3.  **Structured Data**: Generate JSON-LD (FAQ, Article, Product, JobPosting) snippets.
4.  **Performance**: Analyze Core Web Vitals (LCP, CLS, INP) concepts.

## Audit Checklist (The "SEO 100")

When asked to "audit" or "check SEO", verify:

### 1. Essential Tags
- [ ] `<title>` exists, unique, and optimal length (30-60 chars)
- [ ] `<meta name="description">` exists, unique, (50-160 chars)
- [ ] `<link rel="canonical">` points to the correct self-referencing URL
- [ ] `<meta name="robots">` is valid (index, follow usually)

### 2. Social Meta (Open Graph / Twitter)
- [ ] `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- [ ] `twitter:card` (summary_large_image preferred)

### 3. Content & Structure
- [ ] Only one `<h1>` per page
- [ ] Correct heading hierarchy (h1 -> h2 -> h3)
- [ ] Images have descriptive `alt` attributes
- [ ] Links have descriptive text (not "click here")

### 4. Technical
- [ ] **Sitemap**: `sitemap.xml` exists
- [ ] **Robots**: `robots.txt` exists and doesn't block critical resources
- [ ] **Structured Data**: Valid JSON-LD present for rich results

## Implementation Patterns

### React (SPA) - React Helmet Async
```tsx
import { Helmet } from 'react-helmet-async';

<Helmet>
  <title>Page Title</title>
  <meta name="description" content="Page description." />
  <link rel="canonical" href="https://site.com/page" />
</Helmet>
```

### Next.js (App Router) - Metadata
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description.',
  alternates: {
    canonical: 'https://site.com/page',
  },
  openGraph: { ... },
};
```

## Tools Usage

### Running Lighthouse
To run a quick audit on a deployed or local URL:
```bash
npx lighthouse <url> --view --output html --output-path ./report.html
```

### Validating Structured Data
Recommend using [Schema.org Validator](https://validator.schema.org/) or [Google Rich Results Test](https://search.google.com/test/rich-results).
