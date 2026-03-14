#!/usr/bin/env node
/**
 * CareerVivid CLI — Entry Point
 *
 * Usage:
 *   cv login                           Authenticate via browser (human users)
 *   cv publish <file>                 Publish a markdown/mermaid file
 *   cv publish -                      Read from stdin (pipe-friendly)
 *   cv publish --official             Publish as CareerVivid Community (admin)
 *   cv whiteboard new                 Scaffold a Mermaid diagram file
 *   cv whiteboard new --template system-arch  Use a built-in template
 *   cv whiteboard list-templates      List all available templates
 *   cv auth set-key <key>             Save your API key (validates before saving)
 *   cv auth check                     Display your identity & verify your key
 *   cv config show                    Print current configuration
 *   cv config set <key> <value>       Update a config value
 *   cv config get <key>               Print a config value
 *   cv upgrade                        Upgrade the CLI to the latest version
 *   cv update [files...]              Update existing content on CareerVivid
 *   cv --help / cv --version
 */

import { Command } from "commander";
import { readFileSync, existsSync } from "fs";
import chalk from "chalk";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CONFIG_FILE } from "./config.js";
import { getHelpHeader, printWelcome } from "./branding.js";
import { registerAuthCommand } from "./commands/auth.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerUpdateCommand } from "./commands/update.js";
import { checkForUpdates } from "./updates.js";
import { registerListTemplatesCommand, registerNewCommand, registerWhiteboardCommand } from "./commands/whiteboard.js";
import { registerPortfolioCommand } from "./commands/portfolio.js";
import { registerWorkspaceCommand } from "./commands/workspace.js";
import { registerProfileCommand } from "./commands/profile.js";
import { registerJobsCommand } from "./commands/jobs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

const program = new Command();

program
    .name("cv")
    .description(
        "CareerVivid CLI — publish articles, diagrams, and portfolio updates from your terminal or AI agent"
    )
    .version(pkg.version, "-v, --version", "Print CLI version")
    .addHelpText("before", getHelpHeader())
    .helpOption("-h, --help", "Show help");

registerAuthCommand(program);
registerLoginCommand(program);
registerPublishCommand(program);
registerConfigCommand(program);
registerUpdateCommand(program);
registerWhiteboardCommand(program);
registerPortfolioCommand(program);
registerWorkspaceCommand(program);
registerProfileCommand(program);
registerJobsCommand(program);

// Shortcuts for whiteboard creation
registerNewCommand(program);
registerListTemplatesCommand(program);

// ── Execution ──────────────────────────────────────────────────────────────

async function main() {
    // Show welcome screen if no config exists and no env var set
    const isFirstRun = !existsSync(CONFIG_FILE) && !process.env.CV_API_KEY;

    // Only show if running without arguments or just 'cv'
    if (isFirstRun && process.argv.length <= 2) {
        printWelcome();
        console.log(`  ${chalk.dim("Get started quickly with:")} ${chalk.cyan("cv login")}
`);
        return;
    }

    try {
        await program.parseAsync(process.argv);

        // Check for updates asynchronously after command execution
        // unless in JSON mode to avoid pollution
        const isJson = process.argv.includes("--json");
        if (!isJson) {
            checkForUpdates().catch(() => { });
        }
    } catch (err: any) {
        console.error(`\nFatal error: ${err.message}`);
        process.exit(1);
    }
}

main();
