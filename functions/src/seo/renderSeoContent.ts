import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { isbot } from "isbot";
import { algoliasearch } from "algoliasearch";

const db = admin.firestore();

// ── Cache index.html per function instance (warm requests pay ~0 overhead) ────
let cachedIndexHtml: string | null = null;

async function getIndexHtml(): Promise<string> {
    if (cachedIndexHtml) return cachedIndexHtml;
    const response = await fetch("https://careervivid.app/index.html", {
        headers: { "X-Internal-Fetch": "1" }
    });
    if (!response.ok) throw new Error(`Failed to fetch index.html: ${response.status}`);
    cachedIndexHtml = await response.text();
    return cachedIndexHtml;
}

// ── Shared helpers ────────────────────────────────────────────────────────────
const DEFAULT_OG_IMAGE = "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Fog_image.png?alt=media";
const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media";
const BASE_URL = "https://careervivid.app";

const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const stripMarkdown = (md: string): string => (md || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#_*`[\]>~]/g, "")
    .replace(/\n+/g, " ")
    .trim();

const buildHtml = ({
    title, description, canonicalUrl, imageUrl, structuredData, bodyContent, siteSuffix
}: {
    title: string; description: string; canonicalUrl: string; imageUrl: string;
    structuredData: object; bodyContent: string; siteSuffix: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} | ${esc(siteSuffix)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="icon" href="${LOGO_URL}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="CareerVivid" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>

  <!-- SPA Bootstrap (human visitors rendered by React after this) -->
  <script type="module" src="/assets/main.js"></script>
</head>
<body>
  <!-- SEO Content: visible to crawlers, React replaces this on load -->
  <div id="root">
    <main style="max-width:780px;margin:0 auto;padding:48px 24px;font-family:sans-serif;color:#111;">
      ${bodyContent}
    </main>
  </div>
</body>
</html>`;

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleArticle(postId: string): Promise<string> {
    const snap = await db.collection("community_posts").doc(postId).get();
    if (!snap.exists) throw new Error("not_found");
    const post = snap.data() as any;

    const title = post.title || "CareerVivid Article";
    const rawContent = stripMarkdown(post.content || "");
    const description = rawContent.substring(0, 160) || "Read this article on CareerVivid Community.";
    const imageUrl = post.coverImage || DEFAULT_OG_IMAGE;
    const canonicalUrl = `${BASE_URL}/community/post/${postId}`;
    const publishDate = post.createdAt?.toDate?.().toISOString() ?? new Date().toISOString();

    // Extract FAQs
    const faqs: any[] = [];
    const faqMatch = (post.content || "").match(/(?:^|\n)(?:#+)\s*Frequently Asked Questions\s*\n([\s\S]*)$/i);
    if (faqMatch) {
        const qnaRegex = /(?:\*\*Q:?|### Q:?|Q:?)\s*(.*?)\n(?:\*\*A:?|A:?)\s*(.*?)(?=\n(?:\*\*Q|### Q|Q)|$)/gs;
        let m;
        while ((m = qnaRegex.exec(faqMatch[1])) !== null) {
            if (m[1] && m[2]) faqs.push({ "@type": "Question", "name": m[1].trim(), "acceptedAnswer": { "@type": "Answer", "text": m[2].trim() } });
        }
    }

    const structuredData: any = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "@id": `${canonicalUrl}#article`,
                headline: title.substring(0, 110),
                description,
                image: [imageUrl],
                datePublished: publishDate,
                author: { "@type": "Person", name: post.authorName || "CareerVivid Community" },
                publisher: { "@type": "Organization", name: "CareerVivid", logo: { "@type": "ImageObject", url: LOGO_URL } },
            }
        ]
    };
    if (faqs.length > 0) {
        structuredData["@graph"].push({ "@type": "FAQPage", "@id": `${canonicalUrl}#faq`, mainEntity: faqs });
    }

    const tags = (post.tags || []).map((t: string) => `<span style="margin-right:8px;color:#6366f1;">#${esc(t)}</span>`).join("");
    const bodyContent = `
        <h1 style="font-size:2.25rem;font-weight:800;line-height:1.2;margin-bottom:16px;">${esc(title)}</h1>
        ${tags ? `<p style="margin-bottom:16px;">${tags}</p>` : ""}
        <p style="font-size:1.1rem;color:#555;margin-bottom:24px;">${esc(description)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:0.95rem;color:#777;line-height:1.7;">${esc(rawContent.substring(0, 2000))}</p>
    `;

    return buildHtml({ title, description, canonicalUrl, imageUrl, structuredData, bodyContent, siteSuffix: "CareerVivid Community" });
}

async function handleResume(uid: string, resumeId: string): Promise<string> {
    const snap = await db.collection("users").doc(uid).collection("resumes").doc(resumeId).get();
    if (!snap.exists) throw new Error("not_found");
    const resume = snap.data() as any;
    const pd = resume.personalDetails || {};

    const fullName = `${pd.firstName || ""} ${pd.lastName || ""}`.trim() || "CareerVivid Resume";
    const jobTitle = pd.jobTitle || "";
    const title = jobTitle ? `${fullName} – ${jobTitle}` : fullName;
    const summary = stripMarkdown(resume.professionalSummary || "");
    const description = summary.substring(0, 160) || `View ${fullName}'s professional resume on CareerVivid.`;
    const imageUrl = pd.photo || DEFAULT_OG_IMAGE;
    const canonicalUrl = `${BASE_URL}/shared/${uid}/${resumeId}`;

    const skills = (resume.skills || []).map((s: any) => esc(s.name)).join(", ");
    const jobs = (resume.employmentHistory || []).slice(0, 3).map((j: any) =>
        `<li><strong>${esc(j.jobTitle)}</strong> at ${esc(j.employer)} (${esc(j.startDate)} – ${esc(j.endDate || "Present")})</li>`
    ).join("");

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: `${fullName}'s Resume`,
        url: canonicalUrl,
        mainEntity: {
            "@type": "Person",
            name: fullName,
            jobTitle,
            description: summary.substring(0, 200),
        }
    };

    const bodyContent = `
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:8px;">${esc(fullName)}</h1>
        ${jobTitle ? `<p style="font-size:1.1rem;color:#6366f1;font-weight:600;margin-bottom:16px;">${esc(jobTitle)}</p>` : ""}
        ${description ? `<p style="font-size:0.95rem;color:#555;margin-bottom:24px;">${esc(description)}</p>` : ""}
        ${skills ? `<p><strong>Skills:</strong> ${skills}</p>` : ""}
        ${jobs ? `<h2 style="font-size:1.1rem;font-weight:700;margin-top:24px;">Experience</h2><ul style="padding-left:20px;">${jobs}</ul>` : ""}
    `;

    return buildHtml({ title, description, canonicalUrl, imageUrl, structuredData, bodyContent, siteSuffix: "CareerVivid Resume" });
}

async function handlePortfolio(uid: string): Promise<string> {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) throw new Error("not_found");
    const user = snap.data() as any;

    const portfolioSnap = await db.collection("users").doc(uid).collection("portfolio").limit(1).get();
    const portfolio = portfolioSnap.empty ? null : portfolioSnap.docs[0].data() as any;

    const name = user.displayName || portfolio?.personalInfo?.name || "CareerVivid Portfolio";
    const bio = portfolio?.personalInfo?.bio || user.bio || "";
    const title = `${name} – Portfolio`;
    const description = stripMarkdown(bio).substring(0, 160) || `View ${name}'s professional portfolio on CareerVivid.`;
    const imageUrl = user.photoURL || portfolio?.personalInfo?.avatar || DEFAULT_OG_IMAGE;
    const canonicalUrl = `${BASE_URL}/portfolio/${uid}`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: `${name}'s Portfolio`,
        url: canonicalUrl,
        mainEntity: {
            "@type": "Person",
            name,
            description: description,
            image: imageUrl,
        }
    };

    const bodyContent = `
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:16px;">${esc(name)}</h1>
        ${description ? `<p style="font-size:1.05rem;color:#555;line-height:1.7;">${esc(description)}</p>` : ""}
    `;

    return buildHtml({ title, description, canonicalUrl, imageUrl, structuredData, bodyContent, siteSuffix: "CareerVivid Portfolio" });
}

async function handleWhiteboard(parts: string[]): Promise<string> {
    let whiteboardData: any = null;
    const whiteboardId = parts[parts.length - 1];

    const directSnap = await db.collection("whiteboards").doc(whiteboardId).get();
    if (directSnap.exists) {
        whiteboardData = directSnap.data();
    } else if (parts.length >= 2) {
        const uid = parts[parts.length - 2];
        const userSnap = await db.collection("users").doc(uid).collection("whiteboards").doc(whiteboardId).get();
        if (userSnap.exists) whiteboardData = userSnap.data();
    }

    if (!whiteboardData) throw new Error("not_found");

    const title = whiteboardData.title || "CareerVivid Whiteboard";
    const description = stripMarkdown(whiteboardData.description || "").substring(0, 160) || `View this whiteboard on CareerVivid.`;
    const imageUrl = whiteboardData.thumbnailUrl || DEFAULT_OG_IMAGE;
    const canonicalUrl = `${BASE_URL}/whiteboard/${whiteboardId}`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url: canonicalUrl,
        image: imageUrl,
    };

    const bodyContent = `
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:16px;">${esc(title)}</h1>
        ${description ? `<p style="font-size:1.05rem;color:#555;line-height:1.7;">${esc(description)}</p>` : ""}
    `;

    return buildHtml({ title, description, canonicalUrl, imageUrl, structuredData, bodyContent, siteSuffix: "CareerVivid Whiteboard" });
}

// ── Community feed handler — serves a semantic article list to AI bots ────────
async function handleCommunityFeed(): Promise<string> {
    const appId = process.env.ALGOLIA_APP_ID;
    const searchKey = process.env.ALGOLIA_SEARCH_KEY;

    let articles: { id: string; title: string; author: string; snippet: string }[] = [];

    if (appId && searchKey) {
        try {
            const client = algoliasearch(appId, searchKey);
            const result = await client.search({
                requests: [{
                    indexName: "community_posts",
                    query: "",
                    hitsPerPage: 20,
                    attributesToRetrieve: ["objectID", "title", "authorName", "content", "type"],
                }]
            });
            const firstResult = (result.results[0] as any);
            const hits: any[] = firstResult?.hits ?? [];
            articles = hits
                .filter((h: any) => !h.type || h.type === "article")
                .map((h: any) => ({
                    id: h.objectID,
                    title: (h.title || "Untitled Article").trim(),
                    author: h.authorName || "CareerVivid Community",
                    snippet: stripMarkdown(h.content || "").substring(0, 120),
                }));
        } catch (err) {
            console.warn("[handleCommunityFeed] Algolia query failed:", err);
        }
    } else {
        console.warn("[handleCommunityFeed] Missing ALGOLIA_APP_ID or ALGOLIA_SEARCH_KEY.");
    }

    const title = "CareerVivid Community – Career Articles & Resources";
    const description = "Explore the latest career advice, resume tips, portfolio showcases, and professional development articles from the CareerVivid community.";
    const canonicalUrl = `${BASE_URL}/community`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: canonicalUrl,
        publisher: { "@type": "Organization", name: "CareerVivid", logo: { "@type": "ImageObject", url: LOGO_URL } },
        hasPart: articles.map(a => ({
            "@type": "Article",
            name: a.title,
            url: `${BASE_URL}/community/post/${a.id}`,
            author: { "@type": "Person", name: a.author },
        }))
    };

    const listItems = articles.length > 0
        ? articles.map(a => `
    <li style="padding:14px 0;border-bottom:1px solid #f0f0f0;">
      <a href="${BASE_URL}/community/post/${esc(a.id)}" style="font-size:1rem;font-weight:600;color:#4f46e5;text-decoration:none;">
        ${esc(a.title)}
      </a>
      <p style="margin:4px 0 0;font-size:0.85rem;color:#888;">${esc(a.author)}${a.snippet ? " · " + esc(a.snippet) + "…" : ""}</p>
    </li>`).join("")
        : `<li style="color:#888;padding:16px 0;">No articles found.</li>`;

    const bodyContent = `
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:8px;">${esc(title)}</h1>
        <p style="font-size:1rem;color:#555;margin-bottom:24px;">${esc(description)}</p>
        <ul style="list-style:none;padding:0;margin:0;">${listItems}
        </ul>
        <p style="margin-top:24px;font-size:0.85rem;color:#aaa;">
          <a href="${BASE_URL}/community" style="color:#4f46e5;">View all articles →</a>
        </p>`;

    return buildHtml({ title, description, canonicalUrl, imageUrl: DEFAULT_OG_IMAGE, structuredData, bodyContent, siteSuffix: "CareerVivid" });
}

// ── Main Function ─────────────────────────────────────────────────────────────
export const renderSeoContent = onRequest(
    {
        region: "us-west1",
        memory: "256MiB",
        timeoutSeconds: 30,
    },
    async (req, res) => {
        const ua = (req.headers["user-agent"] || "").toString();
        const path = req.path || "/";
        const parts = path.replace(/^\//, "").split("/");
        
        let language = "en";
        let routeParts = parts;

        // Check for language prefix (e.g., /zh/community/...)
        const SUPPORTED_LANGS = ["es", "fr", "de", "zh", "ja", "ko"];
        if (SUPPORTED_LANGS.includes(parts[0])) {
            language = parts[0];
            routeParts = parts.slice(1);
        }

        const routeType = routeParts[0]; // e.g. "community", "shared", "portfolio", "whiteboard"

        // ── Human traffic: serve the SPA's index.html directly ───────────
        if (!isbot(ua)) {
            try {
                const indexHtml = await getIndexHtml();
                // Inject language to html tag if needed, but SPA usually handles this
                res.set("Cache-Control", "public, max-age=300, s-maxage=600");
                res.status(200).type("html").send(indexHtml);
            } catch {
                res.status(200).type("html").send(
                    `<!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>CareerVivid</title><script type="module" src="/assets/main.js"></script></head><body><div id="root"></div></body></html>`
                );
            }
            return;
        }

        // ── Bot traffic: generate rich HTML ──────────────────────────────
        try {
            let html: string;

            if (routeType === "community" && routeParts[1] === "post" && routeParts[2]) {
                html = await handleArticle(routeParts[2]);
            } else if (routeType === "community" && !routeParts[1]) {
                html = await handleCommunityFeed();
            } else if (routeType === "shared" && routeParts[1] && routeParts[2]) {
                html = await handleResume(routeParts[1], routeParts[2]);
            } else if (routeType === "portfolio" && routeParts[1]) {
                html = await handlePortfolio(routeParts[1]);
            } else if (routeType === "whiteboard") {
                html = await handleWhiteboard(routeParts.slice(1));
            } else {
                res.status(404).send("Not Found");
                return;
            }

            // Set the correct lang attribute in the generated HTML
            html = html.replace('<html lang="en">', `<html lang="${language}">`);

            // Default cache: 5 min client, 10 min CDN
            if (!res.getHeader("Cache-Control")) {
                res.set("Cache-Control", "public, max-age=300, s-maxage=600");
            }
            res.set("X-Rendered-By", "renderSeoContent");
            res.status(200).type("html").send(html);

        } catch (err: any) {
            if (err.message === "not_found") {
                res.status(404).send("Content not found.");
            } else {
                console.error("[renderSeoContent] Error:", err);
                res.status(500).send("Internal Server Error");
            }
        }
    }
);
