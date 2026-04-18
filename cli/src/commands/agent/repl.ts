import chalk from "chalk";
import pkg from "enquirer";
import ora from "ora";
import { isSafeCommand } from "../../agent/tools/coding.js";
import { CareerVividProxyEngine } from "../../agent/CareerVividProxyEngine.js";
import { QueryEngine } from "../../agent/QueryEngine.js";
import { CV_MODELS } from "./configurator.js";
import { loadConfig, getGeminiKey, getProviderKey, setProviderKey, type LLMProvider } from "../../config.js";
import { auditLog, writeSessionSummary, SESSION_ID } from "../../agent/agentAuditLog.js";

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

  // #3 Session mutation budget
  const WRITE_TOOLS = new Set([
    "tracker_add_job", "tracker_update_job", "kanban_add_job", "kanban_update_status",
    "save_cover_letter", "delete_cover_letter", "write_file", "patch_file",
    "tracker_recheck_urls", "openings_apply",
  ]);
  const SESSION_MAX_MUTATIONS = 25;
  const TURN_MAX_MUTATIONS = 10;
  let sessionMutations = 0;
  let turnMutations = 0;

  // #9 Circuit breaker — detect tool call loops
  let lastToolCall = { name: "", argsHash: "", count: 0 };

  let pasteBuffer: string[] = [];
  let byoHistory: any[] = []; // Track history for BYO providers

  // ── SIGINT handler: Ctrl+C cancels current operation and returns to prompt ──
  let activeAbort: AbortController | null = null;
  const handleSigInt = () => {
    const ab = activeAbort as AbortController | null;
    if (ab !== null && !ab.signal.aborted) {
      ab.abort();
      process.stdout.write("\n" + chalk.yellow("⚡ Interrupted. Press Ctrl+C again or type 'exit' to quit.\n"));
    } else {
      // Second Ctrl+C exits
      console.log(chalk.gray("\nGoodbye! 👋\n"));
      process.exit(0);
    }
  };
  process.on("SIGINT", handleSigInt);

  /** Wraps a promise with a timeout. Rejects with a friendly timeout error. */
  function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() =>
        reject(new Error(`${label} timed out after ${ms / 1000}s. Press Ctrl+C if stuck.`)),
        ms
      );
      p.then(v => { clearTimeout(timer); resolve(v); })
       .catch(e => { clearTimeout(timer); reject(e); });
    });
  }

  const ask = async (): Promise<void> => {
    try {
      const promptStartTime = Date.now();
      const response = await prompt<{ query: string }>({
        type: "input",
        name: "query",
        message: pasteBuffer.length > 0
          ? chalk.dim("... ")
          : chalk.bold.cyan("❯") + chalk.dim(" ·"),
      });

      const duration = Date.now() - promptStartTime;
      let userInput = response.query;

      // ── Multi-line paste mode: user typed <<< (or <<<paste) ─────────────
      // Allows pasting arbitrarily long content (e.g. full JD) without truncation.
      if (userInput.trim() === "<<<" || userInput.trim().toLowerCase().startsWith("<<<")) {
        const prefix = userInput.trim().slice(3).trim(); // text after <<<
        console.log(chalk.dim("  📋 Multi-line mode: paste your text, then press Enter twice to submit.\n"));
        const lines: string[] = prefix ? [prefix] : [];
        let emptyCount = 0;
        while (emptyCount < 1) {
          const lineResp = await prompt<{ line: string }>({
            type: "input",
            name: "line",
            message: chalk.dim("  │"),
          });
          if (lineResp.line === "") {
            emptyCount++;
          } else {
            emptyCount = 0;
            lines.push(lineResp.line);
          }
        }
        userInput = lines.join("\n").trim();
        pasteBuffer = [];
      } else if (duration < 150) {
        // Handle multiline copy & paste: prompt resolves extremely fast if stdin is buffered.
        // 150ms threshold gives enough headroom for large pastes (long JDs, cover letters).
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

      // ── Input length guard ──────────────────────────────────────────
      // macOS terminal readline has a hard ~4096 char limit per line, meaning
      // pasting very long job descriptions gets silently truncated mid-word.
      // Detect this early and guide the user to <<< mode instead.
      const MAX_INPUT_CHARS = 20_000; // ~3,000 words — safe above typical JD length
      if (userInput.length > MAX_INPUT_CHARS) {
        console.log(
          chalk.yellow("\n⚠️  Input is too long (" + userInput.length + " chars).") +
          chalk.dim("\n   Use <<< mode for long job descriptions so nothing gets cut off:") +
          chalk.cyan("\n\n   ❯ <<< ") +
          chalk.dim("\n   Then paste the job description, and press Enter twice to submit.\n")
        );
        return ask();
      }

      // ── Slash commands ──────────────────────────────────────────────
      if (userInput.startsWith("/")) {
        const [cmd, ...rest] = userInput.slice(1).split(" ");
        const arg = rest.join(" ").trim();

        if (cmd === "help") {
          console.log(chalk.cyan("\n  Slash commands:"));
          console.log(chalk.dim("  /model <name>  — Switch to a different model mid-session"));
          console.log(chalk.dim("  /models        — List all available CareerVivid models"));
          console.log(chalk.dim("  /help          — Show this help message"));
          console.log(chalk.dim("  exit           — End the session"));
          console.log(chalk.cyan("\n  Paste long content (job descriptions, cover letters):"));
          console.log(chalk.dim("  <<<            — Open multi-line paste mode; press Enter twice when done"));
          console.log(chalk.dim("  <<<your text   — Start with text directly after <<<\n"));
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
        await writeSessionSummary({ turns: sessionTurns, mutations: sessionMutations, toolCalls: 0 });
        console.log(chalk.gray("\nGoodbye! 👋\n"));
        process.exit(0);
      }

      // Reset per-turn mutation counter at the start of each user message
      turnMutations = 0;

      process.stdout.write(chalk.dim("\n⏳ Thinking...\n\n"));

      let firstChunk = true;
      let currentSpinner: any = null;
      let trustAllCommands = false;
      let trustAllWrites = false;

      // Map internal tool names to user-friendly labels
      const TOOL_LABELS: Record<string, string> = {
        list_directory:        "🔍 Scanning workspace...",
        read_file:             "📖 Reading file...",
        run_command:           "⚙️  Running command...",
        write_file:            "✏️  Writing file...",
        patch_file:            "✏️  Patching file...",
        tracker_list_jobs:       "📊 Checking job pipeline...",
        tracker_add_job:         "➕ Adding job to pipeline...",
        tracker_update_job:      "🔄 Updating job record...",
        tracker_rank_priority:   "📈 Ranking pipeline...",
        tracker_dashboard:       "📊 Fetching pipeline analytics...",
        tracker_find_stale:      "🚩 Checking stale jobs...",
        tracker_inspect_quality: "🔍 Inspecting data quality...",
        kanban_add_job:          "📌 Saving to Kanban board...",
        kanban_list_jobs:        "📋 Loading Kanban board...",
        kanban_update_status:    "🔄 Updating Kanban status...",
        list_cover_letters:    "📄 Loading cover letters...",
        get_cover_letter:      "📄 Reading cover letter...",
        save_cover_letter:     "💾 Saving cover letter...",
        delete_cover_letter:   "🗑️  Deleting cover letter...",
        browser_navigate:      "🌐 Navigating to page...",
        browser_click:         "🖱️  Clicking element...",
        browser_type:          "⌨️  Typing input...",
        browser_state:         "🌐 Reading browser state...",
        browser_screenshot:    "📸 Taking screenshot...",
        browser_scroll:        "📜 Scrolling page...",
        browser_wait:          "⏳ Waiting...",
        browser_close:         "🔒 Closing browser...",
        browser_select:        "🖱️  Selecting option...",
        tracker_recheck_urls:    "🔗 Re-checking job URLs...",
        browser_autofill_application: "📝 Auto-filling application...",
        verify_url:              "🔍 Verifying URL...",
        verify_job_urls:         "🔍 Verifying job URLs...",
        search_jobs:             "🔍 Searching jobs...",
        openings_scan:           "🎯 Scanning companies for open roles...",
        openings_list:           "📋 Loading saved openings...",
        openings_apply:          "✅ Marking opening as applied...",
        get_resume:            "📄 Loading resume...",
        list_resumes:          "📄 Loading resumes...",
        get_profile:           "👤 Loading profile...",
      };

      const handleToolCall = async (name: string, args: any): Promise<boolean> => {
        // #9 Circuit breaker: abort if same tool called 5+ times consecutively with same args
        const argsHash = JSON.stringify(args).slice(0, 100);
        if (lastToolCall.name === name && lastToolCall.argsHash === argsHash) {
          lastToolCall.count++;
          if (lastToolCall.count >= 5) {
            console.log(chalk.red(
              `\n⛔ Loop detected: "${name}" called ${lastToolCall.count} times with identical args. Aborting turn.`
            ));
            return false;
          }
        } else {
          lastToolCall = { name, argsHash, count: 1 };
        }

        // #3 Per-turn mutation budget
        if (WRITE_TOOLS.has(name)) {
          turnMutations++;
          if (turnMutations > TURN_MAX_MUTATIONS) {
            console.log(chalk.red(
              `\n⛔ Turn mutation limit (${TURN_MAX_MUTATIONS}) reached. The agent has made ${turnMutations} writes this turn.`
            ));
            return false;
          }
          sessionMutations++;
          if (sessionMutations >= SESSION_MAX_MUTATIONS) {
            console.log(chalk.yellow(
              `\n⚠️  Session mutation budget exhausted (${SESSION_MAX_MUTATIONS} writes). Restart the agent to continue writing.`
            ));
            return false;
          } else if (sessionMutations === SESSION_MAX_MUTATIONS - 5) {
            console.log(chalk.yellow(
              `\n💡 Heads up: ${SESSION_MAX_MUTATIONS - sessionMutations} writes remaining this session.`
            ));
          }
        }

        // Show a clean, user-friendly label — never show raw args
        const label = TOOL_LABELS[name] ?? `⚙️  Working...`;
        process.stdout.write(chalk.dim(`
${label}
`));

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

        // Tools that take over the full terminal must NOT have a spinner running —
        // the concurrent ora redraw causes constant flashing.
        if (name === "start_interview") {
          // Clear current line so any previous UI is gone, then yield terminal cleanly.
          process.stdout.write("\r\x1b[K");
          return true;
        }

        currentSpinner = ora(`Running ${chalk.bold(name)}...`).start();
        return true;
      };

      const handleToolResult = (name: string, result: any) => {
        if (currentSpinner) {
          currentSpinner.succeed(chalk.dim(`Done`));
          currentSpinner = null;
        }
        if (name === "start_interview") {
          // Interview already printed its own output — just add a separator.
          console.log(chalk.dim("─".repeat(50)));
        }
        // #4 Audit log — record every completed tool call
        // durationMs is approximate since we don't have exact start time here
        auditLog({
          sessionId: SESSION_ID,
          tool: name,
          args: typeof result?._args === "object" ? result._args : {},
          result: typeof result === "string" ? result : JSON.stringify(result ?? ""),
          durationMs: 0, // QueryEngine doesn't expose timing; repl.ts timing TBD
        });
        // Suppress raw output — the agent will summarize it in natural language
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

        const byoApiKey = options["api-key"] || getProviderKey(selectedProvider) || loadConfig().llmApiKey;
        const key = byoApiKey || "";
        const baseUrl = options["base-url"] || loadConfig().llmBaseUrl;

        let provider: any;
        if (selectedProvider === "anthropic") {
          provider = new AnthropicProvider({ apiKey: key });
        } else {
          const subProvider: "openai" | "openrouter" | "custom" = (
            selectedProvider === "openrouter" ? "openrouter" :
            selectedProvider === "custom" ? "custom" : "openai"
          );
          provider = createOpenAICompatibleProvider(subProvider, key, baseUrl);
        }

        let userTurn: any = { role: "user", parts: [{ text: userInput }] };
        let round = 0;
        
        while (round < 10) {
          const result: any = await withTimeout(
            provider.generate({ model: currentModel, history: byoHistory, userTurn, tools, systemInstruction }),
            45_000,
            "LLM generate()"
          );

          if (round === 0) {
            process.stdout.write("\r\x1b[K"); // clear initial thinking spinner
          }
          if (result.text) {
            console.log(chalk.green(result.text));
          }

          byoHistory.push(userTurn);
          byoHistory.push({ role: "model", parts: result.rawParts || [{ text: result.text }] });

          if (!result.functionCalls || result.functionCalls.length === 0) {
            break;
          }

          let fnResponses: any[] = [];
          for (const fc of result.functionCalls) {
            const allow = await handleToolCall(fc.name, fc.args);
            if (!allow) {
              fnResponses.push({ functionResponse: { id: fc.id, name: fc.name, response: { error: "User denied execution." } } });
              continue;
            }
            const tool = tools.find((t: any) => t.name === fc.name);
            let out;
            try {
              // start_interview is an interactive long-running session — never apply a timeout to it.
              out = tool
                ? fc.name === "start_interview"
                  ? await tool.execute(fc.args)
                  : await withTimeout(tool.execute(fc.args), 45_000, `tool:${fc.name}`)
                : { error: "Tool not found" };
            } catch (e: any) {
              if (e.message?.includes("No API key configured")) {
                out = { error: "CareerVivid API key not found. Run 'cv login' to authenticate." };
              } else {
                out = { error: e.message };
              }
            }
            handleToolResult(fc.name, out);
            fnResponses.push({ functionResponse: { id: fc.id, name: fc.name, response: out } });
          }

          userTurn = { role: "user", parts: fnResponses };
          round++;
        }
      }

      return ask();
    } catch (err: any) {
      const msg: string = err?.message ?? "";

      // ── Clean exit on Ctrl+C / enquirer cancel ────────────────────────
      if (!msg || msg.includes("cancelled") || msg.includes("User force closed")) {
        console.log(chalk.gray("\nCancelled. Exiting.\n"));
        process.exit(0);
      }

      // ── 401 unauthorized — offer key reset ───────────────────────────
      const is401 = msg.includes("401") || msg.toLowerCase().includes("user not found") ||
                    msg.toLowerCase().includes("invalid api key") || msg.toLowerCase().includes("unauthorized");
      if (is401 && selectedProvider && selectedProvider !== "careervivid") {
        const providerLabels: Record<string, string> = {
          openai: "OpenAI", anthropic: "Anthropic",
          gemini: "Gemini", openrouter: "OpenRouter", custom: "Custom",
        };
        const providerKeyUrls: Record<string, string> = {
          openai: "https://platform.openai.com/api-keys",
          anthropic: "https://console.anthropic.com/settings/keys",
          gemini: "https://aistudio.google.com/app/apikey",
          openrouter: "https://openrouter.ai/settings/keys",
        };
        const label = providerLabels[selectedProvider] ?? selectedProvider;
        console.log();
        console.log(chalk.red(`❌ API key rejected by ${label} (401 Unauthorized).`));
        console.log(chalk.dim(`   The saved key may be expired or invalid.`));
        if (providerKeyUrls[selectedProvider]) {
          console.log(chalk.dim(`   Get a new key at: `) + chalk.cyan(providerKeyUrls[selectedProvider]));
        }
        console.log();
        try {
          const resetAnswer = await prompt<{ action: string }>({
            type: "select",
            name: "action",
            message: "What would you like to do?",
            choices: [
              { name: "reset",    message: `🔑 Enter a new ${label} API key` },
              { name: "continue", message: "⏭️  Continue anyway (will keep failing)" },
              { name: "exit",     message: "🚪 Exit the agent" },
            ],
          });
          if (resetAnswer.action === "reset") {
            const keyAnswer = await prompt<{ key: string }>({
              type: "password",
              name: "key",
              message: `Enter your new ${label} API key:`,
            });
            const newKey = (keyAnswer?.key ?? "").trim();
            if (newKey) {
              setProviderKey(selectedProvider as LLMProvider, newKey);
              // Update the key used for subsequent turns this session
              options["api-key"] = newKey;
              console.log(chalk.green(`\n✔ New ${label} key saved. Resuming session...\n`));
            }
          } else if (resetAnswer.action === "exit") {
            console.log(chalk.gray("\nGoodbye! 👋\n"));
            process.exit(0);
          }
        } catch {
          // User cancelled the reset prompt — just continue
        }
        return ask();
      }

      // ── Generic error ────────────────────────────────────────────────
      console.error(chalk.red(`\nAgent encountered an error: ${msg}`));
      return ask();
    }
  };

  return ask();
}
