import { onRequest } from "firebase-functions/v2/https";
import { algoliasearch } from "algoliasearch";

const BASE_URL = "https://careervivid.app";
const INDEX_NAME = "community_posts";
const STATIC_LASTMOD = "2026-06-01";
const INCLUDE_DYNAMIC_SITEMAP_URLS = process.env.INCLUDE_DYNAMIC_SITEMAP_URLS === "true";
const DYNAMIC_SITEMAP_URL_LIMIT = Number.parseInt(process.env.DYNAMIC_SITEMAP_URL_LIMIT || "25", 10);

type SitemapRoute = {
    loc: string;
    changefreq: string;
    priority: string;
    lastmod?: string;
};

const xmlEsc = (s: string) =>
    (s || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&apos;");

const toIsoDate = (ts: number | string | undefined): string => {
    if (!ts) return new Date().toISOString().split("T")[0];
    const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
    return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
};

const toPlainText = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
    return JSON.stringify(value).replace(/\s+/g, " ").trim();
};

const isPublicIndexableHit = (hit: any): boolean => {
    const type = String(hit.type || "article").toLowerCase();
    const status = String(hit.status || "").toLowerCase();
    const visibility = String(hit.visibility || "").toLowerCase();

    if (type !== "article") return false;
    if (hit.isPublic === false || hit.noindex === true || hit.seoIndexable === false) return false;
    if (visibility === "private" || visibility === "draft") return false;
    if (["draft", "private", "deleted", "archived", "soft_deleted"].includes(status)) return false;

    const title = toPlainText(hit.title);
    const content = toPlainText(hit.content || hit.summary || hit.description || hit.excerpt);
    return title.length >= 12 && content.length >= 300;
};

const hitToUrl = (hit: any): string | null => {
    const id: string = hit.objectID;
    if (!id || !isPublicIndexableHit(hit)) return null;
    return `${BASE_URL}/community/post/${id}`;
};

const STATIC_ROUTES: SitemapRoute[] = [
    { loc: BASE_URL, changefreq: "daily", priority: "1.0", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/community`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/pricing`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/blog`, changefreq: "weekly", priority: "0.7", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/extension-welcome`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/agency`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/business`, changefreq: "weekly", priority: "0.7", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/academic`, changefreq: "weekly", priority: "0.7", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/hiring`, changefreq: "weekly", priority: "0.7", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/students`, changefreq: "weekly", priority: "0.7", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/partners/apply`, changefreq: "weekly", priority: "0.6", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/topic/ai-job-search-workspace`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/topic/chrome-extension-job-autofill`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/topic/ai-resume-builder-job-tracker`, changefreq: "weekly", priority: "0.8", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/contact`, changefreq: "monthly", priority: "0.6", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/product`, changefreq: "monthly", priority: "0.6", lastmod: STATIC_LASTMOD },
    { loc: `${BASE_URL}/community/guidelines`, changefreq: "monthly", priority: "0.5", lastmod: STATIC_LASTMOD },
];

// Add localized versions for each static route (excluding root which handles 'en' by default)
const SUPPORTED_LANGUAGE_CODES = ["es", "fr", "de", "zh", "ja", "ko"];

const LOCALIZED_STATIC_ROUTES = SUPPORTED_LANGUAGE_CODES.flatMap(code => {
    return STATIC_ROUTES.map(route => {
        const path = route.loc.replace(BASE_URL, "");
        // If it's the home page, just /lang
        const loc = path === "" ? `${BASE_URL}/${code}` : `${BASE_URL}/${code}${path}`;
        return {
            ...route,
            loc,
            priority: (parseFloat(route.priority) * 0.9).toFixed(1) // slightly lower priority for localized versions
        };
    });
});

const ALL_STATIC_ROUTES: SitemapRoute[] = [...STATIC_ROUTES, ...LOCALIZED_STATIC_ROUTES];

export const generateSitemap = onRequest(
    {
        region: "us-west1",
        memory: "256MiB",
        timeoutSeconds: 60,
    },
    async (_req, res) => {
        try {
            const appId = process.env.ALGOLIA_APP_ID;
            // Use the write/admin key for browseObjects — requires 'browse' ACL
            // which the search-only key doesn't have.
            const writeKey = process.env.ALGOLIA_WRITE_KEY;

            const urlEntries: string[] = [];

            // 1. Static routes
            for (const route of ALL_STATIC_ROUTES) {
                urlEntries.push(`
  <url>
    <loc>${xmlEsc(route.loc)}</loc>
    ${route.lastmod ? `<lastmod>${route.lastmod}</lastmod>` : ""}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
            }

            // 2. Optional dynamic routes.
            //
            // Search Console showed "Discovered - currently not indexed" for
            // generated community URLs submitted through /sitemap.xml. Keep the
            // primary sitemap focused on stable, high-value public routes unless
            // we explicitly opt back into a small curated dynamic set.
            if (INCLUDE_DYNAMIC_SITEMAP_URLS && appId && writeKey) {
                const client = algoliasearch(appId, writeKey);
                const seenUrls = new Set<string>();
                const dynamicLimit = Number.isFinite(DYNAMIC_SITEMAP_URL_LIMIT)
                    ? Math.max(DYNAMIC_SITEMAP_URL_LIMIT, 0)
                    : 25;

                await client.browseObjects({
                    indexName: INDEX_NAME,
                    aggregator: (response: any) => {
                        const hits: any[] = response.hits || [];
                        for (const hit of hits) {
                            if (seenUrls.size >= dynamicLimit) break;
                            const url = hitToUrl(hit);
                            if (!url || seenUrls.has(url)) continue;
                            seenUrls.add(url);

                            const lastmod = toIsoDate(hit.updatedAt || hit.createdAt);
                            urlEntries.push(`
  <url>
    <loc>${xmlEsc(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
                        }
                    },
                });

                console.log(`[generateSitemap] ${seenUrls.size} curated dynamic + ${ALL_STATIC_ROUTES.length} static URLs.`);
            } else if (INCLUDE_DYNAMIC_SITEMAP_URLS) {
                console.warn("[generateSitemap] Missing Algolia credentials — serving static-only sitemap.");
            } else {
                console.log("[generateSitemap] Dynamic sitemap URLs disabled — serving static-only sitemap for Search Console quality.");
            }

            // 3. Build XML
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("")}
</urlset>`;

            res.set("Content-Type", "application/xml; charset=utf-8");
            res.set("Cache-Control", "public, max-age=21600, s-maxage=43200");
            res.status(200).send(xml);

        } catch (err) {
            console.error("[generateSitemap] Error:", err);
            res.status(500).send("Failed to generate sitemap.");
        }
    }
);
