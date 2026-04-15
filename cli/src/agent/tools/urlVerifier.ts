/**
 * urlVerifier.ts — URL safety & reachability checker for the CareerVivid Job Agent.
 *
 * Harness Engineering Mindset:
 *   The agent must think like a real user clicking a link. A 98%-match job means
 *   nothing if the URL is broken, hallucinated, or redirects to a homepage.
 *   Every URL we return to the user must pass this verification harness BEFORE
 *   we present it.
 *
 * The harness performs layered checks:
 *   1. Structural validity — is this even a parseable URL?
 *   2. Domain plausibility — does this look like a real company domain?
 *   3. HTTP reachability — does it respond with 200/301/302?
 *   4. Content sanity   — does the final page look like a real job listing?
 *   5. ATS legitimacy   — is it on a known ATS (Ashby, Greenhouse, Lever, etc.)?
 */

import { Tool } from "../Tool.js";
import { Type } from "@google/genai";

// ── Known ATS domains that are always trustworthy ─────────────────────────────
const TRUSTED_ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workday.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "icims.com",
  "smartrecruiters.com",
  "jobvite.com",
  "taleo.net",
  "oracle.com",
  "brassring.com",
  "successfactors.com",
  "linkedin.com/jobs",
  "indeed.com",
  "careers.google.com",
  "jobs.microsoft.com",
  "amazon.jobs",
  "meta.com/careers",
  "apple.com/jobs",
  "openai.com/careers",
  "anthropic.com/careers",
  "jobs.ashbyhq.com",
  "boards.greenhouse.io",
  "apply.workable.com",
  "recruitee.com",
  "bamboohr.com",
  "rippling.com",
  "ripplinghq.com",
];

// ── Suspicious patterns — usually hallucinated or spam ────────────────────────
const SUSPICIOUS_PATTERNS = [
  /localhost/i,
  /127\.0\.0\./,
  /example\.(com|org|net)/i,
  /test\.(com|org)/i,
  /careers\.(io|app|xyz|online|site|info|biz)$/i, // generic TLDs on "careers" domains
  /jobs\.(io|app|xyz|online|site|info|biz)$/i,
];

export interface UrlVerificationResult {
  url: string;
  ok: boolean;
  status?: number;
  finalUrl?: string;            // after redirects
  isTrustedAts: boolean;
  redirected: boolean;
  reason: string;               // human-readable verdict
  warning?: string;             // show to user if suspicious
}

/**
 * Verify a single URL is reachable and looks like a legitimate job posting.
 * Uses harness-engineering thinking: emulate a real user clicking the link.
 */
export async function verifyUrl(url: string): Promise<UrlVerificationResult> {
  // ── 1. Structural check ───────────────────────────────────────────────────
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      url, ok: false, isTrustedAts: false, redirected: false,
      reason: `❌ Malformed URL — not a valid link: "${url}"`,
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      url, ok: false, isTrustedAts: false, redirected: false,
      reason: `❌ Non-HTTP URL — cannot open in browser: "${url}"`,
    };
  }

  // ── 2. Suspicious pattern check ───────────────────────────────────────────
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      return {
        url, ok: false, isTrustedAts: false, redirected: false,
        reason: `❌ URL looks hallucinated or is a placeholder domain: "${url}"`,
        warning: "This URL matches a known fake/test domain pattern.",
      };
    }
  }

  // ── 3. Trusted ATS domain shortcut ───────────────────────────────────────
  const isTrustedAts = TRUSTED_ATS_DOMAINS.some(
    (d) => parsed.hostname.includes(d) || url.includes(d)
  );

  // ── 4. HTTP reachability (HEAD → GET fallback) ────────────────────────────
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    let res: Response;
    let finalUrl = url;

    try {
      res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
      finalUrl = res.url;
    } catch {
      // HEAD blocked — try GET (some servers reject HEAD)
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
      finalUrl = res.url;
    }

    const status = res.status;
    const redirected = finalUrl !== url;

    // ── 5. Content sanity — did we land on a real page? ────────────────────
    if (status === 404) {
      return {
        url, ok: false, status, finalUrl, isTrustedAts, redirected,
        reason: `❌ Page not found (404) — this job posting may have been removed or the URL is incorrect.`,
      };
    }

    if (status === 403 || status === 401) {
      // Could be a valid page behind auth — treat as uncertain but not broken
      return {
        url, ok: true, status, finalUrl, isTrustedAts, redirected,
        reason: `⚠️ Page requires authentication (${status}) — link may be valid but access restricted.`,
        warning: "User may need to log in to view this posting.",
      };
    }

    if (status >= 500) {
      return {
        url, ok: false, status, finalUrl, isTrustedAts, redirected,
        reason: `❌ Server error (${status}) — the job site is having issues. Try again later.`,
      };
    }

    // Check if we got redirected to a homepage (common when job is removed)
    if (redirected) {
      const finalParsed = new URL(finalUrl);
      const landedOnHomepage =
        finalParsed.pathname === "/" ||
        finalParsed.pathname === "" ||
        finalParsed.pathname === "/careers" ||
        finalParsed.pathname === "/jobs";

      if (landedOnHomepage && !isTrustedAts) {
        return {
          url, ok: false, status, finalUrl, isTrustedAts, redirected,
          reason: `❌ URL redirects to homepage (${finalUrl}) — job posting likely no longer exists.`,
          warning: "This job posting may have been removed.",
        };
      }
    }

    if (status >= 200 && status < 400) {
      let contentWarning: string | undefined;

      // ── 5. Content sanity — does the page look like a job posting? ────────
      // Only run for non-ATS URLs (ATS pages are always jobs, GET-ing them is slow)
      if (!isTrustedAts && res.bodyUsed === false) {
        try {
          // Re-fetch with GET to get body (HEAD gives no body)
          const bodyRes = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
          });
          const body = (await bodyRes.text()).toLowerCase();

          const JOB_SIGNALS = [
            "apply", "job description", "responsibilities", "requirements",
            "qualifications", "salary", "full-time", "part-time", "remote",
            "position", "role", "candidate", "experience", "interview",
            "benefits", "compensation",
          ];
          const signalCount = JOB_SIGNALS.filter(s => body.includes(s)).length;
          if (signalCount < 2) {
            contentWarning = `Page at ${finalUrl || url} lacks typical job-posting keywords — may redirect to homepage or be an error page.`;
          }
        } catch {
          // Content check failed (timeout, etc.) — don't block on this
        }
      }

      const verdict = isTrustedAts
        ? `✅ Verified — reachable on trusted ATS (${parsed.hostname})`
        : `✅ Reachable (status ${status})${redirected ? ` → redirected to ${finalUrl}` : ""}`;

      return {
        url, ok: true, status, finalUrl, isTrustedAts, redirected,
        reason: verdict,
        warning: contentWarning,
      };
    }

    return {
      url, ok: false, status, finalUrl, isTrustedAts, redirected,
      reason: `❌ Unexpected HTTP status: ${status}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort") || msg.includes("timeout");
    return {
      url, ok: false, isTrustedAts, redirected: false,
      reason: isTimeout
        ? `❌ Connection timed out (>8s) — site may be down or the URL is unreachable.`
        : `❌ Network error: ${msg}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verify a batch of URLs in parallel (max 5 concurrent).
 * Returns results in the same order as input.
 */
export async function verifyUrlBatch(
  urls: string[]
): Promise<UrlVerificationResult[]> {
  const CONCURRENCY = 5;
  const results: UrlVerificationResult[] = new Array(urls.length);

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((u) => verifyUrl(u)));
    batchResults.forEach((r, j) => {
      results[i + j] = r;
    });
  }

  return results;
}

// ── Tool: verify_url ─────────────────────────────────────────────────────────

export const VerifyUrlTool: Tool = {
  name: "verify_url",
  description: `Verify that a URL is actually reachable and looks like a real job posting before showing it to the user.

HARNESS ENGINEERING RULE: You MUST call this tool before presenting any job URL to the user.
Think like a user clicking a link — a broken or hallucinated URL wastes their time and destroys trust.

Use this tool when:
- You have a job URL from search_jobs or any other source
- You are about to tell the user "here is the link to apply"
- You suspect a URL might be invalid, outdated, or hallucinated
- You want to confirm a job is still accepting applications

This tool checks: URL validity, HTTP reachability, redirect detection, homepage-redirect detection,
and whether the URL is on a trusted ATS (Ashby, Greenhouse, Lever, etc.).`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full URL to verify (must start with http:// or https://).",
      },
    },
    required: ["url"],
  },
  execute: async (args: { url: string }) => {
    const result = await verifyUrl(args.url);

    const lines: string[] = [result.reason];

    if (result.redirected && result.finalUrl) {
      lines.push(`   Redirected to: ${result.finalUrl}`);
    }
    if (result.isTrustedAts) {
      lines.push(`   ✓ Trusted ATS domain — application form should be available`);
    }
    if (result.warning) {
      lines.push(`   ⚠️  ${result.warning}`);
    }

    if (!result.ok) {
      lines.push(
        `\nAgent Instruction: Do NOT show this URL to the user — it is broken or unreachable.`,
        `Instead, tell the user you couldn't verify the application link and suggest they`,
        `search for the job directly on the company's careers page or LinkedIn.`
      );
    }

    return lines.join("\n");
  },
};

// ── Tool: verify_search_results ──────────────────────────────────────────────

export const VerifySearchResultsTool: Tool = {
  name: "verify_job_urls",
  description: `Verify a batch of job URLs returned from search_jobs are all reachable.
Use this after search_jobs to filter out dead or hallucinated links before showing results to the user.
Returns a summary of which URLs passed and which failed, so you can present only working links.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      urls: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of job URLs to verify in parallel.",
      },
    },
    required: ["urls"],
  },
  execute: async (args: { urls: string[] }) => {
    if (!args.urls || args.urls.length === 0) {
      return "No URLs provided to verify.";
    }

    const results = await verifyUrlBatch(args.urls);

    const passed = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    const lines: string[] = [
      `URL Verification Results (${passed.length}/${results.length} passed):\n`,
    ];

    for (const r of results) {
      lines.push(`${r.ok ? "✅" : "❌"} ${r.url}`);
      lines.push(`   ${r.reason}`);
      if (r.warning) lines.push(`   ⚠️  ${r.warning}`);
    }

    if (failed.length > 0) {
      lines.push(
        `\nAgent Instruction: Only show the ${passed.length} passing URLs to the user.`,
        `For the ${failed.length} failed URL(s), do NOT include them in your response.`,
        `If too many failed, tell the user you couldn't verify all links and suggest`,
        `they search directly on LinkedIn or the company careers page.`
      );
    } else {
      lines.push(`\nAll URLs verified successfully — safe to show to the user.`);
    }

    return lines.join("\n");
  },
};

export const ALL_URL_VERIFIER_TOOLS: Tool[] = [
  VerifyUrlTool,
  VerifySearchResultsTool,
];
