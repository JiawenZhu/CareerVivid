import { Command } from "commander";
import chalk from "chalk";
import pkg from "enquirer";
import { getApiKey, getLlmConfig, getGeminiKey, loadConfig, setConfigValue, type LLMProvider } from "../../config.js";
import { CV_MODELS, BYO_MODELS, runAgentConfig, promptForAgentModel } from "./configurator.js";
import { getTools } from "./toolRegistry.js";
import { getSystemInstruction, buildEngine, printBanner } from "./engineResolver.js";
import { askLoop } from "./repl.js";

const { prompt } = pkg;

export function registerAgentCommand(program: Command) {
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
      const cvApiKey = getApiKey();
      const project = options.project ?? process.env.GOOGLE_CLOUD_PROJECT;
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

      const tools = getTools(options);

      const isPro = Boolean(options.pro);
      const llmCfg = getLlmConfig({
        provider: options.provider as LLMProvider | undefined,
        model: options.model,
        apiKey: options["api-key"] || options.apiKey,
        baseUrl: options["base-url"] || options.baseUrl,
      });

      let selectedModel: string;
      let thinkingBudget: number;
      let selectedProvider: LLMProvider;

      if (isPro) {
        selectedModel = "gemini-3.1-pro-preview";
        thinkingBudget = options.think ?? 8192;
        selectedProvider = "careervivid";
      } else if (options.provider && options.provider !== "careervivid") {
        selectedProvider = llmCfg.provider;
        selectedModel = llmCfg.model;
        thinkingBudget = 0;
      } else if (llmCfg.provider !== "careervivid") {
        selectedProvider = llmCfg.provider;
        selectedModel = llmCfg.model;
        thinkingBudget = 0;
      } else {
        const result = await promptForAgentModel(options);
        selectedProvider = result.selectedProvider;
        selectedModel = result.selectedModel;
        thinkingBudget = result.thinkingBudget;
        if (result.apiKey) {
          options["api-key"] = result.apiKey;
        }
      }

      let geminiApiKey: string | undefined;
      if (selectedProvider === "careervivid") {
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

      const includeThoughts = Boolean(options.verbose);
      const systemInstruction = getSystemInstruction(options);

      const engine = buildEngine(
        selectedProvider,
        selectedModel,
        systemInstruction,
        tools,
        thinkingBudget,
        includeThoughts,
        cvApiKey,
        geminiApiKey,
        project
      );

      printBanner(options, selectedProvider, selectedModel, thinkingBudget);

      await askLoop(engine, options, selectedProvider, selectedModel, cvApiKey, systemInstruction, tools);
    });

  agentCmd.command("config")
    .description("Configure the default LLM provider for cv agent")
    .action(runAgentConfig);
}
