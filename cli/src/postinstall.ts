/**
 * CareerVivid CLI — Post-install hook
 *
 * This script runs after 'npm install -g careervivid'.
 * It prints a beautiful welcome/onboarding message to the user.
 */

import chalk from "chalk";
import boxen from "boxen";
import { getHelpHeader } from "./branding.js";

const VERSION = "1.1.14";

export function printPostInstall() {
    console.log();
    console.log(getHelpHeader());

    // ── Onboarding box ──────────────────────────────────────────────────────
    const steps = [
        `${chalk.bold.cyan("1.")} ${chalk.white("cv login")}${" ".repeat(14)}${chalk.dim("Sign in or create your free account")}`,
        `${chalk.bold.cyan("2.")} ${chalk.white("Visit")} ${chalk.underline.blue("careervivid.app/developer")}`,
        `   ${chalk.dim("→ Generate your free API key")}`,
        `${chalk.bold.cyan("3.")} ${chalk.white("cv auth set-key <your-key>")}  ${chalk.dim("Activate the key locally")}`,
    ].join("\n");

    const credits = [
        `${chalk.bold.yellow("✦")} Free plan includes ${chalk.bold("100 AI credits / month")}`,
        `  ${chalk.dim("No personal API key needed for Gemini models.")}`,
        `  ${chalk.dim("Credits are powered by Google Gemini — enterprise-grade AI,")}`,
        `  ${chalk.dim("available at no extra cost under your CareerVivid plan.")}`,
    ].join("\n");

    const quickStart = [
        `  ${chalk.cyan("cv agent --jobs")}    ${chalk.dim("Hunt for jobs with AI")}`,
        `  ${chalk.cyan("cv agent --resume")}  ${chalk.dim("Analyze & improve your resume")}`,
        `  ${chalk.cyan("cv agent")}           ${chalk.dim("Open general AI agent")}`,
    ].join("\n");

    console.log(
        boxen(
            `${chalk.bold.green("🎉 Welcome to CareerVivid CLI v" + VERSION + "!")}\n\n` +
            `${chalk.bold("Get started in 3 steps:")}\n` +
            steps + "\n\n" +
            credits + "\n\n" +
            `${chalk.bold("Quick start:")}\n` +
            quickStart,
            {
                padding: 1,
                margin: { top: 0, bottom: 1 },
                borderStyle: "round",
                borderColor: "#22c55e",
                title: "CareerVivid CLI",
                titleAlignment: "center",
            }
        )
    );
}

// Run if executed directly
if (import.meta.url.endsWith("postinstall.js") || process.argv[1].endsWith("postinstall.js")) {
    printPostInstall();
}
