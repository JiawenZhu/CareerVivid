import chalk from "chalk";
import pkg from "enquirer";
import { loadConfig, saveConfig, type LLMProvider } from "../../config.js";

const { prompt } = pkg;

export const MODEL_CREDIT_COST: Record<string, number> = {
  "gemini-3.1-flash-lite-preview": 0.5,
  "gemini-2.5-flash": 1,
  "gemini-3.1-pro-preview": 2,
};

export const CV_MODELS = [
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

export const BYO_MODELS = [
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

export async function runAgentConfig(): Promise<void> {
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

export async function promptForAgentModel(options: any = {}): Promise<{
  selectedProvider: LLMProvider;
  selectedModel: string;
  thinkingBudget: number;
  apiKey?: string;
}> {
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
  let selectedProvider: LLMProvider;
  let selectedModel: string;
  let thinkingBudget: number;
  let apiKey: string | undefined = undefined;

  if (picked.startsWith("__") && !picked.startsWith("__header")) {
    const providerMap: Record<string, LLMProvider> = {
      __openai__: "openai",
      __anthropic__: "anthropic",
      __gemini__: "gemini",
      __openrouter__: "openrouter",
      __custom__: "custom",
    };
    selectedProvider = providerMap[picked] || "openai";

    const savedKey = loadConfig().llmApiKey;
    if (!savedKey) {
      console.log(chalk.yellow(`\n🔑 BYO API key needed for ${selectedProvider}.`));
      console.log(chalk.dim("  Run: cv agent config   to save your key permanently.\n"));
      const keyAnswer = await prompt<{ key: string }>({
        type: "password",
        name: "key",
        message: `Enter your ${selectedProvider} API key:`,
      });
      apiKey = keyAnswer.key.trim();
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
    selectedModel = picked;
    selectedProvider = "careervivid";
    thinkingBudget = options.think ?? (picked === "gemini-3.1-pro-preview" ? 8192 : 0);
  }

  return { selectedProvider, selectedModel, thinkingBudget, apiKey };
}
