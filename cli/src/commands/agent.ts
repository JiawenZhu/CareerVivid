import { Command } from "commander";
import chalk from "chalk";
import pkg from "enquirer";
import {
  getApiKey,
  getGeminiKey,
  setConfigValue,
  loadConfig,
  saveConfig,
  getLlmConfig,
  type LLMProvider,
} from "../config.js";
import { QueryEngine, CODING_AGENT_SYSTEM_PROMPT } from "../agent/QueryEngine.js";
import { CareerVividProxyEngine } from "../agent/CareerVividProxyEngine.js";
import {
  ALL_CODING_TOOLS,
  readFileTool,
} from "../agent/tools/coding.js";
import { ALL_JOB_TOOLS } from "../agent/tools/jobs.js";
import { Tool } from "../agent/Tool.js";
import { publishSingleFile } from "./publish.js";
import { Type } from "@google/genai";
import ora from "ora";
import { AgentCreditsClient } from "../agent/AgentCreditsClient.js";

const { prompt } = pkg;

// ---------------------------------------------------------------------------
// Credit costs (mirrors agentCredits.ts on the server)
// ---------------------------------------------------------------------------
const MODEL_CREDIT_COST: Record<string, number> = {
  "gemini-3.1-flash-lite-preview": 0.5,
  "gemini-2.5-flash": 1,
  "gemini-3.1-pro-preview": 2,
};

// ---------------------------------------------------------------------------
// CareerVivid-specific tools
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
// Helper: print credit status inline
// ---------------------------------------------------------------------------
function printCreditStatus(remaining: number | null, limit: number | null = null) {
  if (remaining === null) return;
  const pct = limit ? remaining / limit : 1;
  if (remaining === 0) {
    console.log(
      chalk.red(
        "\n⚠️  Credit limit reached (0 remaining).\n" +
          chalk.dim("   Buy more at ") +
          chalk.underline.blue("careervivid.app/developer") +
          chalk.dim(" → \"Top Up Credits\"\n") +
          chalk.dim("   Or use your own API key: ") +
          chalk.yellow("cv agent --provider openai"),
      ),
    );
  } else if (remaining < 10 || pct < 0.05) {
    console.log(chalk.yellow(`\n💳 Credits remaining: ${remaining}  ⚠️  Running low`));
    if (remaining < 20 && limit !== null) {
      console.log(
        chalk.dim(
          "   💡 Tip: Switch to gemini-3.1-flash-lite-preview (0.5 cr/turn) to stretch your budget.",
        ),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// cv agent config — interactive wizard
// ---------------------------------------------------------------------------
async function runAgentConfig(): Promise<void> {
  console.log(chalk.bold.cyan("\n⚙️  CareerVivid Agent — Provider Configuration\n"));

  const PROVIDERS: Array<{ name: string; value: LLMProvider; hint: string }> = [
    {
      name: "CareerVivid Cloud",
      value: "careervivid",
      hint: "Gemini models, billed from your CareerVivid credits",
    },
    { name: "OpenAI", value: "openai", hint: "GPT-4o, o3-mini, etc." },
    { name: "Anthropic", value: "anthropic", hint: "Claude Opus, Sonnet, Haiku" },
    {
      name: "OpenRouter",
      value: "openrouter",
      hint: "100+ models: Kimi, GLM, Qwen, Mistral, Llama…",
    },
    { name: "Gemini (personal key)", value: "gemini", hint: "Use your own Google AI Studio key" },
    { name: "Custom endpoint", value: "custom", hint: "Any OpenAI-compatible API" },
  ];

  const providerAnswer = await prompt<{ provider: LLMProvider }>({
    type: "select",
    name: "provider",
    message: "Choose your default LLM provider:",
    choices: PROVIDERS.map((p) => ({
      name: p.value,
      message: `${chalk.bold(p.name)}  ${chalk.dim(p.hint)}`,
    })),
  });

  const chosen = providerAnswer.provider;
  const cfg = loadConfig();
  cfg.llmProvider = chosen;

  if (chosen !== "careervivid") {
    const keyAnswer = await prompt<{ key: string }>({
      type: "password",
      name: "key",
      message: `Enter your ${PROVIDERS.find((p) => p.value === chosen)?.name} API key:`,
    });
    cfg.llmApiKey = keyAnswer.key.trim();

    if (chosen === "custom") {
      const urlAnswer = await prompt<{ url: string }>({
        type: "input",
        name: "url",
        message: "Base URL (e.g. https://api.example.com/v1):",
      });
      cfg.llmBaseUrl = urlAnswer.url.trim();
    }

    if (chosen !== "gemini") {
      const modelAnswer = await prompt<{ model: string }>({
        type: "input",
        name: "model",
        message: "Default model (e.g. gpt-4o, claude-opus-4-5, moonshotai/moonshot-v1-8k):",
        initial: chosen === "openai" ? "gpt-4o" : chosen === "anthropic" ? "claude-opus-4-5" : "",
      });
      cfg.llmModel = modelAnswer.model.trim();
    }
  } else {
    // Reset to CareerVivid defaults
    delete cfg.llmApiKey;
    delete cfg.llmBaseUrl;
    delete cfg.llmModel;
  }

  saveConfig(cfg);
  console.log(chalk.green("\n✔ Configuration saved to ~/.careervividrc.json\n"));
  console.log(chalk.dim("  Run `cv agent` to start using your new provider."));
}

// ---------------------------------------------------------------------------
// Register command
// ---------------------------------------------------------------------------

export function registerAgentCommand(program: Command) {
  // ── cv agent (main) ─────────────────────────────────────────────────────
  const agentCmd = program
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
    .option("--provider <provider>", "Override LLM provider (careervivid|openai|anthropic|openrouter|gemini|custom).")
    .option("--model <model>", "Override model (e.g. gpt-4o, claude-opus-4-5).")
    .option("--api-key <key>", "BYO API key for this session (not saved).")
    .option("--base-url <url>", "Custom OpenAI-compatible base URL.")
    .action(async (options) => {
      // ── Resolve credential / provider config ────────────────────────────
      const cvApiKey = getApiKey(); // CareerVivid platform key (cv_live_...)
      const project = options.project ?? process.env.GOOGLE_CLOUD_PROJECT;

      // Check if no CareerVivid key and not using BYO
      const wantsCareerVividCloud = !options.provider || options.provider === "careervivid";
      if (wantsCareerVividCloud && !cvApiKey && !project && !options.apiKey) {
        console.log(chalk.red("\n❌ You need a CareerVivid API key to use the agent.\n"));
        console.log(
          "   Run: " + chalk.cyan("cv login") + "  then visit " +
          chalk.underline.blue("careervivid.app/developer") +
          "\n   to generate your free API key.\n",
        );
        console.log(
          chalk.dim("   💡 Or bring your own API key: ") +
          chalk.yellow("cv agent --provider openai --api-key sk-..."),
        );
        process.exit(1);
      }

      // ── Tool selection ──────────────────────────────────────────────────
      const tools: Tool[] = [readFileTool, PublishArticleTool, GenerateDiagramTool];

      if (options.coding) {
        tools.length = 0;
        tools.push(...ALL_CODING_TOOLS, PublishArticleTool, GenerateDiagramTool);
      }

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

      // ── Model / provider resolution ─────────────────────────────────────
      const isPro = Boolean(options.pro);
      const llmCfg = getLlmConfig({
        provider: options.provider as LLMProvider | undefined,
        model: options.model,
        apiKey: options["api-key"] || options.apiKey,
        baseUrl: options["base-url"] || options.baseUrl,
      });

      // CareerVivid-managed Gemini models
      const CV_MODELS = [
        {
          name: `⚡ gemini-3.1-flash-lite-preview  ${chalk.gray("[0.5 credit/turn — fastest]")}`,
          value: "gemini-3.1-flash-lite-preview",
          cost: 0.5,
          careerVivid: true,
        },
        {
          name: `⚡ gemini-2.5-flash               ${chalk.gray("[1 credit/turn — default]")}`,
          value: "gemini-2.5-flash",
          cost: 1,
          careerVivid: true,
        },
        {
          name: `🧠 gemini-3.1-pro-preview         ${chalk.gray("[2 credits/turn — deep reasoning]")}`,
          value: "gemini-3.1-pro-preview",
          cost: 2,
          careerVivid: true,
        },
      ];

      // BYO provider options
      const BYO_MODELS = [
        {
          name: `🔵 OpenAI          ${chalk.gray("GPT-4o, o3-mini, … [0 credits — you pay provider]")}`,
          value: "__openai__",
          cost: 0,
          careerVivid: false,
        },
        {
          name: `🟣 Anthropic       ${chalk.gray("Claude Opus, Sonnet, Haiku")}`,
          value: "__anthropic__",
          cost: 0,
          careerVivid: false,
        },
        {
          name: `🟡 Gemini          ${chalk.gray("Personal Google AI Studio key")}`,
          value: "__gemini__",
          cost: 0,
          careerVivid: false,
        },
        {
          name: `🔶 OpenRouter      ${chalk.gray("100+ models: Kimi, GLM, Qwen, Mistral, Llama…")}`,
          value: "__openrouter__",
          cost: 0,
          careerVivid: false,
        },
        {
          name: `⚙️  Custom endpoint ${chalk.gray("Any OpenAI-compatible endpoint")}`,
          value: "__custom__",
          cost: 0,
          careerVivid: false,
        },
      ];

      let selectedModel: string;
      let thinkingBudget: number;
      let selectedProvider: LLMProvider;

      if (isPro) {
        selectedModel = "gemini-3.1-pro-preview";
        thinkingBudget = options.think ?? 8192;
        selectedProvider = "careervivid";
      } else if (options.provider && options.provider !== "careervivid") {
        // BYO provider from flag — skip the picker
        selectedProvider = llmCfg.provider;
        selectedModel = llmCfg.model;
        thinkingBudget = 0;
      } else if (llmCfg.provider !== "careervivid") {
        // BYO in config — skip picker
        selectedProvider = llmCfg.provider;
        selectedModel = llmCfg.model;
        thinkingBudget = 0;
      } else {
        // Interactive selector — CareerVivid cloud first, then BYO
        const ALL_CHOICES = [
          { name: "──── CareerVivid Cloud (credits from your account) ────", disabled: true, value: "__header1__" },
          ...CV_MODELS,
          { name: "──── Bring Your Own API Key (0 credits) ────", disabled: true, value: "__header2__" },
          ...BYO_MODELS,
        ];

        const modelAnswer = await prompt<{ model: string }>({
          type: "select",
          name: "model",
          message: "Choose how to run the agent:",
          choices: ALL_CHOICES.map((m) => ({
            name: m.value,
            message: m.name,
            disabled: (m as any).disabled,
          })),
        });

        const picked = modelAnswer.model;

        if (picked.startsWith("__") && !picked.startsWith("__header")) {
          // BYO provider selected from picker
          const providerMap: Record<string, LLMProvider> = {
            __openai__: "openai",
            __anthropic__: "anthropic",
            __gemini__: "gemini",
            __openrouter__: "openrouter",
            __custom__: "custom",
          };
          selectedProvider = providerMap[picked] || "openai";

          // Check if key is in config
          const savedKey = loadConfig().llmApiKey;
          if (!savedKey) {
            console.log(chalk.yellow(`\n🔑 BYO API key needed for ${selectedProvider}.`));
            console.log(chalk.dim("  Run: cv agent config   to save your key permanently.\n"));
            const keyAnswer = await prompt<{ key: string }>({
              type: "password",
              name: "key",
              message: `Enter your ${selectedProvider} API key:`,
            });
            options["api-key"] = keyAnswer.key.trim();
          }

          const modelAnswer2 = await prompt<{ model: string }>({
            type: "input",
            name: "model",
            message: "Model name:",
            initial:
              selectedProvider === "openai"
                ? "gpt-4o"
                : selectedProvider === "anthropic"
                  ? "claude-opus-4-5"
                  : selectedProvider === "gemini"
                    ? "gemini-2.5-flash"
                    : "openai/gpt-4o",
          });
          selectedModel = modelAnswer2.model.trim();
          thinkingBudget = 0;
        } else {
          // CareerVivid Gemini model
          selectedModel = picked;
          selectedProvider = "careervivid";
          thinkingBudget = options.think ?? (picked === "gemini-3.1-pro-preview" ? 8192 : 0);
        }
      }

      // ── Resolve actual API key for Gemini models ─────────────────────────
      let geminiApiKey: string | undefined;
      if (selectedProvider === "careervivid") {
        // CareerVivid Cloud — requests are proxied server-side (no personal key needed)
        // Only fall back to a direct key if a Vertex AI project is set
        if (!cvApiKey && !project) {
          console.log(chalk.red("\n❌ No credentials found. Please log in first.\n"));
          console.log("   " + chalk.cyan("cv login"));
          process.exit(1);
        }
      } else if (selectedProvider === "gemini") {
        geminiApiKey = options["api-key"] || loadConfig().llmApiKey || getGeminiKey();
        if (!geminiApiKey) {
          console.log(chalk.yellow("\n🔑 Personal Gemini API key required."));
          console.log(chalk.dim("  Get one at: https://aistudio.google.com/app/apikey\n"));
          const k = await prompt<{ key: string }>({ type: "password", name: "key", message: "Gemini API key:" });
          geminiApiKey = k.key.trim();
          setConfigValue("geminiKey", geminiApiKey);
        }
      }

      const byoApiKey = options["api-key"] || loadConfig().llmApiKey;

      const includeThoughts: boolean = Boolean(options.verbose);

      // ── System prompt ────────────────────────────────────────────────────
      let systemInstruction = CODING_AGENT_SYSTEM_PROMPT;
      if (options.jobs) {
        systemInstruction += `

## Job Hunting Capabilities

You also have access to job-hunting tools:
- **get_resume** — Load the user's CareerVivid resume to understand their background and skills.
- **list_resumes** — List all of the user's uploaded CareerVivid resumes.
- **tailor_resume** — Tailor or refine the user's resume using AI. You can target a specific job description or refine via general instructions. Use this whenever the user wants to update their resume.
- **delete_resume** — Delete a user's CareerVivid resume permanently.
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

      // ── Engine selection ─────────────────────────────────────────────────
      // CareerVivid Cloud → use ProxyEngine (routes through agentProxy function)
      // Personal Gemini key / Vertex AI → use QueryEngine (direct Gemini API)
      // BYO non-Gemini providers → handled inline in the REPL below
      let engine: QueryEngine | CareerVividProxyEngine | null = null;

      if (selectedProvider === "careervivid" && cvApiKey) {
        // Secure proxy path — no personal Gemini key required
        engine = new CareerVividProxyEngine({
          cvApiKey,
          model: selectedModel,
          systemInstruction,
          tools,
          thinkingBudget,
          includeThoughts,
          maxHistoryLength: 40,
        });
      } else if (selectedProvider === "careervivid" || selectedProvider === "gemini") {
        // Vertex AI or personal Gemini key path
        engine = new QueryEngine({
          apiKey: geminiApiKey || undefined,
          project: project || undefined,
          model: selectedModel,
          systemInstruction,
          tools,
          thinkingBudget,
          includeThoughts,
          maxHistoryLength: 40,
        });
      }
      // BYO non-Gemini providers are handled inline in the REPL below

      // ── Banner ───────────────────────────────────────────────────────────
      console.log(chalk.bold.cyan("\n🤖 CareerVivid Agent"));
      if (selectedProvider === "careervivid") {
        const cost = MODEL_CREDIT_COST[selectedModel] ?? 1;
        console.log(
          chalk.dim(`  Model: ${selectedModel}`) +
          chalk.gray(`  [${cost} credit${cost !== 1 ? "s" : ""}/turn via CareerVivid Cloud]`),
        );
      } else {
        console.log(chalk.cyan(`  Provider: ${selectedProvider}  Model: ${selectedModel}  [0 credits]`));
      }

      if (options.coding) console.log(chalk.green("  ✔ Coding mode: file I/O, shell, search tools active"));
      if (options.jobs) console.log(chalk.cyan("  ✔ Job mode: search, save, list, status update tools active"));
      else if (options.resume) console.log(chalk.cyan("  ✔ Resume mode: get_resume tool active"));
      if (isPro) console.log(chalk.magenta(`  ✔ Pro mode: ${selectedModel} + thinking (${thinkingBudget} tokens)`));
      else if (thinkingBudget > 0) console.log(chalk.yellow(`  ✔ Thinking mode: ${thinkingBudget} token budget`));
      console.log(chalk.gray(`  Type 'exit' to quit.\n`));

      // ── Session tracking ─────────────────────────────────────────────────
      let sessionTurns = 0;
      let sessionLimit: number | null = null;

      // ── REPL ─────────────────────────────────────────────────────────────
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
            // ── Session summary ──────────────────────────────────────────
            const proxyEngine = engine instanceof CareerVividProxyEngine ? engine : null;
            if (proxyEngine && sessionTurns > 0) {
              console.log(chalk.dim("\n─────────────────────────────────────────"));
              console.log(
                chalk.dim(`Session: ${sessionTurns} turn${sessionTurns !== 1 ? "s" : ""} · `) +
                chalk.yellow(`${proxyEngine.sessionUsed.toFixed(1)} credits used`),
              );
              if (proxyEngine.remaining !== null) {
                console.log(chalk.dim(`Remaining: ${proxyEngine.remaining} credits`));
              }
              console.log(chalk.dim("─────────────────────────────────────────"));
            }
            console.log(chalk.gray("\nGoodbye! 👋\n"));
            process.exit(0);
          }

          process.stdout.write(chalk.dim("\n⏳ Thinking...\n\n"));

          let firstChunk = true;
          let currentSpinner: any = null;

          const handleToolCall = async (name: string, args: any): Promise<boolean> => {
            console.log(chalk.yellow(`\n🛠️  Tool: ${chalk.bold(name)}`));
            console.log(chalk.dim(`   Args: ${JSON.stringify(args, null, 2)}`));

            if (name === "run_command") {
              const confirm = await prompt<{ ok: string }>({
                type: "select",
                name: "ok",
                message: `Allow running: ${chalk.bold(args.command)}?`,
                choices: ["Yes, run it", "No, skip it"],
              });
              return confirm.ok === "Yes, run it";
            }

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
            return true;
          };

          const handleToolResult = (name: string, result: any) => {
            if (currentSpinner) {
              currentSpinner.succeed(`Finished ${chalk.bold(name)}`);
              currentSpinner = null;
            }
            const preview =
              typeof result === "string"
                ? result.substring(0, 120)
                : JSON.stringify(result).substring(0, 120);
            console.log(chalk.dim(`   ✅ ${name}: ${preview}${preview.length >= 120 ? "…" : ""}\n`));
          };

          // ── Run the agentic loop ─────────────────────────────────────────
          if (engine) {
            // Shared hooks for both QueryEngine and CareerVividProxyEngine
            const sharedOnChunk = (text: string) => {
              if (firstChunk) {
                process.stdout.write("\r\x1b[K");
                firstChunk = false;
              }
              process.stdout.write(chalk.green(text));
            };
            const sharedOnError = (error: Error) => {
              if (currentSpinner) {
                currentSpinner.fail("Tool error");
                currentSpinner = null;
              }
              console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
            };

            if (engine instanceof CareerVividProxyEngine) {
              // Proxy engine — credits are deducted server-side atomically
              await engine.runLoopStreaming(userInput, {
                onChunk: sharedOnChunk,
                onThinking: (thought: string) => {
                  if (options.verbose) {
                    console.log(chalk.dim(`\n[thinking] ${thought.substring(0, 200)}...`));
                  }
                },
                onToolCall: handleToolCall,
                onToolResult: handleToolResult,
                onCompacting: () => {
                  console.log(chalk.dim("\n📦 Compacting context window...\n"));
                },
                onError: sharedOnError,
                onResponse: async (creditInfo) => {
                  sessionLimit = creditInfo.monthlyLimit;
                  printCreditStatus(creditInfo.creditsRemaining, sessionLimit);
                },
                onCreditLimitReached: (remaining) => {
                  console.log(
                    chalk.red(
                      "\n\n⚠️  Credit limit reached (" + remaining + " remaining).\n" +
                        chalk.dim("   Upgrade or top up at ") +
                        chalk.underline.blue("careervivid.app/developer"),
                    ),
                  );
                },
              });
            } else {
              // QueryEngine — direct Gemini call (personal key / Vertex AI)
              await (engine as QueryEngine).runLoopStreaming(userInput, {
                onChunk: sharedOnChunk,
                onThinking: (thought: string) => {
                  if (options.verbose) {
                    console.log(chalk.dim(`\n[thinking] ${thought.substring(0, 200)}...`));
                  }
                },
                onToolCall: handleToolCall,
                onToolResult: handleToolResult,
                onCompacting: () => {
                  console.log(chalk.dim("\n📦 Compacting context window...\n"));
                },
                onError: sharedOnError,
              } as any);
            }
          } else {
            // BYO non-Gemini provider
            // Dynamic import to avoid bundling unless needed
            const { createOpenAICompatibleProvider } = await import(
              "../agent/providers/OpenAIProvider.js"
            );
            const { AnthropicProvider } = await import(
              "../agent/providers/AnthropicProvider.js"
            );

            const key = byoApiKey || getGeminiKey() || "";
            const baseUrl = options["base-url"] || loadConfig().llmBaseUrl;

            if (selectedProvider === "anthropic") {
              const anthropic = new AnthropicProvider({ apiKey: key });
              // Minimal direct call (no multi-turn tool loop for BYO yet)
              const result = await anthropic.generate({
                history: [],
                userTurn: { role: "user", parts: [{ text: userInput }] },
                tools,
                systemInstruction,
              });
              process.stdout.write("\r\x1b[K");
              console.log(chalk.green(result.text));
            } else {
              // openai / openrouter / custom / gemini (BYO)
              const subProvider = (
                selectedProvider === "openrouter" ? "openrouter" :
                selectedProvider === "custom" ? "custom" :
                "openai"
              ) as any;
              const openai = createOpenAICompatibleProvider(subProvider, key, baseUrl);
              const response = await fetch(
                `${(openai as any).baseUrl}/chat/completions`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`,
                    ...((openai as any).extraHeaders || {}),
                  },
                  body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                      { role: "system", content: systemInstruction },
                      { role: "user", content: userInput },
                    ],
                  }),
                },
              );
              const d: any = await response.json();
              const text = d.choices?.[0]?.message?.content || "(no response)";
              process.stdout.write("\r\x1b[K");
              console.log(chalk.green(text));
            }

            firstChunk = false;
          }

          sessionTurns++;
          console.log("\n");
          ask();
        } catch (err: any) {
          if (err.message === "" || err.message === "canceled") {
            process.exit(0);
          }
          console.error(chalk.red(String(err)));
          ask();
        }
      };

      await ask();
    });

  // ── cv agent config sub-command ──────────────────────────────────────────
  agentCmd
    .command("config")
    .description("Configure your default LLM provider and API key for the agent.")
    .action(async () => {
      await runAgentConfig();
    });
}
