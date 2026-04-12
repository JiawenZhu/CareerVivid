import chalk from "chalk";
import pkg from "enquirer";
import ora from "ora";
import { isSafeCommand } from "../../agent/tools/coding.js";
import { CareerVividProxyEngine } from "../../agent/CareerVividProxyEngine.js";
import { QueryEngine } from "../../agent/QueryEngine.js";
import { CV_MODELS } from "./configurator.js";
import { loadConfig, getGeminiKey, type LLMProvider } from "../../config.js";

const { prompt } = pkg;

export function printCreditStatus(remaining: number | null, limit: number | null = null) {
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

export async function askLoop(
  engine: QueryEngine | CareerVividProxyEngine | null,
  options: { verbose?: boolean; think?: number; "base-url"?: string; baseUrl?: string; "api-key"?: string; apiKey?: string; jobs?: boolean; resume?: boolean; coding?: boolean },
  selectedProvider: LLMProvider,
  selectedModel: string,
  cvApiKey: string | undefined,
  systemInstruction: string,
  tools: any[]
): Promise<void> {
  let sessionTurns = 0;
  let sessionLimit: number | null = null;
  let currentModel = selectedModel;

  let pasteBuffer: string[] = [];

  const ask = async (): Promise<void> => {
    try {
      const promptStartTime = Date.now();
      const response = await prompt<{ query: string }>({
        type: "input",
        name: "query",
        message: pasteBuffer.length > 0 ? chalk.dim("... ") : chalk.bold.cyan("❯"),
      });

      const duration = Date.now() - promptStartTime;
      let userInput = response.query;

      // Handle multiline copy & paste: prompt resolves extremely fast if stdin is buffered
      if (duration < 50) {
        pasteBuffer.push(userInput);
        return ask();
      } else {
        if (pasteBuffer.length > 0) {
          if (userInput) pasteBuffer.push(userInput);
          userInput = pasteBuffer.join("\n");
          // Reset buffer
          pasteBuffer = [];
        }
      }

      userInput = userInput.trim();
      if (!userInput) return ask();

      // ── Slash commands ──────────────────────────────────────────────
      if (userInput.startsWith("/")) {
        const [cmd, ...rest] = userInput.slice(1).split(" ");
        const arg = rest.join(" ").trim();

        if (cmd === "help") {
          console.log(chalk.cyan("\n  Slash commands:"));
          console.log(chalk.dim("  /model <name>  — Switch to a different model mid-session"));
          console.log(chalk.dim("  /models        — List all available CareerVivid models"));
          console.log(chalk.dim("  /help          — Show this help message"));
          console.log(chalk.dim("  exit           — End the session\n"));
          return ask();
        }

        if (cmd === "models") {
          console.log(chalk.cyan("\n  Available CareerVivid models:"));
          for (const m of CV_MODELS) {
            const active = m.value === currentModel ? chalk.green(" ← active") : "";
            console.log(`  ${m.name}${active}`);
          }
          console.log(chalk.dim("\n  Usage: /model gemini-2.5-flash\n"));
          return ask();
        }

        if (cmd === "model") {
          if (!arg) {
            console.log(chalk.yellow(`\n  Current model: ${chalk.bold(currentModel)}`));
            console.log(chalk.dim("  Usage: /model <name>   e.g. /model gemini-3.1-pro-preview"));
            console.log(chalk.dim("  Run /models to see all available options.\n"));
            return ask();
          }
          const newModel = arg;
          const known = CV_MODELS.find((m) => m.value === newModel);
          if (!known && !newModel.includes("/") && !newModel.includes("-")) {
            console.log(chalk.red(`\n  Unknown model: ${newModel}`));
            console.log(chalk.dim("  Run /models to see available options.\n"));
            return ask();
          }
          currentModel = newModel;
          if (cvApiKey && engine instanceof CareerVividProxyEngine) {
            engine = new CareerVividProxyEngine({
              cvApiKey,
              model: currentModel,
              systemInstruction,
              tools,
              thinkingBudget: newModel.includes("pro") ? (options.think ?? 8192) : 0,
              maxHistoryLength: 40,
            });
          }
          const creditInfo = known ? chalk.dim(` (${known.cost} credit/turn)`) : "";
          console.log(chalk.green(`\n  ✔ Switched to ${chalk.bold(currentModel)}${creditInfo}`));
          console.log(chalk.dim("  Conversation history has been reset.\n"));
          return ask();
        }

        console.log(chalk.yellow(`\n  Unknown command: /${cmd}. Type /help for available commands.\n`));
        return ask();
      }

      if (userInput.toLowerCase() === "exit") {
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
      let trustAllCommands = false;
      let trustAllWrites = false;

      const handleToolCall = async (name: string, args: any): Promise<boolean> => {
        console.log(chalk.yellow(`\n🛠️  Tool: ${chalk.bold(name)}`));
        console.log(chalk.dim(`   Args: ${JSON.stringify(args, null, 2)}`));

        if (name === "run_command") {
          if (trustAllCommands || isSafeCommand(args.command)) {
            return true;
          }
          const confirm = await prompt<{ ok: string }>({
            type: "select",
            name: "ok",
            message: `Allow running: ${chalk.bold(args.command)}?`,
            choices: [
              "Yes, run it",
              "Yes, and trust all commands this session",
              "No, skip it",
            ],
          });
          if (confirm.ok === "Yes, and trust all commands this session") {
            trustAllCommands = true;
            console.log(chalk.dim("   ✅ All commands will run automatically for the rest of this session."));
            return true;
          }
          return confirm.ok === "Yes, run it";
        }

        if (name === "write_file" || name === "patch_file") {
          if (trustAllWrites) return true;
          const target = args.path || "(unknown path)";
          const confirm = await prompt<{ ok: string }>({
            type: "select",
            name: "ok",
            message: `Allow writing to: ${chalk.bold(target)}?`,
            choices: [
              "Yes, write it",
              "Yes, and trust all writes this session",
              "No, skip it",
            ],
          });
          if (confirm.ok === "Yes, and trust all writes this session") {
            trustAllWrites = true;
            console.log(chalk.dim("   ✅ All file writes will run automatically for the rest of this session."));
            return true;
          }
          if (confirm.ok !== "Yes, write it") return false;
        }

        if (["browser_state", "browser_screenshot", "browser_scroll", "browser_wait"].includes(name)) {
          currentSpinner = ora(`Running ${chalk.bold(name)}...`).start();
          return true;
        }
        if (["browser_navigate", "browser_click", "browser_type", "browser_select"].includes(name)) {
          currentSpinner = ora(`Running ${chalk.bold(name)}...`).start();
          return true;
        }
        if (name === "browser_close") {
          const confirm = await prompt<{ ok: string }>({
            type: "select",
            name: "ok",
            message: `Close the browser?`,
            choices: ["Yes, close it", "No, keep it open"],
          });
          if (confirm.ok !== "Yes, close it") return false;
        }

        currentSpinner = ora(`Running ${chalk.bold(name)}...`).start();
        return true;
      };

      const handleToolResult = (name: string, result: any) => {
        if (currentSpinner) {
          currentSpinner.succeed(`Finished ${chalk.bold(name)}`);
          currentSpinner = null;
        }
        const preview = typeof result === "string" ? result.substring(0, 120) : JSON.stringify(result).substring(0, 120);
        console.log(chalk.dim(`   ✅ ${name}: ${preview}${preview.length >= 120 ? "…" : ""}\n`));
      };

      if (engine) {
        sessionTurns++;
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
        sessionTurns++;
        const { createOpenAICompatibleProvider } = await import("../../agent/providers/OpenAIProvider.js");
        const { AnthropicProvider } = await import("../../agent/providers/AnthropicProvider.js");

        const byoApiKey = options["api-key"] || loadConfig().llmApiKey;
        const key = byoApiKey || getGeminiKey() || "";
        const baseUrl = options["base-url"] || loadConfig().llmBaseUrl;

        if (selectedProvider === "anthropic") {
          const anthropic = new AnthropicProvider({ apiKey: key });
          const result = await anthropic.generate({
            model: currentModel,
            history: [],
            userTurn: { role: "user", parts: [{ text: userInput }] },
            tools,
            systemInstruction,
          });
          process.stdout.write("\r\x1b[K");
          console.log(chalk.green(result.text));
        } else {
          const subProvider: "openai" | "openrouter" | "custom" = (
            selectedProvider === "openrouter" ? "openrouter" :
            selectedProvider === "custom" ? "custom" :
            "openai"
          );
          const openai = createOpenAICompatibleProvider(subProvider, key, baseUrl);
          const result = await openai.generate({
            model: currentModel,
            history: [],
            userTurn: { role: "user", parts: [{ text: userInput }] },
            tools,
            systemInstruction,
          });
          process.stdout.write("\r\x1b[K");
          console.log(chalk.green(result.text));
        }
      }

      return ask();
    } catch (err: any) {
      if (err.message && err.message.includes("cancelled")) {
        console.log(chalk.gray("\nCancelled. Exiting.\n"));
        process.exit(0);
      }
      console.error(chalk.red(`\nAgent encountered an error: ${err.message}`));
      return ask();
    }
  };

  return ask();
}
