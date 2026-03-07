/**
 * CareerVivid CLI — Post-install hook
 *
 * This script runs after 'npm install -g careervivid'.
 * It prints a beautiful welcome/changelog message to the user.
 */

import chalk from "chalk";
import boxen from "boxen";
import { getHelpHeader } from "./branding.js";

const VERSION = "1.1.13";

const CHANGELOG = [
    `${chalk.bold.green("NEW")} Auto-Close Tabs: Browser authentication tabs now auto-close after 2s!`,
    `${chalk.bold.blue("FIX")} User Identity: Reliable name/avatar fetching during login (no more Anonymous).`,
    `${chalk.bold.yellow("FIX")} Deployment Sync: Automatic recovery from stale JS module import errors.`,
    `${chalk.bold.magenta("NEW")} Profile Editor: Update your display name directly from the settings page.`,
    `${chalk.bold.white("IMP")} Polished login success UI with CareerVivid branding.`,
];

export function printPostInstall() {
    console.log();
    console.log(getHelpHeader());

    console.log(
        boxen(
            `${chalk.bold.green("🚀 CareerVivid CLI updated to v" + VERSION + "!")}\n\n` +
            `${chalk.bold("What's New:")}\n` +
            CHANGELOG.map(item => ` • ${item}`).join("\n"),
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                borderStyle: "round",
                borderColor: "#3b82f6",
                title: "Release Notes",
                titleAlignment: "center",
            }
        )
    );

    console.log(`  ${chalk.dim("Try it now:")} ${chalk.cyan("cv --help")}\n`);
}

// Run if executed directly
if (import.meta.url.endsWith("postinstall.js") || process.argv[1].endsWith("postinstall.js")) {
    printPostInstall();
}
