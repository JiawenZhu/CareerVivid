#!/usr/bin/env node
/**
 * CareerVivid MCP Server
 *
 * Exposes a single MCP tool — `publish_to_careervivid` — that lets AI coding
 * agents publish articles, architecture diagrams, and portfolio updates
 * directly to a user's CareerVivid account.
 *
 * Environment variables (required):
 *   CV_API_KEY  — the user's CareerVivid secret API key (cv_live_...)
 *   CV_API_URL  — publishing endpoint (default: https://careervivid.app/api/publish)
 *
 * Usage in Cursor / Claude Desktop (mcp_settings.json / cursor settings.json):
 * {
 *   "mcpServers": {
 *     "careervivid": {
 *       "command": "node",
 *       "args": ["/absolute/path/to/mcp-server/dist/index.js"],
 *       "env": {
 *         "CV_API_KEY": "cv_live_...",
 *         "CV_API_URL": "https://careervivid.app/api/publish"
 *       }
 *     }
 *   }
 * }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Read configuration from env ───────────────────────────────────────────────
const CV_API_KEY = process.env.CV_API_KEY || "";
const CV_API_URL = process.env.CV_API_URL || "https://careervivid.app/api";

if (!CV_API_KEY) {
    process.stderr.write(
        "[CareerVivid MCP] ERROR: CV_API_KEY environment variable is not set.\n" +
        "  Go to https://careervivid.app/#/developer to generate your API key.\n"
    );
    process.exit(1);
}

// ── Create MCP server ─────────────────────────────────────────────────────────
const server = new McpServer({
    name: "careervivid",
    version: "1.0.0",
});

// ── Tool: publish_to_careervivid ──────────────────────────────────────────────
server.tool(
    "publish_to_careervivid",
    // Description — shown to the LLM so it knows WHEN and HOW to call the tool
    [
        "Publish a piece of content (article, architecture diagram, or portfolio update) to the user's CareerVivid profile.",
        "Use this tool AFTER analyzing a codebase when the user asks to:",
        "  • Write and publish a tech article about their architecture, a system design, or a feature they built.",
        "  • Share a Mermaid diagram (system map, data flow, ER diagram, sequence diagram).",
        "  • Announce a portfolio project.",
        "The post will appear immediately at https://careervivid.app/community and on the user's public profile.",
    ].join("\n"),

    // Input schema
    {
        type: z.enum(["article", "whiteboard"])
            .describe("Content type. Use 'article' for written posts. Use 'whiteboard' for Mermaid diagrams or visual architecture maps."),

        dataFormat: z.enum(["markdown", "mermaid"])
            .describe(
                "Format of the 'content' field.\n" +
                "  • markdown — standard Markdown with headings, lists, code blocks.\n" +
                "  • mermaid  — a raw Mermaid diagram definition (graph LR, sequenceDiagram, etc.)."
            ),

        title: z.string().min(1).max(200)
            .describe(
                "Clear, descriptive headline for the post. " +
                "Good examples: 'How I Built a Multi-Tenant SaaS on Firebase' or 'System Architecture: Real-Time Notification Pipeline'."
            ),

        content: z.string().min(1)
            .describe(
                "The full body of the post.\n" +
                "  • For markdown: write the complete article with code blocks, explanations, and takeaways.\n" +
                "  • For mermaid: provide ONLY the Mermaid source (no surrounding markdown code fence).\n" +
                "Aim for depth — a 600–2000 word article performs best on the platform."
            ),

        tags: z.array(z.string()).max(5).optional()
            .describe(
                "Up to 5 topic tags to help readers discover the post. " +
                "Examples: ['typescript', 'firebase', 'microservices', 'system-design', 'react']."
            ),

        coverImage: z.string().url().optional()
            .describe("Optional URL to a cover image or diagram screenshot."),
    },

    // Handler
    async ({ type, dataFormat, title, content, tags, coverImage }) => {
        const payload: Record<string, unknown> = {
            type,
            dataFormat,
            title,
            content,
            tags: tags || [],
        };
        if (coverImage) payload.coverImage = coverImage;

        let responseBody: string;
        let statusCode: number;

        try {
            const response = await fetch(`${CV_API_URL}/publish`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": CV_API_KEY,
                },
                body: JSON.stringify(payload),
            });

            statusCode = response.status;
            responseBody = await response.text();

            if (response.ok) {
                let parsed: any = {};
                try { parsed = JSON.parse(responseBody); } catch { /* non-json */ }

                return {
                    content: [{
                        type: "text" as const,
                        text: [
                            `✅ Published successfully!`,
                            ``,
                            `📝 Title: ${title}`,
                            `🔗 URL: ${parsed.url || "https://careervivid.app/community"}`,
                            `🆔 Post ID: ${parsed.postId || "N/A"}`,
                            ``,
                            `The post is now live on CareerVivid and visible to the community.`,
                        ].join("\n"),
                    }],
                };
            } else {
                // Parse validation errors from the API for self-correction
                let errorDetail = responseBody;
                try {
                    const parsed = JSON.parse(responseBody);
                    if (parsed.fields) {
                        errorDetail =
                            `${parsed.error}\n\nField errors:\n` +
                            parsed.fields.map((f: any) => `  • ${f.field}: ${f.message}`).join("\n");
                    } else if (parsed.error) {
                        errorDetail = parsed.error;
                    }
                } catch { /* use raw body */ }

                return {
                    content: [{
                        type: "text" as const,
                        text: `❌ Publish failed (HTTP ${statusCode}):\n\n${errorDetail}\n\nPlease fix the issue and retry.`,
                    }],
                    isError: true,
                };
            }
        } catch (err: any) {
            return {
                content: [{
                    type: "text" as const,
                    text: `❌ Network error while publishing: ${err.message}\n\nCheck your internet connection and try again.`,
                }],
                isError: true,
            };
        }
    }
);

server.tool(
    "init_careervivid_portfolio",
    "Creates a foundational CareerVivid developer portfolio site.",
    {
        title: z.string().describe("Brand title for the portfolio"),
        templateId: z.string().optional().describe("Template ID (e.g. 'minimalist', 'developer')"),
    },
    async ({ title, templateId }) => {
        try {
            const response = await fetch(`${CV_API_URL}/portfolio/init`, {
                method: "POST", headers: { "Content-Type": "application/json", "x-api-key": CV_API_KEY },
                body: JSON.stringify({ title, templateId })
            });
            const data: any = await response.json();
            if (!response.ok) return { content: [{ type: "text" as const, text: `❌ Init failed: ${data.error}` }], isError: true };
            return { content: [{ type: "text" as const, text: `✅ Portfolio created!\nID: ${data.portfolioId}\nURL: ${data.url}` }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `❌ Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "add_project_to_portfolio",
    "Add a new case study or project to an existing portfolio. AI should use this after reading a local codebase.",
    {
        portfolioId: z.string().describe("The ID of the portfolio to update"),
        projects: z.array(z.record(z.string(), z.any())).describe("Array of project objects containing title, description, link, imageUrl, etc."),
        techStack: z.array(z.string()).optional().describe("Array of technologies used in the projects to append to the portfolio's overall tech stack"),
    },
    async ({ portfolioId, projects, techStack }) => {
        try {
            const response = await fetch(`${CV_API_URL}/portfolio/projects`, {
                method: "PATCH", headers: { "Content-Type": "application/json", "x-api-key": CV_API_KEY },
                body: JSON.stringify({ portfolioId, projects, techStack })
            });
            const data: any = await response.json();
            if (!response.ok) return { content: [{ type: "text" as const, text: `❌ Sync failed: ${data.error}` }], isError: true };
            return { content: [{ type: "text" as const, text: `✅ Projects successfully synced to portfolio ${portfolioId}!` }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `❌ Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "upload_portfolio_image",
    "Upload a base64 encoded image (e.g. UI screenshot) to the user's portfolio storage bucket.",
    {
        image: z.string().describe("Base64 encoded image string (without the data:image/png;base64, prefix)"),
        path: z.string().describe("Target file path/name (e.g. 'projects/my-app-screenshot.png')"),
        mimeType: z.string().describe("MIME type of the image (e.g. 'image/png')"),
    },
    async ({ image, path, mimeType }) => {
        try {
            const response = await fetch(`${CV_API_URL}/portfolio/assets`, {
                method: "POST", headers: { "Content-Type": "application/json", "x-api-key": CV_API_KEY },
                body: JSON.stringify({ image, path, mimeType })
            });
            const data: any = await response.json();
            if (!response.ok) return { content: [{ type: "text" as const, text: `❌ Upload failed: ${data.error}` }], isError: true };
            return { content: [{ type: "text" as const, text: `✅ Upload successful!\nURL: ${data.downloadUrl}` }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `❌ Error: ${err.message}` }], isError: true };
        }
    }
);

server.tool(
    "suggest_portfolio_theme",
    "Analyzes the project 'vibe' and instantly applies a new CSS theme to the portfolio.",
    {
        portfolioId: z.string().describe("The ID of the portfolio to update"),
        theme: z.record(z.string(), z.any()).describe("Theme object containing primaryColor, typography, and darkMode toggle"),
    },
    async ({ portfolioId, theme }) => {
        try {
            const response = await fetch(`${CV_API_URL}/portfolio/hero`, {
                method: "PATCH", headers: { "Content-Type": "application/json", "x-api-key": CV_API_KEY },
                body: JSON.stringify({ portfolioId, theme })
            });
            const data: any = await response.json();
            if (!response.ok) return { content: [{ type: "text" as const, text: `❌ Theme update failed: ${data.error}` }], isError: true };
            return { content: [{ type: "text" as const, text: `✅ Vibe theme successfully applied!` }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `❌ Error: ${err.message}` }], isError: true };
        }
    }
);

// ── Start server (stdio transport = works with Cursor, Claude Desktop, etc.) ──
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("[CareerVivid MCP] Server running. Waiting for tool calls...\n");
}

main().catch((err) => {
    process.stderr.write(`[CareerVivid MCP] Fatal error: ${err.message}\n`);
    process.exit(1);
});
