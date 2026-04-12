/**
 * cv jobs apply — AI-Powered Job Application Agent
 *
 * Flow:
 *   1. Load user profile (~/.careervivid/apply-profile.json)
 *   2. If profile is empty, run setup wizard to collect basic info
 *   3. Launch Chrome → navigate to application form
 *   4. Fill standard fields directly from profile (getByLabel — no Gemini needed)
 *   5. Run Gemini Vision agent for remaining/complex fields
 *   6. Prompt user via CLI for any info still missing
 *   7. Browser stays open — user reviews and submits manually
 */

import { Command } from "commander";
import chalk from "chalk";
import pkg from "enquirer";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { isApiError, jobsList, jobsUpdate } from "../api.js";
import { detectPlatform } from "../apply/index.js";
import { launchApplyBrowser } from "../apply/browser.js";
import {
  GeminiFormAgent,
  loadProfile,
  saveProfile,
  type ApplyProfile,
} from "../apply/gemini-agent.js";

const { prompt } = pkg;

// ── Config helpers ────────────────────────────────────────────────────────────

function getGeminiApiKey(): string | undefined {
  // Priority order:
  //   1. GEMINI_API_KEY env var (set in shell)
  //   2. GOOGLE_API_KEY env var (set by browser-use / other tools)
  //   3. ~/.careervividrc.json → geminiKey (set by `cv agent` config)
  //   4. ~/.careervividrc.json → llmApiKey (set by BYO provider config)
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  // Read from the main CareerVivid config file (NOT .careervivid/config.json)
  const configPath = join(homedir(), ".careervividrc.json");
  if (existsSync(configPath)) {
    try {
      const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
      // geminiKey: stored by `cv agent config` when user sets a personal Gemini key
      if (cfg.geminiKey) return cfg.geminiKey;
      // llmApiKey: stored when user selects a BYO Gemini provider
      if (cfg.llmProvider === "gemini" && cfg.llmApiKey) return cfg.llmApiKey;
    } catch {}
  }
  return undefined;
}

// ── Profile setup wizard ──────────────────────────────────────────────────────
//
// Runs on first use when the profile is empty — collects the essential fields
// so future applications are fully automated.

async function runProfileSetupWizard(): Promise<ApplyProfile> {
  console.log(
    chalk.bold.cyan("\n  📝 First-time setup — let's build your apply profile\n") +
    chalk.dim("  This is stored locally at ~/.careervivid/apply-profile.json\n") +
    chalk.dim("  It's used to auto-fill job applications. Run once, reuse forever.\n")
  );

  const fields: Array<{ name: keyof ApplyProfile; message: string; hint?: string }> = [
    { name: "firstName",        message: "First name" },
    { name: "lastName",         message: "Last name" },
    { name: "email",            message: "Email address" },
    { name: "phone",            message: "Phone number", hint: "+1 555-123-4567" },
    { name: "city",             message: "City" },
    { name: "state",            message: "State / Province", hint: "e.g. IL" },
    { name: "country",          message: "Country", hint: "United States" },
    { name: "linkedin",         message: "LinkedIn URL", hint: "https://linkedin.com/in/..." },
    { name: "github",           message: "GitHub URL (optional)", hint: "https://github.com/..." },
    { name: "portfolio",        message: "Portfolio/website URL (optional)" },
    { name: "currentTitle",     message: "Current job title" },
    { name: "currentCompany",   message: "Current company" },
    { name: "yearsOfExperience",message: "Years of experience", hint: "e.g. 5" },
    { name: "workAuthorization",message: "Work authorization", hint: "US Citizen / H1-B / etc." },
  ];

  const profile: ApplyProfile = {};
  for (const field of fields) {
    const { value } = await prompt<{ value: string }>({
      type: "input",
      name: "value",
      message: `  ${field.message}${field.hint ? chalk.dim(` (${field.hint})`) : ""}:`,
    }).catch(() => ({ value: "" }));
    const resolved = (value as any).value ?? value;
    if (resolved.trim()) profile[field.name] = resolved.trim();
  }

  saveProfile(profile);
  console.log(
    chalk.green("\n  ✔ Profile saved to ~/.careervivid/apply-profile.json\n") +
    chalk.dim("  Edit it anytime with: cat ~/.careervivid/apply-profile.json\n")
  );
  return profile;
}

// ── Terminal helpers ──────────────────────────────────────────────────────────

function printHeader() {
  console.log(chalk.bold.cyan("\n🤖 CareerVivid Auto-Apply"));
  console.log(chalk.dim("   Profile fill · Gemini AI · Browser stays open for review"));
  console.log(chalk.dim("─".repeat(60)));
}

function printProfileSummary(profile: ApplyProfile) {
  const entries = [
    ["Name", [profile.firstName, profile.lastName].filter(Boolean).join(" ")],
    ["Email", profile.email],
    ["Phone", profile.phone],
    ["Location", [profile.city, profile.state].filter(Boolean).join(", ")],
    ["LinkedIn", profile.linkedin],
  ].filter(([, v]) => v) as [string, string][];

  if (entries.length === 0) return;
  console.log(chalk.dim("\n  Loaded profile:"));
  entries.forEach(([k, v]) =>
    console.log(chalk.dim(`    ${k.padEnd(10)} ${chalk.white(v)}`)
  ));
  console.log();
}

// ── Register command ──────────────────────────────────────────────────────────

export function registerApplyCommand(program: Command) {
  program
    .command("apply [jobUrl]")
    .description("Auto-apply to a job with AI-tailored answers in your own Chrome browser.")
    .option("--job-id <id>", "Apply to a job already saved in your tracker by ID")
    .option("--dry-run", "Show what would happen without opening a browser")
    .option("--enable-linkedin", "Opt-in to LinkedIn Easy Apply (LinkedIn ToS applies)")
    .option("--resume-id <id>", "Use a specific resume ID for AI answers")
    .option("--no-cover-letter", "Skip cover letter generation")
    .option("--setup-profile", "Re-run the profile setup wizard")
    .option("--no-gemini", "Skip Gemini agent, use profile fill only")
    .option("--no-native", "Use isolated automation browser instead of your native Chrome")
    // Allow agent/non-interactive callers to pass profile data directly:
    .option("--first-name <name>", "First name (for non-interactive use)")
    .option("--last-name <name>", "Last name (for non-interactive use)")
    .option("--email <email>", "Email address (for non-interactive use)")
    .option("--phone <phone>", "Phone number (for non-interactive use)")
    .option("--linkedin <url>", "LinkedIn URL (for non-interactive use)")
    .action(async (jobUrl: string | undefined, options) => {
      printHeader();

      // ── 1. Load / set up profile ───────────────────────────────────────────
      let profile = loadProfile();
      const isInteractive = Boolean(process.stdin.isTTY);

      // Merge any inline flags (from agent/non-interactive callers) into profile
      if (options.firstName)  profile.firstName  = options.firstName;
      if (options.lastName)   profile.lastName   = options.lastName;
      if (options.email)      profile.email      = options.email;
      if (options.phone)      profile.phone      = options.phone;
      if (options.linkedin)   profile.linkedin   = options.linkedin;

      // Run setup wizard ONLY when:
      //   a) explicitly requested via --setup-profile, OR
      //   b) profile is empty AND we have an interactive terminal
      if (options.setupProfile && isInteractive) {
        profile = await runProfileSetupWizard();
      } else if (Object.keys(profile).filter(k => profile[k as keyof ApplyProfile]).length === 0) {
        if (isInteractive) {
          // First-time interactive use — run wizard
          profile = await runProfileSetupWizard();
        } else {
          // Non-interactive (called from agent/script) — skip wizard, just log a hint
          console.log(
            chalk.yellow("  ⚠️  No apply profile found.") +
            chalk.dim(" Run: cv jobs apply --setup-profile   to set one up.\n") +
            chalk.dim("  Proceeding with Gemini agent only.\n")
          );
        }
      } else {
        printProfileSummary(profile);
      }

      // ── 2. Resolve job URL ─────────────────────────────────────────────────
      let resolvedUrl = jobUrl;
      let jobTitle = "Unknown Role";
      let companyName = "Unknown Company";
      let jobId: string | undefined;

      if (!resolvedUrl && options.jobId) {
        jobId = options.jobId;
        console.log(chalk.dim(`\n📋 Loading job ${jobId} from tracker...`));
        const trackerResult = await jobsList();
        if (isApiError(trackerResult)) {
          console.error(chalk.red(`\n❌ Could not load job tracker: ${trackerResult.message}`));
          process.exit(1);
        }
        const job = trackerResult.jobs.find((j) => j.id === jobId);
        if (!job) {
          console.error(chalk.red(`\n❌ Job ${jobId} not found in tracker.`));
          process.exit(1);
        }
        resolvedUrl = job.jobPostURL;
        jobTitle = job.jobTitle;
        companyName = job.companyName;
        console.log(chalk.cyan(`  ✔ "${jobTitle}" @ ${companyName}`));
      }

      if (!resolvedUrl) {
        console.error(chalk.red("\n❌ Please provide a job URL or --job-id <id>\n"));
        console.log(chalk.dim("  Example: cv jobs apply https://boards.greenhouse.io/stripe/jobs/7788088"));
        process.exit(1);
      }

      // ── 3. Detect ATS platform ─────────────────────────────────────────────
      const platform = detectPlatform(resolvedUrl);
      const platformLabel: Record<string, string> = {
        greenhouse: "Greenhouse 🌱", lever: "Lever", ashby: "Ashby",
        linkedin: "LinkedIn", workday: "Workday", icims: "iCIMS", generic: "Standard ATS",
      };
      console.log(chalk.cyan(`  Platform: ${platformLabel[platform] || platform}`));
      console.log(chalk.dim(`  URL:      ${resolvedUrl}`));

      // LinkedIn guard
      if (platform === "linkedin" && !options.enableLinkedin) {
        console.log(chalk.yellow("\n⚠️  LinkedIn requires --enable-linkedin flag.\n"));
        process.exit(0);
      }

      // ── 4. Dry run ─────────────────────────────────────────────────────────
      if (options.dryRun) {
        console.log(chalk.yellow("\n🔍 DRY RUN — nothing will open or be filled.\n"));
        const profileKeys = Object.keys(profile).filter((k) => profile[k as keyof ApplyProfile]);
        console.log(chalk.dim(`  Profile fields ready: ${profileKeys.join(", ")}`));
        console.log(chalk.dim("  Re-run without --dry-run to execute.\n"));
        process.exit(0);
      }

      // ── 5. Check Gemini key ────────────────────────────────────────────────
      const geminiKey = getGeminiApiKey();
      const useGemini = options.gemini !== false && !!geminiKey;

      if (options.gemini !== false && !geminiKey) {
        console.log(
          chalk.yellow("\n  ℹ️  No GEMINI_API_KEY found — running profile-fill only.") +
          chalk.dim("\n      Set GEMINI_API_KEY to enable AI for complex/custom fields.\n")
        );
      }

      // ── 6. Launch browser ──────────────────────────────────────────────────
      // Always uses the dedicated automation profile (~/.careervivid/browser-session/).
      // No Chrome restart, no profile locking, no prompts needed.
      let browser: Awaited<ReturnType<typeof launchApplyBrowser>> | null = null;

      try {
        browser = await launchApplyBrowser();
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Could not launch browser: ${err.message}\n`));
        process.exit(1);
      }

      // ── 7. Navigate and fill (unified for ALL platforms) ─────────────────────
      try {
        const { getAdapter } = await import("../apply/index.js");
        const adapter = await getAdapter(platform);

        // ── Phase 1: Navigate to form (with HITL timeout) ─────────────────────
        console.log(chalk.dim("   Navigating to application form..."));

        const navResult = await withHITL(
          () => adapter.navigateToForm(browser!.page, resolvedUrl!),
          { timeoutMs: 30_000, phase: "Page parsing" },
        );

        if (navResult === "manual") {
          console.log(chalk.yellow("\n  ✋ Manual mode — fill out the form in the browser."));
        } else {
          // ── Login Gate: detect login walls and pause for user ────────────────
          const loginDetected = await detectLoginWall(browser.page);
          if (loginDetected) {
            console.log(
              chalk.yellow.bold("\n  🔐 Login required!") +
              chalk.yellow("\n     This site requires you to log in before applying.\n")
            );

            if (isInteractive) {
              console.log(
                chalk.cyan("  👉 Please log in using the browser window.") +
                chalk.dim("\n     Your session will be saved for future runs.\n")
              );

              const { loginAction } = await prompt<{ loginAction: string }>({
                type: "select",
                name: "loginAction",
                message: "What would you like to do?",
                choices: [
                  { name: "wait", message: "🔑  I'll log in now — wait for me, then press Enter" },
                  { name: "skip", message: "⏭   Skip this job" },
                ],
              }).catch(() => ({ loginAction: "skip" }));

              const resolvedAction = (loginAction as any).loginAction ?? loginAction;

              if (resolvedAction === "wait") {
                // Wait for user to log in — poll until the login wall disappears
                console.log(chalk.dim("\n  ⏳ Waiting for you to log in..."));
                console.log(chalk.dim("     Press Enter here when you're done, or I'll detect it automatically.\n"));

                await waitForLoginCompletion(browser.page);

                console.log(chalk.green("\n  ✔ Login detected! Continuing with form filling...\n"));
              } else {
                // User chose to skip
                console.log(chalk.dim("\n  Skipping this job.\n"));
                await closeBrowserSafely(browser);
                return;
              }
            } else {
              // Non-interactive — can't log in, fall back to manual
              console.log(
                chalk.yellow("  (Non-interactive) Cannot log in automatically.") +
                chalk.dim("\n  Run interactively: cv jobs apply <url>\n")
              );
            }
          }

          // Grab title from page
          if (jobTitle === "Unknown Role") {
            const title = await browser.page.title();
            const match = title.match(/^([^|\u2013\-]+)/);
            if (match) {
              jobTitle = match[1].trim();
              const compMatch = title.match(/[-–|]\s*(.+)$/);
              if (compMatch && companyName === "Unknown Company") {
                companyName = compMatch[1].trim();
              }
            }
          }

          // ── Phase 2: Fill form (with HITL timeout) ──────────────────────────
          const fillResult = await withHITL(
            async () => {
              // Step A: Fill standard fields from profile (instant, no AI)
              if (adapter.fillFromProfile) {
                console.log(chalk.bold("\n  Step 1: Filling standard fields from your profile...\n"));
                const { filled, skipped } = await adapter.fillFromProfile(browser!.page, profile);

                if (filled.length > 0) {
                  console.log(chalk.green(`\n  ✔ Filled ${filled.length} fields from profile`));
                }
                if (skipped.length > 0) {
                  console.log(chalk.dim(`  ↳ Skipped (not visible): ${skipped.join(", ")}`));
                }
              } else {
                console.log(chalk.dim("\n  (No profile-fill available for this platform — using AI only)"));
              }

              // Step B: Gemini agent for remaining/complex fields
              if (useGemini && geminiKey) {
                console.log(chalk.bold("\n  Step 2: Gemini AI — analyzing remaining fields...\n"));

                const agent = new GeminiFormAgent({
                  apiKey: geminiKey,
                  profile,
                  resumeData: {},
                  jobTitle,
                  company: companyName,
                });

                try {
                  const result = await agent.run(browser!.page);
                  profile = loadProfile(); // reload in case agent saved new data

                  console.log(
                    chalk.green(
                      `\n  ✔ Gemini filled ${result.fieldsFilled} additional fields` +
                      (result.userPrompts > 0 ? ` · asked you ${result.userPrompts} questions` : "")
                    )
                  );
                } catch (agentErr: any) {
                  console.log(chalk.yellow(`\n  ⚠️  Gemini agent error: ${agentErr.message}`));
                }
              } else if (!geminiKey) {
                console.log(chalk.dim("\n  ℹ️  Set GEMINI_API_KEY to enable AI for complex/custom fields.\n"));
              }
            },
            { timeoutMs: 60_000, phase: "Form filling" },
          );

          if (fillResult === "manual") {
            console.log(chalk.yellow("\n  ✋ Manual mode — finish filling the form in the browser."));
          }

          // Step C: Ask user about any empty required fields (interactive only)
          await promptForMissingRequired(browser.page, profile);
        }
      } catch (err: any) {
        console.error(chalk.red(`\n❌ Error during form filling: ${err.message}`));
        console.log(chalk.dim("  The browser will stay open — continue manually.\n"));
      }

      // ── 8. Browser stays open — with proper cleanup ─────────────────────────
      console.log(
        chalk.bold.green("\n  ✅ Done! Review the browser and submit when ready.\n") +
        chalk.cyan("  👀 Check all filled fields before submitting.\n") +
        chalk.dim("  Press Ctrl+C to close the browser and exit.\n")
      );

      // Optional: update tracker after user confirms they submitted
      if (jobId) {
        const { markDone } = await prompt<{ markDone: string }>({
          type: "select",
          name: "markDone",
          message: "After submitting in the browser, update tracker status?",
          choices: [
            { name: "applied", message: "✅  Yes — mark as Applied" },
            { name: "skip", message: "⏭   No — keep current status" },
          ],
        }).catch(() => ({ markDone: "skip" }));

        const resolved = (markDone as any).markDone ?? markDone;
        if (resolved === "applied") {
          const updateResult = await jobsUpdate({
            jobId,
            status: "Applied",
            notes: `Auto-applied via cv jobs apply on ${new Date().toLocaleDateString()}`,
          }).catch(() => null);
          if (updateResult && !isApiError(updateResult)) {
            console.log(chalk.green("  ✔ Tracker updated → Applied\n"));
          }
        }
      }

      // ── Wait for exit & clean up properly ──────────────────────────────────
      // Ensure browser.close() is ALWAYS called so the Chromium process
      // terminates cleanly (saves storage state + kills process).
      let cleanedUp = false;
      const cleanup = async () => {
        if (cleanedUp) return;
        cleanedUp = true;
        await closeBrowserSafely(browser);
      };

      // Register cleanup for all exit signals
      process.once("SIGINT",  cleanup);
      process.once("SIGTERM", cleanup);

      // Poll until page/context closes OR user sends Ctrl+C
      await new Promise<void>((resolve) => {
        const timer = setInterval(async () => {
          try {
            // Check if the page or context has been closed
            if (browser!.page.isClosed()) {
              clearInterval(timer);
              await cleanup();
              resolve();
            }
          } catch {
            // page.isClosed() can throw if context is already destroyed
            clearInterval(timer);
            await cleanup();
            resolve();
          }
        }, 500);

        // Also resolve on SIGINT so we don't hang
        const onSig = async () => {
          clearInterval(timer);
          await cleanup();
          resolve();
        };
        process.once("SIGINT",  onSig);
        process.once("SIGTERM", onSig);
      });

      console.log(chalk.dim("\n  Browser closed. Goodbye!\n"));
    });
}

// ── HITL timeout gate ─────────────────────────────────────────────────────────
//
// Races an async operation against a timeout. On timeout, prompts the user:
//   "Do you want to fill this out manually (Y), or force the AI agent to
//    retry/continue (N)?"
//
// Returns "done" if the operation completed, "manual" if the user chose manual,
// or "done" after a successful retry.

type HITLResult = "done" | "manual";

async function withHITL(
  operation: () => Promise<void>,
  opts: { timeoutMs: number; phase: string },
): Promise<HITLResult> {
  const isInteractive = Boolean(process.stdin.isTTY);

  // Helper that races the operation against a timeout
  const raceWithTimeout = async (): Promise<"done" | "timeout"> => {
    return new Promise<"done" | "timeout">((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve("timeout");
        }
      }, opts.timeoutMs);

      operation()
        .then(() => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve("done");
          }
        })
        .catch((err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            console.log(chalk.yellow(`\n  ⚠️  ${opts.phase} error: ${err.message}`));
            resolve("timeout"); // treat errors like timeouts — offer HITL
          }
        });
    });
  };

  // First attempt
  const firstResult = await raceWithTimeout();
  if (firstResult === "done") return "done";

  // Timeout → prompt user
  const timeoutSec = Math.round(opts.timeoutMs / 1000);
  console.log(
    chalk.yellow(`\n  ⏳ ${opts.phase} is taking longer than expected (${timeoutSec}s).`)
  );

  if (!isInteractive) {
    // Non-interactive (agent subprocess) — auto-retry once, then fall back to manual
    console.log(chalk.dim("  (Non-interactive) Retrying once..."));
    const retryResult = await raceWithTimeout();
    return retryResult === "done" ? "done" : "manual";
  }

  const { choice } = await prompt<{ choice: string }>({
    type: "select",
    name: "choice",
    message: "Do you want to fill this out manually, or force the AI agent to retry?",
    choices: [
      { name: "manual", message: "✋  Yes — I'll fill it out manually (Y)" },
      { name: "retry", message: "🔄  No — retry / let the agent continue (N)" },
    ],
  }).catch(() => ({ choice: "manual" }));

  const resolved = (choice as any).choice ?? choice;

  if (resolved === "manual") {
    return "manual";
  }

  // Retry once
  console.log(chalk.dim(`\n  🔄 Retrying ${opts.phase.toLowerCase()}...`));
  const retryResult = await raceWithTimeout();
  if (retryResult === "done") return "done";

  // Still failing — fall back to manual
  console.log(chalk.yellow(`\n  ⏳ ${opts.phase} still not responding. Falling back to manual.`));
  return "manual";
}

// ── Helper: prompt for unfilled required fields ───────────────────────────────

async function promptForMissingRequired(
  _page: import("playwright").Page,
  profile: ApplyProfile,
): Promise<void> {
  // Skip entirely when not interactive (e.g. called from cv agent subprocess)
  if (!process.stdin.isTTY) return;

  // These are the most commonly required fields that might still be missing
  const requiredChecks: Array<{ key: keyof ApplyProfile; question: string }> = [
    { key: "firstName", question: "First name" },
    { key: "lastName",  question: "Last name" },
    { key: "email",     question: "Email" },
    { key: "phone",     question: "Phone (optional — press Enter to skip)" },
  ];

  let askedAny = false;
  for (const check of requiredChecks) {
    if (!profile[check.key]) {
      if (!askedAny) {
        console.log(chalk.yellow("\n  ⚠️  Some fields are missing from your profile:"));
        askedAny = true;
      }
      const { value } = await prompt<{ value: string }>({
        type: "input",
        name: "value",
        message: `  ${check.question}:`,
      }).catch(() => ({ value: "" }));
      const resolved = (value as any).value ?? value;
      if (resolved.trim()) {
        profile[check.key] = resolved.trim();
        saveProfile(profile);
      }
    }
  }
}

// ── Login wall detection ──────────────────────────────────────────────────────
//
// After navigation, checks whether the current page is a login/SSO wall
// rather than an application form. Uses a combination of URL patterns and
// DOM signals (login forms, OAuth buttons, "Sign In" headings).

async function detectLoginWall(page: import("playwright").Page): Promise<boolean> {
  try {
    const url = page.url().toLowerCase();

    // URL-level signals: common auth/login/SSO path segments
    const loginUrlPatterns = [
      /\/login/,
      /\/signin/,
      /\/sign-in/,
      /\/sign_in/,
      /\/auth\//,
      /\/sso\//,
      /\/oauth/,
      /\/account\/register/,
      /\/create-account/,
      /\/signup/,
      /\/sign-up/,
      /sso\./,
      /login\./,
      /auth0\.com/,
      /okta\.com/,
      /myworkday.*\/login/,
    ];

    if (loginUrlPatterns.some((p) => p.test(url))) {
      return true;
    }

    // DOM-level signals: look for login form elements and headings
    const hasLoginSignals = await page.evaluate(() => {
      const body = document.body?.innerText?.toLowerCase() || "";
      const title = document.title?.toLowerCase() || "";

      // Check for login-related page titles
      const loginTitlePatterns = [
        "sign in", "log in", "login", "sign up", "register",
        "create account", "create an account", "authenticate",
      ];
      const titleMatch = loginTitlePatterns.some((p) => title.includes(p));

      // Look for password fields (strong signal of a login form)
      const hasPasswordField = document.querySelector(
        'input[type="password"], input[autocomplete="current-password"], input[autocomplete="new-password"]'
      ) !== null;

      // Look for prominent login/signup buttons or links
      const loginButtonSelectors = [
        'button:has-text("Sign In")', 'button:has-text("Log In")',
        'button:has-text("Login")', 'button:has-text("Sign Up")',
        'button:has-text("Create Account")', 'button:has-text("Register")',
        'a:has-text("Sign In")', 'a:has-text("Log In")',
      ];

      // Check if the page has an email/username + password combo (login form)
      const hasEmailField = document.querySelector(
        'input[type="email"], input[name*="email"], input[name*="username"], input[autocomplete="username"]'
      ) !== null;

      // A password field + email/username field = very likely a login form
      // But ONLY if there's no resume upload or application-specific fields
      const hasResumeField = document.querySelector(
        'input[type="file"], [data-testid*="resume"], [aria-label*="resume" i], [name*="resume"]'
      ) !== null;

      // Strong signal: password field without resume upload = login wall
      if (hasPasswordField && !hasResumeField) {
        return true;
      }

      // Medium signal: title mentions login
      if (titleMatch && !hasResumeField) {
        return true;
      }

      // Check page text for OAuth-only pages (e.g. "Sign in with Google")
      const oauthPatterns = [
        "sign in with google", "sign in with linkedin",
        "sign in with microsoft", "continue with google",
        "continue with linkedin", "log in with sso",
      ];
      const hasOAuth = oauthPatterns.some((p) => body.includes(p));
      if (hasOAuth && hasEmailField && !hasResumeField) {
        return true;
      }

      return false;
    });

    return hasLoginSignals;
  } catch {
    // If page evaluation fails, assume no login wall
    return false;
  }
}

// ── Wait for user to complete login ───────────────────────────────────────────
//
// Races two signals:
//   1. User pressing Enter in the terminal (explicit "I'm done")
//   2. Auto-detection: polling every 2s to check if the login wall has cleared
//
// Resolves as soon as either signal fires.

async function waitForLoginCompletion(page: import("playwright").Page): Promise<void> {
  const isInteractive = Boolean(process.stdin.isTTY);

  return new Promise<void>((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    // Signal 1: User presses Enter in the terminal
    if (isInteractive) {
      const onData = (_data: Buffer) => {
        process.stdin.removeListener("data", onData);
        done();
      };
      // Ensure stdin is in flowing mode so we can read keypresses
      if (process.stdin.isPaused()) process.stdin.resume();
      process.stdin.once("data", onData);
    }

    // Signal 2: Auto-detect login completion by polling the page
    // We check every 3s if the login wall has cleared (no more password fields,
    // URL changed away from /login paths, etc.)
    const pollInterval = setInterval(async () => {
      try {
        if (page.isClosed()) {
          clearInterval(pollInterval);
          done();
          return;
        }

        const stillLogin = await detectLoginWall(page);
        if (!stillLogin) {
          clearInterval(pollInterval);
          // Give the page a moment to settle after redirect
          await new Promise((r) => setTimeout(r, 1500));
          done();
        }
      } catch {
        // Page might be navigating — ignore and try again
      }
    }, 3000);

    // Safety timeout: after 5 minutes, give up waiting
    setTimeout(() => {
      clearInterval(pollInterval);
      done();
    }, 5 * 60 * 1000);
  });
}

// ── Safe browser cleanup ──────────────────────────────────────────────────────
//
// Calls browser.close() which saves storage state (cookies/sessions) and
// terminates the Chromium process. Handles errors gracefully.

async function closeBrowserSafely(
  browser: Awaited<ReturnType<typeof launchApplyBrowser>> | null,
): Promise<void> {
  if (!browser) return;
  try {
    await browser.close();
  } catch {
    // Browser might already be closed — that's fine
  }
  // Force-exit the process to ensure no orphaned Chromium lingers
  // This is a safety net — browser.close() should handle it, but
  // in edge cases (WebSocket disconnect, etc.) we need this.
  setTimeout(() => process.exit(0), 500);
}
