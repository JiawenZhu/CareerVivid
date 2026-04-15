import { Command } from "commander";
import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";
import { getReferralStats, isApiError } from "../api.js";
import { printError } from "../output.js";

function getProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.min(Math.max(current / total, 0), 1);
    const filledLength = Math.round(width * percentage);
    const emptyLength = width - filledLength;
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(emptyLength);
    return `[${chalk.green(filledBar)}${chalk.dim(emptyBar)}]`;
}

export function registerReferralCommand(program: Command) {
    const referralCmd = program
        .command("referral")
        .description("Manage your CareerVivid referral code, track progress, and view rewards")
        .option("--code", "Print your referral code")
        .option("--link", "Print your full referral link")
        .option("--draft-message", "Print a pre-written shareable message")
        .option("--status", "Show your referral progress and rewards")
        .option("--list", "List your successfully referred users")
        .option("--json", "Output raw JSON data")
        .action(async (opts) => {
            const isJson = opts.json ?? process.argv.includes("--json");
            const spinner = ora("Fetching referral stats…").start();

            const result = await getReferralStats();
            
            if (isApiError(result)) {
                spinner.fail("Failed to get referral stats.");
                printError(result.message, undefined, isJson);
                process.exit(1);
            }

            spinner.stop();

            const baseUrl = "https://careervivid.app/register?ref=";
            const fullLink = `${baseUrl}${result.code}`;

            if (isJson) {
                console.log(JSON.stringify({ ...result, fullLink }));
                return;
            }

            // Fallback to show all if no specific flags provided
            const showAll = !opts.code && !opts.link && !opts.draftMessage && !opts.status && !opts.list;

            if (opts.code || showAll) {
                console.log(`\n  ${chalk.cyan.bold("Your Referral Code:")}  ${chalk.white.bold(result.code)}`);
            }

            if (opts.link || showAll) {
                console.log(`\n  ${chalk.cyan.bold("Your Referral Link:")}  ${chalk.underline.blue(fullLink)}`);
            }

            if (opts.draftMessage || showAll) {
                console.log(`\n  ${chalk.magenta.bold("Share Message:")}`);
                console.log(chalk.dim(`  --------------------------------------------------`));
                console.log(`  Accelerate Your Career Path with CareerVivid! 🚀`);
                console.log();
                console.log(`  Use my exclusive code ${chalk.bold(result.code)} to get 2 Months of Premium for free.`);
                console.log();
                console.log(`  Sign up here: ${fullLink}`);
                console.log(chalk.dim(`  --------------------------------------------------`));
            }

            if (opts.status || showAll) {
                const remaining = result.maxReferrals - result.totalReferred;
                console.log(`\n  ${chalk.yellow.bold("Redemption Progress:")}`);
                console.log(`  ${getProgressBar(result.totalReferred, result.maxReferrals)}  ${chalk.white.bold(`${result.totalReferred}/${result.maxReferrals}`)}`);
                console.log(`  ${chalk.dim(`${remaining} referrals remaining\n`)}`);

                console.log(`  ${chalk.cyan.bold("The Rewards:")}`);
                console.log(`  ${chalk.green.bold("They Get:")} 2 months free Premium, 1000 AI credits/month, All premium templates`);
                console.log(`  ${chalk.green.bold("You Get:")}  1 month free Premium per successful referral (Up to 5 months)`);
            }

            if (opts.list || showAll) {
                console.log(`\n  ${chalk.blue.bold("Referred Users:")}`);
                if (result.referredUsers.length === 0) {
                    console.log(`  ${chalk.dim("No referrals yet. Share your code to get started!")}`);
                } else {
                    result.referredUsers.forEach((u, i) => {
                        const date = u.signupDate 
                            ? new Date(u.signupDate).toLocaleDateString() 
                            : "Recently";
                        console.log(`  ${chalk.dim(`${i+1}.`)} ${chalk.white(u.email)} ${chalk.dim(`(Joined: ${date})`)} ${chalk.green('✓ active')}`);
                    });
                }
            }

            console.log("\n");
        });
}
