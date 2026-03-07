/**
 * cv publish — publish content to CareerVivid
 *
 * Usage:
 *   cv publish <file>                     Publish a file
 *   cv publish -                          Read from stdin
 *   cv publish README.md --title "..."    Override title
 *   cv publish arch.mmd --type whiteboard --format mermaid
 *   cv publish - --dry-run < article.md  Validate without publishing
 *   cv publish - --json < article.md     Agent-friendly JSON output
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import { extname } from "path";
import chalk from "chalk";
import ora from "ora";
import type { PublishPayload, DataFormat, PostType } from "../api.js";
import { publishPost, isApiError } from "../api.js";
import { printError, printSuccess, handleApiError } from "../output.js";

function inferFormat(filePath: string): DataFormat {
    const ext = extname(filePath).toLowerCase();
    if ([".mmd", ".mermaid"].includes(ext)) return "mermaid";
    return "markdown";
}

function inferType(format: DataFormat): PostType {
    return format === "mermaid" ? "whiteboard" : "article";
}

async function readStdin(): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
}

export function registerPublishCommand(program: Command): void {
    program
        .command("publish [file]")
        .description(
            [
                "Publish a markdown or mermaid file to CareerVivid",
                "",
                "  cv publish article.md",
                "  cv publish diagram.mmd --type whiteboard",
                "  cat article.md | cv publish - --title \"My Article\" --json",
            ].join("\n")
        )
        .option("-t, --title <title>", "Post title (inferred from first heading if omitted)")
        .option(
            "--type <type>",
            "Post type: article | whiteboard (default: inferred from format)",
        )
        .option(
            "--format <format>",
            "Content format: markdown | mermaid (default: inferred from file extension)"
        )
        .option("--tags <tags>", "Comma-separated tags, e.g. typescript,firebase,react")
        .option("--cover <url>", "URL to a cover image")
        .option("--official", "Publish as CareerVivid Community (admin only)")
        .option("--dry-run", "Validate payload without publishing")
        .option("--json", "Machine-readable JSON output")
        .action(
            async (
                fileArg: string | undefined,
                opts: {
                    title?: string;
                    type?: string;
                    format?: string;
                    tags?: string;
                    cover?: string;
                    official?: boolean;
                    dryRun?: boolean;
                    json?: boolean;
                }
            ) => {

                const jsonMode = !!opts.json;
                const dryRun = !!opts.dryRun;

                // ── Read content ────────────────────────────────────────────────────────
                let content: string;
                let filePath: string;

                if (!fileArg || fileArg === "-") {
                    if (!jsonMode) {
                        console.log(`  ${chalk.dim("Reading from stdin... (Ctrl+D to finish)")}`);
                    }
                    content = await readStdin();
                    filePath = "stdin";
                } else {
                    try {
                        content = readFileSync(fileArg, "utf-8");
                        filePath = fileArg;
                    } catch (err: any) {
                        printError(`Cannot read file: ${err.message}`, undefined, jsonMode);
                        process.exit(1);
                    }
                }

                if (!content.trim()) {
                    printError("Content is empty.", undefined, jsonMode);
                    process.exit(1);
                }

                // ── Infer format and type ───────────────────────────────────────────────
                const format: DataFormat =
                    (opts.format as DataFormat) ||
                    (filePath !== "stdin" ? inferFormat(filePath) : "markdown");

                const type: PostType =
                    (opts.type as PostType) || inferType(format);

                // ── Infer title from first heading if not provided ─────────────────────
                let title: string = opts.title || "";
                if (!title && format === "markdown") {
                    const firstHeading = content.match(/^#\s+(.+)$/m);
                    if (firstHeading) {
                        title = firstHeading[1].trim();
                    }
                }

                if (!title) {
                    if (jsonMode) {
                        printError(
                            "Title is required. Use --title <title> or add a # heading in your markdown.",
                            undefined,
                            true
                        );
                        process.exit(1);
                    }

                    // Interactive prompt fallback
                    const enquirer = (await import("enquirer")) as any;
                    const prompt = enquirer.default?.prompt || enquirer.prompt;
                    const answers = await prompt({
                        type: "input",
                        name: "title",
                        message: "Post title",
                    });
                    title = (answers as any).title.trim();
                }

                // ── Build payload ──────────────────────────────────────────────────────
                const tags = opts.tags
                    ? opts.tags.split(",").map((t) => t.trim()).filter(Boolean)
                    : [];

                if (tags.length > 5) {
                    printError("Maximum 5 tags allowed.", undefined, jsonMode);
                    process.exit(1);
                }

                const isOfficialPost = !!opts.official;

                if (isOfficialPost && !jsonMode) {
                    console.log(`\n  ${chalk.yellow("★")}  ${chalk.bold("Publishing as")} ${chalk.cyan("CareerVivid Community")} ${chalk.dim("(official post)")}`);
                }

                const payload: PublishPayload = {
                    type,
                    dataFormat: format,
                    title,
                    content,
                    tags,
                    ...(opts.cover ? { coverImage: opts.cover } : {}),
                    ...(isOfficialPost ? { isOfficialPost: true } : {}),
                };

                // ── Publish ────────────────────────────────────────────────────────────
                const spinner =
                    jsonMode || dryRun
                        ? null
                        : ora(`${dryRun ? "Validating" : "Publishing"} ${type}...`).start();

                const result = await publishPost(payload, dryRun);
                spinner?.stop();

                if (isApiError(result)) {
                    handleApiError(result, jsonMode);
                }

                printSuccess(
                    {
                        Title: title,

                        URL: result.url,
                        "Post ID": result.postId,
                        ...(dryRun ? { Note: "Dry run — not published" } : {}),
                    },
                    jsonMode
                );
            }
        );
}
