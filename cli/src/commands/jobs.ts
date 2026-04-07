/**
 * cv jobs — Agentic Job Hunt Commands
 *
 *   cv jobs hunt   — AI-powered job search scored against your resume → /job-tracker
 *   cv jobs update — Interactively move a job card to a new Kanban status
 *   cv jobs list   — View your current tracker
 *   cv jobs sync-gmail — Legacy: sync Gmail applications to Google Sheets
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import {
    isApiError,
    resumeGet,
    jobsHunt,
    jobsCreate,
    jobsUpdate,
    jobsList,
    ScoredJob,
    JobTrackerItem,
    ApplicationStatus,
} from "../api.js";
import { checkGwsReady, runGwsCommand } from "../utils/gws-runner.js";
import { printError, printSuccess } from "../output.js";

// ── Score colour helpers ──────────────────────────────────────────────────────

function scoreColor(score: number): typeof chalk.green {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    if (score >= 40) return chalk.hex("#FFA500");
    return chalk.red;
}

function scoreBar(score: number, width = 20): string {
    const filled = Math.round((score / 100) * width);
    const bar = "█".repeat(filled) + "░".repeat(width - filled);
    return scoreColor(score)(bar);
}

function statusBadge(status: ApplicationStatus): string {
    const badges: Record<ApplicationStatus, string> = {
        "To Apply":    chalk.bgGray.white(" To Apply    "),
        "Applied":     chalk.bgBlue.white(" Applied     "),
        "Interviewing": chalk.bgYellow.black(" Interviewing"),
        "Offered":     chalk.bgGreen.white(" Offered     "),
        "Rejected":    chalk.bgRed.white(" Rejected    "),
    };
    return badges[status] ?? chalk.bgGray.white(` ${status} `);
}

// ── Enquirer dynamic import ───────────────────────────────────────────────────
// enquirer is CJS, use a stable import

async function prompt<T = Record<string, any>>(questions: object[]): Promise<T> {
    const { default: Enquirer } = await import("enquirer" as any);
    const enq = new Enquirer();
    return enq.prompt(questions) as Promise<T>;
}

// ── Display helpers ───────────────────────────────────────────────────────────

function renderJobCard(job: ScoredJob, index: number): string {
    const col = scoreColor(job.score);
    const header = `${chalk.bold(`${index + 1}. ${job.title}`)} ${chalk.dim("@")} ${chalk.cyan(job.company)}`;
    const meta   = `   ${chalk.dim("📍")} ${job.location}${job.salary ? `  ${chalk.dim("💰")} ${job.salary}` : ""}`;
    const bar    = `   ${scoreBar(job.score)} ${col.bold(`${job.score}/100`)} ${chalk.dim(`(${job.scoreLabel})`)}`;
    const ai     = `   ${chalk.dim("🤖")} ${chalk.italic(job.aiSummary)}`;
    const missing = job.missingSkills.length
        ? `   ${chalk.dim("⚠️  Missing:")} ${chalk.red(job.missingSkills.join(", "))}`
        : "";
    const link   = job.url ? `   ${chalk.dim("🔗")} ${chalk.blue.underline(job.url)}` : "";
    return [header, meta, bar, ai, missing, link].filter(Boolean).join("\n");
}

function renderTrackerRow(job: JobTrackerItem, index: number): string {
    const score = job.aiScore !== null ? ` ${scoreColor(job.aiScore)(`[${job.aiScore}]`)}` : "";
    const updated = job.updatedAt ? chalk.dim(` · ${new Date(job.updatedAt).toLocaleDateString()}`) : "";
    return `${chalk.dim(`${index + 1}.`)} ${statusBadge(job.applicationStatus)} ${chalk.bold(job.jobTitle)} ${chalk.dim("@")} ${chalk.cyan(job.companyName)}${score}${updated}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main command registration
// ─────────────────────────────────────────────────────────────────────────────

export function registerJobsCommand(program: Command) {
    const jobsCmd = program
        .command("jobs")
        .description("Agentic job hunting — search, score, and track applications");

    // ── cv jobs hunt ─────────────────────────────────────────────────────────
    jobsCmd
        .command("hunt")
        .description("AI-powered job search scored against your resume → auto-saves to /job-tracker")
        .option("-r, --role <role>", "Job role to search for", "Software Engineer")
        .option("-l, --location <location>", "City / region (or 'Remote')", "")
        .option("-f, --resume <path>", "Local resume file (.md, .txt, .pdf text)")
        .option("-c, --count <n>", "Max jobs to return", "10")
        .option("-o, --target-orgs <orgs>", "Comma-separated list of target organizations to focus search on ATS boards", "")
        .option("-s, --score <n>", "Minimum match score (0-100)", "50")
        .option("--json", "Output raw JSON")
        .action(async (opts) => {
            const { loadConfig } = await import("../config.js");
            const isJson = opts.json ?? process.argv.includes("--json");
            const count  = parseInt(opts.count,  10) || 10;
            const minScore = parseInt(opts.score, 10) || 50;
            const configOrgs = loadConfig().targetCompanies;
            const targetOrgsStr = opts.targetOrgs || configOrgs;
            const targetOrgs = targetOrgsStr ? targetOrgsStr.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined;

            if (!isJson) {
                console.log(
                    boxen(
                        `${chalk.bold.cyan("🎯 CareerVivid · Agentic Job Hunt")}\n\n` +
                        `Role: ${chalk.bold(opts.role)}\n` +
                        `${opts.location ? `Location: ${chalk.bold(opts.location)}\n` : ""}` +
                        `${targetOrgs && targetOrgs.length ? `Target Orgs: ${chalk.bold(targetOrgs.join(", "))}\n` : ""}` +
                        `Min Score: ${chalk.bold(`${minScore}/100`)}  ·  Max Results: ${chalk.bold(count)}`,
                        { padding: 1, borderStyle: "round", borderColor: "cyan" }
                    )
                );
            }

            // ── Step 1: Load resume ───────────────────────────────────────────
            let resumeContent: string | undefined;
            let resumeSource = "";

            if (opts.resume) {
                const filePath = resolve(opts.resume);
                if (!existsSync(filePath)) {
                    printError(`Resume file not found: ${filePath}`, undefined, isJson);
                    process.exit(1);
                }
                resumeContent = readFileSync(filePath, "utf-8");
                resumeSource = `local file: ${opts.resume}`;
                if (!isJson) console.log(chalk.dim(`\n  📄 Resume loaded from ${opts.resume}`));
            } else {
                const resumeSpinner = ora("Fetching your latest resume from CareerVivid…").start();
                const res = await resumeGet();
                if (isApiError(res)) {
                    resumeSpinner.warn("No resume found on CareerVivid — searching without one (scores will be general).");
                    resumeSource = "none";
                } else {
                    resumeContent = res.cvMarkdown;
                    resumeSource = `CareerVivid: "${res.title}"`;
                    resumeSpinner.succeed(`Resume loaded: ${chalk.cyan(res.title)}`);
                }
            }

            // ── Step 2: Hunt ──────────────────────────────────────────────────
            const huntSpinner = ora(`Searching jobs for "${opts.role}"${opts.location ? ` in ${opts.location}` : ""} and scoring with AI…`).start();

            const huntResult = await jobsHunt({
                resumeContent,
                role: opts.role,
                location: opts.location || undefined,
                count,
                minScore,
                targetOrgs,
            });

            if (isApiError(huntResult)) {
                huntSpinner.fail("Job hunt failed.");
                printError(huntResult.message, undefined, isJson);
                process.exit(1);
            }

            const { jobs } = huntResult;
            huntSpinner.succeed(`Found ${chalk.bold(jobs.length)} matching jobs (score ≥ ${minScore})`);

            if (jobs.length === 0) {
                if (isJson) {
                    console.log(JSON.stringify({ jobs: [], message: "No jobs found above minimum score." }));
                } else {
                    console.log(chalk.yellow("\n  No jobs matched your criteria. Try lowering --score or broadening the role.\n"));
                }
                process.exit(0);
            }

            // ── Step 3: Display results ───────────────────────────────────────
            if (isJson) {
                console.log(JSON.stringify({ jobs, resumeSource }));
                return;
            }

            console.log(`\n${chalk.bold("  Scored Job Matches")}\n`);
            jobs.forEach((job, i) => {
                console.log(renderJobCard(job, i));
                console.log();
            });

            // ── Step 4: Interactive selection ─────────────────────────────────
            const { selected } = await prompt<{ selected: string[] }>([{
                type: "multiselect",
                name: "selected",
                message: "Select jobs to save to your /job-tracker (space to toggle, enter to confirm):",
                choices: jobs.map((j, i) => ({
                    name: `${i + 1}. ${j.title} @ ${j.company} ${scoreColor(j.score)(`[${j.score}]`)}`,
                    value: String(i),
                })),
                // enquirer multiselect returns names by default, we need value
                result(names: string[]) {
                    return names.map((n: string) => (this as any).map[n]);
                },
            }]);

            if (!selected || selected.length === 0) {
                console.log(chalk.dim("\n  Nothing saved. Run `cv jobs list` to see your tracker.\n"));
                return;
            }

            // ── Step 5: Save selected jobs to tracker ─────────────────────────
            const saveSpinner = ora(`Saving ${selected.length} job(s) to your tracker…`).start();
            const saved: string[] = [];
            const failed: string[] = [];

            await Promise.all(
                selected.map(async (idxStr) => {
                    const job = jobs[parseInt(idxStr, 10)];
                    if (!job) return;
                    const result = await jobsCreate({
                        jobTitle:       job.title,
                        companyName:    job.company,
                        location:       job.location,
                        jobPostURL:     job.url,
                        jobDescription: job.description,
                        aiScore:        job.score,
                        aiSummary:      job.aiSummary,
                    });
                    if (isApiError(result)) {
                        failed.push(`${job.title} @ ${job.company}: ${result.message}`);
                    } else {
                        saved.push(`${job.title} @ ${job.company}`);
                    }
                })
            );

            if (failed.length > 0) {
                saveSpinner.warn(`Saved ${saved.length}, ${failed.length} failed.`);
                failed.forEach(f => console.log(chalk.red(`  ✖ ${f}`)));
            } else {
                saveSpinner.succeed(`${saved.length} job(s) added to your tracker.`);
            }

            if (saved.length > 0) {
                console.log(
                    boxen(
                        `${chalk.bold.green("✔ Jobs saved to /job-tracker!")}\n\n` +
                        saved.map(s => `  ${chalk.dim("→")} ${s}`).join("\n") + "\n\n" +
                        `${chalk.dim("View on web:")} ${chalk.cyan.underline("https://careervivid.app/job-tracker")}\n` +
                        `${chalk.dim("Or:")} ${chalk.cyan("cv jobs list")}`,
                        { padding: 1, borderStyle: "round", borderColor: "green" }
                    )
                );
            }
        });

    // ── cv jobs update ────────────────────────────────────────────────────────
    jobsCmd
        .command("update")
        .description("Interactively update a job application status on the Kanban board")
        .option("--job-id <id>", "Job tracker document ID (skip list prompt)")
        .option("--status <status>", "New status directly (skip status prompt)")
        .option("--notes <notes>", "Optional notes to attach")
        .option("--json", "Output raw JSON")
        .action(async (opts) => {
            const isJson = opts.json ?? process.argv.includes("--json");

            let jobId: string = opts.jobId || "";
            let newStatus: ApplicationStatus | "" = (opts.status as ApplicationStatus) || "";

            // ── Fetch current tracker if no jobId given ───────────────────────
            if (!jobId) {
                const listSpinner = ora("Fetching your current job tracker…").start();
                const listResult = await jobsList();
                if (isApiError(listResult)) {
                    listSpinner.fail("Failed to fetch tracker.");
                    printError(listResult.message, undefined, isJson);
                    process.exit(1);
                }

                const jobs = listResult.jobs;
                listSpinner.succeed(`${jobs.length} job(s) in your tracker`);

                if (jobs.length === 0) {
                    console.log(chalk.yellow("\n  Your tracker is empty. Run `cv jobs hunt` to find jobs.\n"));
                    process.exit(0);
                }

                if (!isJson) {
                    console.log(`\n${chalk.bold("  Your Job Tracker")}\n`);
                    jobs.forEach((j, i) => console.log(renderTrackerRow(j, i)));
                    console.log();
                }

                // Prompt to pick a job
                const { jobChoice } = await prompt<{ jobChoice: string }>([{
                    type: "select",
                    name: "jobChoice",
                    message: "Which job do you want to update?",
                    choices: jobs.map((j, i) => ({
                        name: `${i + 1}. ${j.jobTitle} @ ${j.companyName} [${j.applicationStatus}]`,
                        value: j.id,
                    })),
                    result(name: string) { return (this as any).map[name]; },
                }]);
                jobId = jobChoice;
            }

            // ── Pick new status ───────────────────────────────────────────────
            if (!newStatus) {
                const statuses: ApplicationStatus[] = ["To Apply", "Applied", "Interviewing", "Offered", "Rejected"];
                const { statusChoice } = await prompt<{ statusChoice: ApplicationStatus }>([{
                    type: "select",
                    name: "statusChoice",
                    message: "Move to which status?",
                    choices: statuses.map(s => ({ name: s, value: s })),
                    result(name: string) { return (this as any).map[name]; },
                }]);
                newStatus = statusChoice;
            }

            // ── Optional notes ────────────────────────────────────────────────
            let notes: string = opts.notes || "";
            if (!notes && !opts.notes) {
                const { addNote } = await prompt<{ addNote: boolean }>([{
                    type: "confirm",
                    name: "addNote",
                    message: "Add a note? (e.g. interviewer name, date)",
                    initial: false,
                }]);
                if (addNote) {
                    const { noteText } = await prompt<{ noteText: string }>([{
                        type: "input",
                        name: "noteText",
                        message: "Note:",
                    }]);
                    notes = noteText || "";
                }
            }

            // ── Call API ──────────────────────────────────────────────────────
            const updateSpinner = ora(`Updating status → ${newStatus}…`).start();
            const result = await jobsUpdate({
                jobId,
                status: newStatus as ApplicationStatus,
                notes: notes || undefined,
            });

            if (isApiError(result)) {
                updateSpinner.fail("Update failed.");
                printError(result.message, undefined, isJson);
                process.exit(1);
            }

            updateSpinner.succeed(result.message);

            if (isJson) {
                console.log(JSON.stringify(result));
            } else {
                console.log(
                    boxen(
                        `${chalk.bold.green("✔ Kanban board updated!")}\n\n` +
                        `${chalk.bold((result as any).jobTitle ?? "Job")} ${chalk.dim("@")} ${chalk.cyan((result as any).companyName ?? "")}\n\n` +
                        `${chalk.dim("→")} ${statusBadge(newStatus as ApplicationStatus)}\n\n` +
                        `${chalk.dim("View on web:")} ${chalk.cyan.underline("https://careervivid.app/job-tracker")}`,
                        { padding: 1, borderStyle: "round", borderColor: "green" }
                    )
                );
            }
        });

    // ── cv jobs list ──────────────────────────────────────────────────────────
    jobsCmd
        .command("list")
        .description("View your current job tracker")
        .option("--status <status>", "Filter by status (To Apply, Applied, Interviewing, Offered, Rejected)")
        .option("--json", "Output raw JSON")
        .action(async (opts) => {
            const isJson = opts.json ?? process.argv.includes("--json");

            const spinner = ora("Fetching your job tracker…").start();
            const result  = await jobsList(opts.status as ApplicationStatus | undefined);

            if (isApiError(result)) {
                spinner.fail("Failed to fetch tracker.");
                printError(result.message, undefined, isJson);
                process.exit(1);
            }

            const { jobs, total } = result;
            spinner.succeed(`${total} job(s)${opts.status ? ` with status "${opts.status}"` : ""}`);

            if (isJson) {
                console.log(JSON.stringify(result));
                return;
            }

            if (total === 0) {
                console.log(chalk.yellow("\n  Your tracker is empty. Run `cv jobs hunt` to start.\n"));
                return;
            }

            console.log(`\n${chalk.bold("  Your Job Tracker")}\n`);
            jobs.forEach((j, i) => {
                console.log(renderTrackerRow(j, i));
                if (j.notes) console.log(chalk.dim(`      💬 ${j.notes}`));
            });

            const byStatus: Partial<Record<ApplicationStatus, number>> = {};
            jobs.forEach(j => { byStatus[j.applicationStatus] = (byStatus[j.applicationStatus] || 0) + 1; });
            const statusSummary = (Object.entries(byStatus) as [ApplicationStatus, number][])
                .map(([s, c]) => `${statusBadge(s)} ×${c}`)
                .join("  ");

            console.log(`\n  ${statusSummary}\n`);
            console.log(chalk.dim(`  View on web: https://careervivid.app/job-tracker\n`));
        });

    // ── cv jobs sync-gmail (legacy) ───────────────────────────────────────────
    jobsCmd
        .command("sync-gmail")
        .description("[Legacy] Scan Gmail for job application emails → Google Sheets")
        .action(async () => {
            const isJson = process.argv.includes("--json");

            if (!isJson) {
                console.log(`\n  ${chalk.bold("Job Tracker: Syncing Gmail to Google Sheets")}\n`);
                console.log(chalk.dim("  Tip: Use `cv jobs hunt` for AI-powered job search instead.\n"));
            }

            const isReady = await checkGwsReady();
            if (!isReady) {
                printError("Google Workspace CLI is not configured. Run 'cv workspace check'.", undefined, isJson);
                process.exit(1);
            }

            const gmailSpinner = ora("Scanning Gmail for recent applications…").start();
            const query = encodeURIComponent("subject:application OR subject:applied OR subject:\"thank you for applying\"");
            const listRes = await runGwsCommand(`gmail users messages list --params '{"userId": "me", "maxResults": 5, "q": "${query}"}'`);

            if (!listRes.success) {
                gmailSpinner.fail("Failed to read Gmail.");
                printError(listRes.error || "Unknown error", undefined, isJson);
                process.exit(1);
            }

            const messages = listRes.data?.messages || [];
            if (messages.length === 0) {
                gmailSpinner.info("No recent application emails found.");
                process.exit(0);
            }

            const extractedJobs: { company: string; role: string; date: string }[] = [];
            for (const msg of messages) {
                const msgRes = await runGwsCommand(`gmail users messages get --params '{"userId": "me", "id": "${msg.id}", "format": "metadata"}'`);
                if (msgRes.success && msgRes.data) {
                    const snippet = msgRes.data.snippet || "";
                    extractedJobs.push({
                        company: snippet.split(" ")[0] || "Unknown Corp",
                        role: "Software Engineer",
                        date: new Date().toISOString().split("T")[0],
                    });
                }
            }
            gmailSpinner.succeed(`Found ${extractedJobs.length} applications via Gmail.`);

            const sheetSpinner = ora("Creating Tracker in Google Sheets…").start();
            const createRes = await runGwsCommand(`sheets spreadsheets create --json '{"properties": {"title": "CareerVivid Job Tracker ${new Date().getFullYear()}"}}'`);

            if (!createRes.success || !createRes.data?.spreadsheetId) {
                sheetSpinner.fail("Failed to create Google Sheet.");
                printError(createRes.error || "Unknown error", undefined, isJson);
                process.exit(1);
            }

            const sheetId = createRes.data.spreadsheetId;
            sheetSpinner.succeed(`Created spreadsheet: ${sheetId}`);

            const appendSpinner = ora("Writing data to Sheet…").start();
            const values = [
                ["Company", "Role", "Date Applied", "Status"],
                ...extractedJobs.map(j => [j.company, j.role, j.date, "Applied"]),
            ];
            const payload = JSON.stringify({ values }).replace(/'/g, "");
            const updateRes = await runGwsCommand(
                `sheets spreadsheets values append --params '{"spreadsheetId": "${sheetId}", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' --json '${payload}'`
            );

            if (!updateRes.success) {
                appendSpinner.fail("Failed to write to Google Sheet.");
                printError(updateRes.error || "Unknown error", undefined, isJson);
                process.exit(1);
            }
            appendSpinner.succeed("Tracker updated!");

            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
            if (isJson) {
                console.log(JSON.stringify({ success: true, url: sheetUrl, spreadsheetId: sheetId, jobsFound: extractedJobs.length }));
            } else {
                console.log(
                    boxen(
                        `${chalk.bold.green("✔ Sync Complete!")}\n\n` +
                        `Your applications have been synced to Google Sheets:\n` +
                        chalk.cyan.underline(sheetUrl),
                        { padding: 1, borderStyle: "round" }
                    )
                );
            }
        });
}
