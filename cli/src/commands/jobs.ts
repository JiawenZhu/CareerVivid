import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import boxen from "boxen";
import { checkGwsReady, runGwsCommand } from "../utils/gws-runner.js";
import { printError, printSuccess } from "../output.js";

export function registerJobsCommand(program: Command) {
    const jobsCmd = program
        .command("jobs")
        .description("Automate and track your job applications");

    jobsCmd
        .command("sync-gmail")
        .description("Scan your Gmail for job applications and generate a tracking Sheet")
        .action(async () => {
            const isJson = process.argv.includes("--json");

            if (!isJson) {
                console.log(`\n  ${chalk.bold("Job Tracker: Syncing Gmail to Google Sheets")}\n`);
            }

            // 1. Verify GWS CLI is available
            const isReady = await checkGwsReady();
            if (!isReady) {
                printError("Google Workspace CLI is not configured. Run 'cv workspace check'.", undefined, isJson);
                process.exit(1);
            }

            // 2. Search Gmail for Application Emails
            const gmailSpinner = ora("Scanning Gmail for recent applications...").start();

            // Note: In a real app we would paginate, but for the demo we'll fetch the top 5
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

            // Fetch snippets for these messages (mocking AI extraction)
            const extractedJobs: { company: string, role: string, date: string }[] = [];

            for (const msg of messages) {
                const msgRes = await runGwsCommand(`gmail users messages get --params '{"userId": "me", "id": "${msg.id}", "format": "metadata"}'`);
                if (msgRes.success && msgRes.data) {
                    const snippet = msgRes.data.snippet || "";
                    // Mocking AI parse
                    extractedJobs.push({
                        company: snippet.split(" ")[0] || "Unknown Corp",
                        role: "Software Engineer",
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }

            gmailSpinner.succeed(`Found ${extractedJobs.length} applications via Gmail.`);

            // 3. Create the Google Sheet Tracker
            const sheetSpinner = ora("Creating Tracker inside Google Sheets...").start();
            const createRes = await runGwsCommand(`sheets spreadsheets create --json '{"properties": {"title": "CareerVivid Job Tracker ${new Date().getFullYear()}"}}'`);

            if (!createRes.success || !createRes.data?.spreadsheetId) {
                sheetSpinner.fail("Failed to create Google Sheet.");
                printError(createRes.error || "Unknown error", undefined, isJson);
                process.exit(1);
            }

            const sheetId = createRes.data.spreadsheetId;
            sheetSpinner.succeed(`Created new spreadsheet: ${sheetId}`);

            // 4. Append Data to the Sheet
            const appendSpinner = ora("Writing data to Sheet...").start();

            const values = [
                ["Company", "Role", "Date Applied", "Status"], // Header
                ...extractedJobs.map(job => [job.company, job.role, job.date, "Applied"]) // Rows
            ];

            const payload = JSON.stringify({ values }).replace(/'/g, "");

            const updateRes = await runGwsCommand(`sheets spreadsheets values append \
                --params '{"spreadsheetId": "${sheetId}", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' \
                --json '${payload}'`);

            if (!updateRes.success) {
                appendSpinner.fail("Failed to write to Google Sheet.");
                printError(updateRes.error || "Unknown validation issue with Sheets API payload.", undefined, isJson);
                process.exit(1);
            }
            appendSpinner.succeed("Tracker updated successfully!");

            // 5. Output Result
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

            if (isJson) {
                console.log(JSON.stringify({ success: true, url: sheetUrl, spreadsheetId: sheetId, jobsFound: extractedJobs.length }));
            } else {
                console.log(
                    boxen(
                        `${chalk.bold.green("✔ Sync Complete!")}\n\n` +
                        `Your applications have been synced to Google Sheets:\n` +
                        `${chalk.cyan.underline(sheetUrl)}`,
                        { padding: 1, borderStyle: "round" }
                    )
                );
            }
        });
}
