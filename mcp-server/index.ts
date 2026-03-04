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
const CV_API_URL = process.env.CV_API_URL || "https://careervivid.app/api/publish";

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
            const response = await fetch(CV_API_URL, {
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
