import { Command } from "commander";
import chalk from "chalk";
import pkg from "enquirer";
import { getApiKey, getGeminiKey, setConfigValue } from "../config.js";
import { QueryEngine, CODING_AGENT_SYSTEM_PROMPT } from "../agent/QueryEngine.js";
import {
  ALL_CODING_TOOLS,
  readFileTool,
} from "../agent/tools/coding.js";
import { ALL_JOB_TOOLS } from "../agent/tools/jobs.js";
import { Tool } from "../agent/Tool.js";
import { publishSingleFile } from "./publish.js";
import { Type } from "@google/genai";
import ora from "ora";

const { prompt } = pkg;

// ---------------------------------------------------------------------------
// CareerVivid-specific tools (non-filesystem)
// ---------------------------------------------------------------------------

const PublishArticleTool: Tool = {
  name: "publish_article",
  description:
    "Publish a markdown article to CareerVivid. Provide the complete markdown content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the article." },
      content: { type: Type.STRING, description: "Full markdown content." },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of tags for the article.",
      },
    },
    required: ["title", "content"],
  },
  execute: async (args: { title: string; content: string; tags?: string[] }) => {
    const fs = await import("fs");
    const path = await import("path");
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filePath = path.join(process.cwd(), `${slug || "article"}.md`);
    fs.writeFileSync(filePath, args.content, "utf-8");
    const result = await publishSingleFile(
      filePath,
      args.content,
      { title: args.title, type: "article", format: "markdown", tags: (args.tags || []).join(",") },
      true,
    );
    return result.success
      ? `Published! URL: ${result.url} | ID: ${result.postId}`
      : "Failed to publish article.";
  },
};

const GenerateDiagramTool: Tool = {
  name: "generate_diagram",
  description:
    "Publish a Mermaid diagram as a whiteboard to CareerVivid. Provide valid Mermaid syntax.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the diagram." },
      content: { type: Type.STRING, description: "Mermaid diagram code (e.g. graph TD...)." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags." },
    },
    required: ["title", "content"],
  },
  execute: async (args: { title: string; content: string; tags?: string[] }) => {
    const fs = await import("fs");
    const path = await import("path");
    const slug = args.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filePath = path.join(process.cwd(), `${slug || "diagram"}.mmd`);
    fs.writeFileSync(filePath, args.content, "utf-8");
    const result = await publishSingleFile(
      filePath,
      args.content,
      { title: args.title, type: "whiteboard", format: "mermaid", tags: (args.tags || []).join(",") },
      true,
    );
    return result.success
      ? `Published! URL: ${result.url} | ID: ${result.postId}`
      : "Failed to publish diagram.";
  },
};

// ---------------------------------------------------------------------------
// Register command
// ---------------------------------------------------------------------------

export function registerAgentCommand(program: Command) {
  program
    .command("agent")
    .description("Start an interactive autonomous AI agent in your terminal.")
    .option("--coding", "Enable full coding tool suite (file I/O, shell, search).")
    .option("--resume", "Add resume tools — load and discuss your CareerVivid resume.")
    .option("--jobs", "Add job-hunting tools — search jobs, save to tracker, update statuses.")
    .option("--pro", "Use gemini-3.1-pro-preview with thinking mode (recommended for complex tasks).")
    .option(
      "--think <budget>",
      "Enable Gemini thinking mode with the given token budget (e.g. 8192).",
      parseInt,
    )
    .option("--verbose", "Show thinking tokens in the output (requires --think or --pro).")
    .option("--project <id>", "GCP project ID for Vertex AI mode (uses gcloud ADC, no API key needed).")
    .action(async (options) => {
      // ------------------------------------------------------------------
      // Credentials — read from config; model selector may prompt for key
      // ------------------------------------------------------------------
      let apiKey = getGeminiKey();
      const project = options.project ?? process.env.GOOGLE_CLOUD_PROJECT;

      // We allow no-creds at this point; the model selector may prompt for a key below.

      // ------------------------------------------------------------------
      // Tool selection
      // ------------------------------------------------------------------
      const tools: Tool[] = [readFileTool, PublishArticleTool, GenerateDiagramTool];

      if (options.coding) {
        // Replace readFileTool with the full coding suite (includes improved read_file)
        tools.length = 0;
        tools.push(...ALL_CODING_TOOLS, PublishArticleTool, GenerateDiagramTool);
      }

      // --resume adds resume tool; --jobs adds all job-hunting tools (includes resume)
      if (options.jobs) {
        for (const t of ALL_JOB_TOOLS) {
          if (!tools.find((x) => x.name === t.name)) tools.push(t);
        }
      } else if (options.resume) {
        const resumeTool = ALL_JOB_TOOLS.find((t) => t.name === "get_resume");
        if (resumeTool && !tools.find((x) => x.name === "get_resume")) {
          tools.push(resumeTool);
        }
      }

      // ------------------------------------------------------------------
      // Model selection
      // ------------------------------------------------------------------
      const isPro = Boolean(options.pro);

      // Model definitions ─ key is the display label, value is the API string
      const MODEL_CHOICES = [
        {
          name: `⚡ gemini-2.5-flash          ${chalk.gray("(Public · stable · no API key needed)")}`,
          value: "gemini-2.5-flash",
          requiresKey: false,
        },
        {
          name: `🚀 gemini-3.1-flash-lite-preview  ${chalk.gray("(Local Execution · fast · API key required)")}`,
          value: "gemini-3.1-flash-lite-preview",
          requiresKey: true,
        },
        {
          name: `🧠 gemini-3.1-pro-preview    ${chalk.gray("(Local Thinking · reasoning · API key required)")}`,
          value: "gemini-3.1-pro-preview",
          requiresKey: true,
        },
      ];

      let selectedModel: string;
      let thinkingBudget: number;

      if (isPro) {
        // --pro bypasses the selector
        selectedModel = "gemini-3.1-pro-preview";
        thinkingBudget = options.think ?? 8192;
      } else {
        // Interactive model selector
        const modelAnswer = await prompt<{ model: string }>({
          type: "select",
          name: "model",
          message: "Choose a model:",
          choices: MODEL_CHOICES.map((m) => ({
            name: m.value,       // The internal selected value
            message: m.name,     // What the user sees in the list
          })),
        });
        selectedModel = modelAnswer.model;
        thinkingBudget = options.think ?? (selectedModel === "gemini-3.1-pro-preview" ? 8192 : 0);
      }

      // Check if the selected model needs an API key
      const chosenModelMeta = MODEL_CHOICES.find((m) => m.value === selectedModel);
      if (chosenModelMeta?.requiresKey && !apiKey) {
        console.log(chalk.yellow("\n🔑 This model requires a personal Gemini API key."));
        console.log(chalk.dim("  Get a free key at: https://aistudio.google.com/app/apikey\n"));

        const keyAnswer = await prompt<{ key: string }>({
          type: "password",
          name: "key",
          message: "Enter your Gemini API key:",
        });

        const enteredKey = keyAnswer.key.trim();
        if (!enteredKey) {
          console.log(chalk.red("\n❌ No API key provided. Exiting."));
          process.exit(1);
        }

        // Persist so the user won't be asked again
        setConfigValue("geminiKey", enteredKey);
        apiKey = enteredKey;
        console.log(chalk.green("  ✔ API key saved to ~/.careervividrc.json\n"));
      } else if (!chosenModelMeta?.requiresKey && !apiKey && !project) {
        // Public model but no credentials at all — still need something
        console.log(chalk.red("\n❌ No Gemini credentials found."));
        console.log();
        console.log(chalk.cyan("Option A — Gemini API Key:"));
        console.log(chalk.yellow("  cv config set geminiKey YOUR_KEY"));
        console.log(chalk.cyan("Option B — gcloud ADC:"));
        console.log(chalk.yellow("  cv agent --project YOUR_GCP_PROJECT_ID"));
        console.log();
        process.exit(1);
      }

      const includeThoughts: boolean = Boolean(options.verbose);

      // Build system prompt — extend base with job context when relevant
      let systemInstruction = CODING_AGENT_SYSTEM_PROMPT;
      if (options.jobs) {
        systemInstruction += `

## Job Hunting Capabilities

You also have access to job-hunting tools:
- **get_resume** — Load the user's CareerVivid resume to understand their background and skills.
- **search_jobs** — Search for jobs scored against the user's resume. Always call get_resume first if you haven't yet.
- **save_job** — Save an interesting job to the user's /job-tracker Kanban board.
- **list_jobs** — Show what's in the job tracker, optionally filtered by status.
- **update_job_status** — Move a job between: To Apply → Applied → Interviewing → Offered / Rejected.

When the user asks about jobs or their resume, proactively use these tools.

CRITICAL INSTRUCTIONS FOR JOB SEARCH:
1. When the user asks to search for jobs, you MUST first check if they have a resume by calling the \`get_resume\` tool.
2. If the user does not have a resume (the tool returns empty or fails), DO NOT search yet. Instead, guide them to create one at https://careervivid.app/newresume.
3. If the user DOES have a resume (loaded successfully), explicitly ask them first: "Do you want to search for jobs based on your resume, or search for something specific like a particular role and location?"
4. When presenting job search results from the \`search_jobs\` tool, ALWAYS format the output cleanly and professionally as a Markdown list or table. Make sure it is not messy, highlighting the Company, Role, salary, location, and the match score clearly.
5. After a job search, summarize the top 3–5 results and ask if they want to save any to their tracker.
6. If the user asks you to auto-apply for jobs, explain that you cannot apply on external platforms but can help keep track of their applications. Furthermore, you MUST explicitly offer to "Generate Comprehensive Interview Preparation Notes" (or use similar professional vocabulary) to help them prepare for the roles.`;
      } else if (options.resume) {
        systemInstruction += `

## Resume Access

You have access to the **get_resume** tool which fetches the user's CareerVivid resume.
When the user asks about their resume, skills, experience, or career background, call get_resume to load it first.`;
      }

      const engine = new QueryEngine({
        apiKey: apiKey || undefined,
        project: project || undefined,
        model: selectedModel,
        systemInstruction,
        tools,
        thinkingBudget,
        includeThoughts,
        maxHistoryLength: 40,
      });

      // Banner shows which auth mode is active
      const authMode = apiKey ? `API key (${apiKey.slice(0, 8)}…)` : `Vertex AI / ADC (${project})`;
      console.log(chalk.gray(`  Auth: ${authMode}`));

      // ------------------------------------------------------------------
      // Banner
      // ------------------------------------------------------------------
      console.log(chalk.bold.cyan("\n🤖 CareerVivid Agent"));
      if (options.coding) {
        console.log(chalk.green("  ✔ Coding mode: file I/O, shell, search tools active"));
      }
      if (options.jobs) {
        console.log(chalk.cyan("  ✔ Job mode: search, save, list, status update tools active"));
      } else if (options.resume) {
        console.log(chalk.cyan("  ✔ Resume mode: get_resume tool active"));
      }
      if (isPro) {
        console.log(chalk.magenta(`  ✔ Pro mode: ${selectedModel} + thinking (${thinkingBudget} tokens)`));
      } else if (thinkingBudget > 0) {
        console.log(chalk.yellow(`  ✔ Thinking mode: ${thinkingBudget} token budget`));
      }
      console.log(chalk.gray(`  Model: ${selectedModel}`));
      console.log(chalk.gray(`  Type 'exit' to quit.\n`));

      // ------------------------------------------------------------------
      // REPL
      // ------------------------------------------------------------------
      const ask = async () => {
        try {
          const response = await prompt<{ query: string }>({
            type: "input",
            name: "query",
            message: chalk.bold.cyan("❯"),
          });

          const userInput = response.query.trim();
          if (!userInput) return ask();
          if (userInput.toLowerCase() === "exit") {
            console.log(chalk.gray("\nGoodbye! 👋\n"));
            process.exit(0);
          }

          // Print a spinner-like newline while thinking
          process.stdout.write(chalk.dim("\n⏳ Thinking...\n\n"));

          let firstChunk = true;
          let currentSpinner: any = null;

          await engine.runLoopStreaming(userInput, {
            onChunk: (text) => {
              if (firstChunk) {
                // Clear the "Thinking..." line
                process.stdout.write("\r\x1b[K");
                firstChunk = false;
              }
              process.stdout.write(chalk.green(text));
            },
            onThinking: (thought) => {
              if (options.verbose) {
                console.log(chalk.dim(`\n[thinking] ${thought.substring(0, 200)}...`));
              }
            },
            onToolCall: async (name, args) => {
              console.log(chalk.yellow(`\n🛠️  Tool: ${chalk.bold(name)}`));
              console.log(chalk.dim(`   Args: ${JSON.stringify(args, null, 2)}`));

              // All run_command calls require explicit user confirmation
              if (name === "run_command") {
                const confirm = await prompt<{ ok: string }>({
                  type: "select",
                  name: "ok",
                  message: `Allow running: ${chalk.bold(args.command)}?`,
                  choices: ["Yes, run it", "No, skip it"],
                });
                return confirm.ok === "Yes, run it";
              }

              // write_file and patch_file also require confirmation
              if (name === "write_file" || name === "patch_file") {
                const target = args.path || "(unknown path)";
                const confirm = await prompt<{ ok: string }>({
                  type: "select",
                  name: "ok",
                  message: `Allow writing to: ${chalk.bold(target)}?`,
                  choices: ["Yes, write it", "No, skip it"],
                });
                if (confirm.ok !== "Yes, write it") return false;
              }

              currentSpinner = ora(`Running ${chalk.bold(name)}...`).start();
              return true; // auto-approve read-only tools or after approval
            },
            onToolResult: (name, result) => {
              if (currentSpinner) {
                currentSpinner.succeed(`Finished ${chalk.bold(name)}`);
                currentSpinner = null;
              }
              const preview =
                typeof result === "string" ? result.substring(0, 120) : JSON.stringify(result).substring(0, 120);
              console.log(chalk.dim(`   ✅ ${name}: ${preview}${preview.length >= 120 ? "…" : ""}\n`));
            },
            onCompacting: () => {
              console.log(chalk.dim("\n📦 Compacting context window...\n"));
            },
            onError: (error) => {
              if (currentSpinner) {
                currentSpinner.fail(`Tool error`);
                currentSpinner = null;
              }
              console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
            },
          });

          console.log("\n"); // newline after streaming response
          ask();
        } catch (err: any) {
          if (err.message === "" || err.message === "canceled") {
            // Ctrl+C
            process.exit(0);
          }
          console.error(chalk.red(String(err)));
          ask();
        }
      };

      await ask();
    });
}
