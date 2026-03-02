import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ── Bot detection ─────────────────────────────────────────────────────────────
const BOT_UA_REGEX = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|facebookexternalhit|twitterbot|linkedinbot|rogerbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkshare|w3c_validator|whatsapp|applebot|discordbot|telegrambot|redditbot|bitrixbot|xing-contenttabreceiver/i;

const isBot = (userAgent: string): boolean => BOT_UA_REGEX.test(userAgent);

// ── Cache index.html per function instance (warm requests pay ~0 overhead) ────
let cachedIndexHtml: string | null = null;

async function getIndexHtml(): Promise<string> {
    if (cachedIndexHtml) return cachedIndexHtml;
    // Fetch the static index.html — NOT subject to any hosting rewrites
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

    // Also try to get the portfolio document
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
    // Path: /whiteboard/:uid/:whiteboardId OR /whiteboard/:whiteboardId
    // Try fetching from a global collection first; fall back to user-owned
    let whiteboardData: any = null;
    let whiteboardId = parts[parts.length - 1];

    // Try direct lookup in a global whiteboards collection
    const directSnap = await db.collection("whiteboards").doc(whiteboardId).get();
    if (directSnap.exists) {
        whiteboardData = directSnap.data();
    } else if (parts.length >= 2) {
        // Try user-owned: /whiteboard/:uid/:id
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
        const routeType = parts[0]; // e.g. "community", "shared", "portfolio", "whiteboard"

        // ── Human traffic: serve the SPA's index.html directly ───────────
        // IMPORTANT: Do NOT redirect — the rewrite would re-trigger this
        // function, causing an infinite redirect loop.
        if (!isBot(ua)) {
            try {
                const indexHtml = await getIndexHtml();
                res.set("Cache-Control", "public, max-age=300, s-maxage=600");
                res.status(200).type("html").send(indexHtml);
            } catch {
                // Fallback: minimal SPA shell if index.html fetch fails
                res.status(200).type("html").send(
                    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>CareerVivid</title><script type="module" src="/assets/main.js"></script></head><body><div id="root"></div></body></html>`
                );
            }
            return;
        }

        // ── Bot traffic: generate rich HTML ──────────────────────────────
        try {
            let html: string;

            if (routeType === "community" && parts[1] === "post" && parts[2]) {
                // /community/post/:postId
                html = await handleArticle(parts[2]);

            } else if (routeType === "shared" && parts[1] && parts[2]) {
                // /shared/:uid/:resumeId
                html = await handleResume(parts[1], parts[2]);

            } else if (routeType === "portfolio" && parts[1]) {
                // /portfolio/:uid
                html = await handlePortfolio(parts[1]);

            } else if (routeType === "whiteboard") {
                // /whiteboard/:id  OR  /whiteboard/:uid/:id
                html = await handleWhiteboard(parts.slice(1));

            } else {
                // Unknown route — serve generic fallback
                res.status(404).send("Not Found");
                return;
            }

            res.set("Cache-Control", "public, max-age=300, s-maxage=600");
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
