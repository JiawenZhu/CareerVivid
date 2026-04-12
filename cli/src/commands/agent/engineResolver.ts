import chalk from "chalk";
import { getApiKey, getGeminiKey, getLlmConfig, type LLMProvider } from "../../config.js";
import { QueryEngine, CODING_AGENT_SYSTEM_PROMPT, JOBS_SYSTEM_PROMPT } from "../../agent/QueryEngine.js";
import { CareerVividProxyEngine } from "../../agent/CareerVividProxyEngine.js";
import { Tool } from "../../agent/Tool.js";
import { MODEL_CREDIT_COST } from "./configurator.js";

export function getSystemInstruction(options: { jobs?: boolean; resume?: boolean }): string {
  let systemInstruction = CODING_AGENT_SYSTEM_PROMPT;
  if (options.jobs) {
    systemInstruction = JOBS_SYSTEM_PROMPT + `

### CareerVivid Online Tracker
- **get_resume** — Load the user's resume (ALWAYS do this before job search or interview prep).
- **list_resumes** — List all CareerVivid resumes.
- **tailor_resume** — Tailor/refine the user's resume for a specific role or JD.
- **delete_resume** — Delete a resume permanently.
- **search_jobs** — Search for jobs scored against the user's resume. ALWAYS call get_resume first.
- **save_job** — Save a job to the online Kanban board.
- **list_jobs** — Show the online Kanban board (separate from local CSV).
- **update_job_status** — Move a job: To Apply → Applied → Interviewing → Offered/Rejected.

## Browser Control
- **browser_use_agent** ⭐ PRIMARY — autonomous form-filling agent (pass URL + full resume context)
- browser_navigate, browser_state, browser_click, browser_type, browser_select, browser_scroll, browser_screenshot
- NEVER submit a form without user confirmation`;
  } else if (options.resume) {
    systemInstruction += `

## Resume Access

You have access to the **get_resume** tool which fetches the user's CareerVivid resume.
When the user asks about their resume, skills, experience, or career background, call get_resume to load it first.`;
  }
  return systemInstruction;
}

export function buildEngine(
  selectedProvider: LLMProvider,
  selectedModel: string,
  systemInstruction: string,
  tools: Tool[],
  thinkingBudget: number,
  includeThoughts: boolean,
  cvApiKey: string | undefined,
  geminiApiKey: string | undefined,
  project: string | undefined
): QueryEngine | CareerVividProxyEngine | null {
  let engine: QueryEngine | CareerVividProxyEngine | null = null;
  
  if (selectedProvider === "careervivid" && cvApiKey) {
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
  
  return engine;
}

export function printBanner(
  options: { coding?: boolean; jobs?: boolean; resume?: boolean; pro?: boolean; think?: number },
  selectedProvider: string,
  selectedModel: string,
  thinkingBudget: number
) {
  console.log(chalk.bold.cyan("\n🤖 CareerVivid Agent"));
  if (selectedProvider === "careervivid") {
    const cost = MODEL_CREDIT_COST[selectedModel] ?? 1;
    console.log(
      chalk.dim(`  Model: ${selectedModel}`) +
      chalk.gray(`  [${cost} credit${cost !== 1 ? "s" : ""}/turn via CareerVivid Cloud]`)
    );
  } else {
    console.log(chalk.cyan(`  Provider: ${selectedProvider}  Model: ${selectedModel}  [0 credits]`));
  }

  if (options.coding) console.log(chalk.green("  ✔ Coding mode: file I/O, shell, search tools active"));
  if (options.jobs) {
    console.log(chalk.cyan("  ✔ Job mode: search, save, list, status update, apply_to_job tools active"));
    console.log(chalk.magenta("  ✔ Browser mode: navigate, click, type, select, scroll, screenshot tools active"));
    console.log(chalk.yellow("  ✔ Local tracker: list_local_jobs · update_local_job · add_local_job"));
    console.log(chalk.yellow("               + score_pipeline · get_pipeline_metrics · flag_stale_jobs (jobs.csv v2)"));
  } else if (options.resume) console.log(chalk.cyan("  ✔ Resume mode: get_resume tool active"));
  if (options.pro) console.log(chalk.magenta(`  ✔ Pro mode: ${selectedModel} + thinking (${thinkingBudget} tokens)`));
  else if (thinkingBudget > 0) console.log(chalk.yellow(`  ✔ Thinking mode: ${thinkingBudget} token budget`));
  console.log(chalk.gray(`  Type 'exit' to quit  ·  /model to switch models  ·  /help for commands.\n`));
}
