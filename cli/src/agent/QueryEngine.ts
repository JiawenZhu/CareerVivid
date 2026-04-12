import { GoogleGenAI, GenerateContentResponse, Content, Part } from '@google/genai';
import { Tool, convertToGenAITool } from './Tool.js';
import { compactHistory } from './contextCompaction.js';

// ---------------------------------------------------------------------------
// Elite Coding System Prompt
// ---------------------------------------------------------------------------
export const CODING_AGENT_SYSTEM_PROMPT = `
You are an expert autonomous coding agent running inside the CareerVivid CLI.
You have access to tools that let you read files, write files, search the codebase, and execute shell commands.

## Core Rules

1. **EXPLORE BEFORE ACTING** — Before writing or modifying any file, always read it first using read_file. Never overwrite a file blindly.
2. **PLAN BEFORE CODING** — Before writing code, emit a short "Plan:" section describing your approach and the files you will touch.
3. **MINIMAL FOOTPRINT** — Make the smallest change that correctly solves the problem. Prefer patch_file over rewriting entire files.
4. **SELF-VERIFY** — After writing code, run the compiler or test suite with run_command and iterate until there are 0 errors. Never claim "done" without verifying.
5. **CONFIRM DESTRUCTIVE OPERATIONS** — Before deleting files or running irreversible commands, state what you are about to do and wait for confirmation.
6. **BE EXPLICIT ABOUT UNCERTAINTY** — If you are not sure about a design decision, list the options and your recommendation rather than silently choosing.

## Workflow Pattern

For every coding task, follow this loop:
1. Read relevant files to understand the existing code structure.
2. Emit a short plan (file list, approach, risks).
3. Write the code using write_file or patch_file.
4. Verify with run_command (tsc --noEmit, npm test, etc.).
5. Fix any errors and loop back to step 4 until clean.
6. Summarize all changes made.

## Code Quality Standards

- Use TypeScript with strict types. Avoid 'any' unless unavoidable.
- Follow the existing code style of the file being edited.
- Add JSDoc comments to all public functions and interfaces.
- Write self-documenting code — variable names should explain intent.
- Keep functions short and focused on a single responsibility.
`.trim();

// ---------------------------------------------------------------------------
// Elite Jobs System Prompt
// ---------------------------------------------------------------------------
export const JOBS_SYSTEM_PROMPT = `You are the CareerVivid elite jobs agent — a proactive career strategist.

## CRITICAL: TOOL-FIRST POLICY (MANDATORY — NO EXCEPTIONS)
You MUST call a tool BEFORE writing any response text when the user's message concerns their job pipeline or search.
NEVER answer pipeline questions from memory or general knowledge. ALWAYS fetch fresh data from tools first.

### Mandatory Tool Dispatch Table
| If the user asks about... | You MUST call... |
|---|---|
| pipeline, jobs list, tracker, companies | list_local_jobs |
| priority, what to work on, best ROI, what next | score_pipeline |
| how is my search, dashboard, stats, metrics, apply rate | get_pipeline_metrics |
| neglecting, stale, cold, going dark, need attention | flag_stale_jobs |
| adding a company, tracking a new job | add_local_job |
| updating status, marking applied, setting follow-up | update_local_job |
| resume, background, skills, experience | get_resume |
| job search, find jobs, search for roles | get_resume THEN search_jobs |

This table is NON-NEGOTIABLE. Do not skip tools. Do not describe what you "would" do. CALL THE TOOL.

## Core Tools
- list_local_jobs       → Show the pipeline (supports tier/status filters and sort_by)
- update_local_job      → Update any field on a job entry (status, attention, excitement, notes, follow-up)
- add_local_job         → Add a new company to the tracker (auto-generates ID + priority score)
- score_pipeline        → 📊 Priority-ranked view using attention formula (use for "what next?" questions)
- get_pipeline_metrics  → 📈 Full analytics dashboard (apply rate, avg scores, salary, stale count)
- flag_stale_jobs       → ⚠️  Surface companies going cold with next-action recommendations
- get_resume            → Load the user's CareerVivid resume to personalize advice
- search_jobs           → Search for newly posted jobs scored against the user's resume
- list_jobs             → Show online Kanban board (separate from local CSV)

## Attention Matrix (v2 Schema)
Every company in the tracker has 8 attention/effort metrics:
- attention_score (1–10): How top-of-mind is this company right now?
- excitement (1–10): Pure enthusiasm for the role/company
- apply_effort (Low/Medium/High): How much work is this application?
- prep_time_hours: Estimated research hours needed
- company_stage: Seed / Series A-C / Public / Enterprise
- open_roles_count: How many roles are open
- interview_rounds: Known interview process length
- last_activity_date: Auto-stamped on every update (staleness detection)

Priority Score formula: 40% attention + 30% excitement + 20% fit + 10% recency

## Behavioral Rules
1. ALWAYS call a tool first before giving any information about the user's pipeline
2. ALWAYS call score_pipeline for "what should I work on?", "highest priority?", "what next?"
3. ALWAYS call get_pipeline_metrics for "how is my search?", "stats", "dashboard", "apply rate"
4. ALWAYS call flag_stale_jobs for "what am I neglecting?", "stale", "cold", "need attention"
5. When marking a job Applied, AUTOMATICALLY suggest setting a follow-up date 7 days out
6. Surface quick-apply opportunities (Low effort + To Apply) whenever user has limited time
7. NEVER fabricate job data — only reference data returned by tools

## Harness Directives: Autonomous Execution & Anti-Rationalization
1. DO NOT ASK FOR PERMISSION. If the user's context clearly implies an action, you MUST autonomously use 'update_local_job', 'add_local_job', or other mutative tools to advance their pipeline without waiting for approval.
2. If the user asks you to add or modify a job but doesn't provide all possible details (e.g., date, role, url), DO NOT ask them for the missing details. Use defaults like 'TBD', today's date, or empty strings and execute the tool immediately.
3. If you catch yourself explaining what you are going to do instead of calling the tool, STOP. Call the tool.
4. Complete the workflow entirely in a single turn. Do not use conversational handoffs (e.g. "Would you like me to...", "Could you provide...", "I need your permission") unless performing a destructive action.
5. "Ask for forgiveness, not permission." Execute the action automatically.

## Response Style
- Format pipeline views as clean tables or bulleted lists with icons
- Always show [ID], company, role, status, and priority score when discussing specific jobs
- Be proactive: if you notice stale jobs or low apply velocity, mention it unprompted

## Greeting Protocol
When the user sends a generic greeting (e.g., "hey", "hello", "hi", "start"), you MUST return exactly this standardized routing menu, word-for-word, and do not call any tools:

"Hello! How can I help you today? Are you looking to:

View your job pipeline?

Find new job opportunities?

Update a job's status?

Tailor your resume?

Get an overview of your job search progress?

Let me know what you need!"`.trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryEngineOptions {
  model?: string;
  systemInstruction?: string;
  tools?: Tool[];
  apiKey?: string;
  /** GCP project ID for Vertex AI mode (uses gcloud ADC, no API key needed). */
  project?: string;
  /** GCP region for Vertex AI. Default: us-central1 */
  location?: string;
  /** Max thinking tokens for Gemini 2.5+. Set to 0 to disable. Default: 8192 */
  thinkingBudget?: number;
  /** Show raw thinking text in onThinking hook. Default: false */
  includeThoughts?: boolean;
  /** Auto-compact history when it exceeds this many turns. Default: 40 */
  maxHistoryLength?: number;
}

export interface IterationHook {
  onStart?: () => void;
  /** Called after each Gemini API round-trip (streaming or non-streaming). May be async. */
  onResponse?: (response?: GenerateContentResponse) => void | Promise<void>;
  onToolCall?: (toolName: string, args: any) => Promise<boolean | void>;
  onToolResult?: (toolName: string, result: any) => void;
  onError?: (error: Error) => void;
  /** Fired for each text chunk in streaming mode */
  onChunk?: (text: string) => void;
  /** Fired when thinking tokens arrive (if includeThoughts is enabled) */
  onThinking?: (thought: string) => void;
  /** Fired when the context is being compacted */
  onCompacting?: () => void;
}

// ---------------------------------------------------------------------------
// Retry utility
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function isRetryableError(e: any): boolean {
  // Google GenAI errors often have a status field
  if (e?.status && RETRYABLE_STATUS_CODES.has(e.status)) return true;
  if (e?.message && /rate.?limit|quota|too.?many.?requests|service.?unavailable/i.test(e.message)) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt === maxRetries || !isRetryableError(e)) throw e;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  // TypeScript requires this even though it's unreachable
  throw new Error('retryWithBackoff: unreachable');
}

// ---------------------------------------------------------------------------
// QueryEngine
// ---------------------------------------------------------------------------

/**
 * The unified QueryEngine executing an autonomous REPL-like agentic loop
 * using @google/genai. Supports streaming, thinking mode, automatic context
 * compaction, and exponential-backoff retry.
 */
export class QueryEngine {
  private ai: GoogleGenAI;
  private history: Content[] = [];
  private model: string;
  private systemInstruction: string;
  private tools: Tool[];
  private toolMap: Map<string, Tool>;
  private thinkingBudget: number;
  private includeThoughts: boolean;
  private maxHistoryLength: number;

  constructor(options: QueryEngineOptions = {}) {
    const apiKey = options.apiKey;
    const project = options.project ?? process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT;
    const location = options.location ?? process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
    const useVertexAI = !apiKey && !!project;

    if (useVertexAI) {
      // Vertex AI mode — uses gcloud Application Default Credentials
      this.ai = new GoogleGenAI({ vertexai: true, project, location });
      // Vertex AI uses a different model namespace
      this.model = options.model || 'gemini-2.5-flash-preview-04-17';
    } else {
      // Gemini API mode — requires an API key
      this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
      this.model = options.model || 'gemini-2.5-flash';
    }

    this.systemInstruction = options.systemInstruction || CODING_AGENT_SYSTEM_PROMPT;
    this.tools = options.tools || [];
    this.toolMap = new Map(this.tools.map(t => [t.name, t]));
    this.thinkingBudget = options.thinkingBudget ?? 8192;
    this.includeThoughts = options.includeThoughts ?? false;
    this.maxHistoryLength = options.maxHistoryLength ?? 40;
  }

  public getHistory(): Content[] {
    return this.history;
  }

  public setHistory(history: Content[]) {
    this.history = history;
  }

  /** Add API keys / tools after construction */
  public addTools(tools: Tool[]) {
    for (const t of tools) {
      this.tools.push(t);
      this.toolMap.set(t.name, t);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildGenerateConfig(genAITools: any[]) {
    const config: Record<string, any> = {
      systemInstruction: this.systemInstruction,
    };
    if (genAITools.length > 0) config.tools = genAITools;
    if (this.thinkingBudget > 0) {
      config.thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
        includeThoughts: this.includeThoughts,
      };
    }
    return config;
  }

  private async maybeCompact(hooks?: IterationHook): Promise<void> {
    if (this.history.length > this.maxHistoryLength) {
      if (hooks?.onCompacting) hooks.onCompacting();
      this.history = await compactHistory(this.ai, this.history, this.model);
    }
  }

  private async executeToolCalls(
    functionCalls: Array<{ name?: string; args?: any }>,
    hooks?: IterationHook,
  ): Promise<Part[]> {
    const functionResponses: Part[] = [];

    for (const call of functionCalls) {
      const toolName = call.name || '';
      const args = call.args || {};
      const tool = this.toolMap.get(toolName);

      if (!tool) {
        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: { error: `Tool "${toolName}" not found. Available tools: ${[...this.toolMap.keys()].join(', ')}` },
          },
        });
        continue;
      }

      // Confirmation gate
      if (hooks?.onToolCall) {
        const allow = await hooks.onToolCall(toolName, args);
        if (allow === false) {
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { error: 'User denied tool execution.' },
            },
          });
          continue;
        }
      }

      try {
        const result = await tool.execute(args);
        if (hooks?.onToolResult) hooks.onToolResult(toolName, result);
        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: { result },
          },
        });
      } catch (err: any) {
        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: { error: String(err.message || err) },
          },
        });
      }
    }

    return functionResponses;
  }

  // -------------------------------------------------------------------------
  // Non-streaming loop
  // -------------------------------------------------------------------------

  public async runLoop(prompt: string, hooks?: IterationHook): Promise<string> {
    this.history.push({ role: 'user', parts: [{ text: prompt }] });

    const genAITools = this.tools.map(convertToGenAITool);
    const config = this.buildGenerateConfig(genAITools);

    let maxIterations = 30;
    let iterations = 0;
    let finalAnswer = '';

    while (iterations < maxIterations) {
      iterations++;
      if (hooks?.onStart) hooks.onStart();

      // Auto-compact before hitting the API
      await this.maybeCompact(hooks);

      try {
        const response = await retryWithBackoff(() =>
          this.ai.models.generateContent({
            model: this.model,
            contents: this.history,
            config: config as any,
          }),
        );

        if (hooks?.onResponse) await hooks.onResponse(response);

        // Capture thinking text if included
        if (this.includeThoughts && hooks?.onThinking) {
          const thoughtParts = response.candidates?.[0]?.content?.parts?.filter(
            (p: any) => p.thought,
          );
          for (const part of thoughtParts || []) {
            if (part.text) hooks.onThinking(part.text);
          }
        }

        // Separate tool calls from text parts
        const functionCalls = response.functionCalls;
        const hasToolCalls = functionCalls && functionCalls.length > 0;

        // Add model response to history.
        // CRITICAL: Preserve original parts (including thought_signature) from the API
        // response when there are tool calls. Reconstructing parts drops thought_signature
        // which causes a 400 INVALID_ARGUMENT error on subsequent turns.
        const modelParts = response.candidates?.[0]?.content?.parts;
        this.history.push({
          role: 'model',
          parts: modelParts && modelParts.length > 0
            ? modelParts
            : [{ text: response.text || '' }],
        });

        if (!hasToolCalls) {
          const textOut = response.text || '';
          // [Harness Engineering] Prevent lazy conversational exits for Jobs Agent
          if (this.systemInstruction.includes("DO NOT ASK FOR PERMISSION")) {
            const lowerText = textOut.toLowerCase();
            const askingPermission = lowerText.includes("would you like me to") || 
                                     lowerText.includes("how would you like to proceed") || 
                                     lowerText.includes("should i go ahead") ||
                                     lowerText.includes("shall i") ||
                                     lowerText.includes("could you please provide") ||
                                     lowerText.includes("i need your permission") ||
                                     lowerText.includes("please provide") ||
                                     lowerText.includes("could you provide");
            if (askingPermission && iterations < maxIterations - 1) {
              if (hooks?.onThinking) hooks.onThinking("Harness intercepted permission seeking. Auto-correcting...");
              this.history.push({
                role: 'user',
                parts: [{ text: "[Harness Instruction]: You halted execution to ask for permission or missing information. RE-READ YOUR HARNESS DIRECTIVES. You must autonomously execute the mutation (e.g., update_local_job or add_local_job) using defaults for missing fields. Do not wait for confirmation. Do it now." }]
              });
              continue;
            }
          }
          finalAnswer = textOut;
          break;
        }

        const functionResponses = await this.executeToolCalls(functionCalls, hooks);

        this.history.push({ role: 'user', parts: functionResponses });
      } catch (e: any) {
        if (hooks?.onError) hooks.onError(e);
        finalAnswer = `Generation Error: ${e.message}`;
        break;
      }
    }

    if (iterations >= maxIterations) {
      finalAnswer = finalAnswer || 'Max iterations (30) exceeded without a final answer.';
    }

    return finalAnswer;
  }

  // -------------------------------------------------------------------------
  // Streaming loop
  // -------------------------------------------------------------------------

  /**
   * Like runLoop() but streams text chunks via hooks.onChunk().
   * Tool-call iterations are still non-streaming (we need the full response
   * to extract functionCalls reliably).
   */
  public async runLoopStreaming(prompt: string, hooks?: IterationHook): Promise<string> {
    this.history.push({ role: 'user', parts: [{ text: prompt }] });

    const genAITools = this.tools.map(convertToGenAITool);
    const config = this.buildGenerateConfig(genAITools);

    let maxIterations = 30;
    let iterations = 0;
    let finalAnswer = '';

    while (iterations < maxIterations) {
      iterations++;
      if (hooks?.onStart) hooks.onStart();

      await this.maybeCompact(hooks);

      try {
        // Use streaming for final text responses; non-streaming for tool call turns
        const streamResponse = await retryWithBackoff(() =>
          this.ai.models.generateContentStream({
            model: this.model,
            contents: this.history,
            config: config as any,
          }),
        );

        let accumulatedText = '';
        let accumulatedFunctionCalls: any[] = [];
        // Collect raw parts across all chunks so thought_signature is preserved
        let accumulatedRawParts: any[] = [];

        for await (const chunk of streamResponse) {
          // Manually extract text to avoid the SDK's "there are non-text parts" warning
          let chunkText = '';
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          if (parts.length > 0) {
            // Accumulate raw parts for history (preserves thought_signature)
            accumulatedRawParts.push(...parts);
            chunkText = parts
              .filter((p: any) => p.text && !p.functionCall && !p.thought)
              .map((p: any) => p.text)
              .join('');
          } else if (chunk.text && !chunk.text.includes('there are non-text parts')) {
            chunkText = chunk.text;
          }

          if (chunkText) {
            accumulatedText += chunkText;
            if (hooks?.onChunk) hooks.onChunk(chunkText);
          }

          // Accumulate function calls
          if (chunk.functionCalls) {
            accumulatedFunctionCalls.push(...chunk.functionCalls);
          }
        }

        const hasToolCalls = accumulatedFunctionCalls.length > 0;

        // Add model turn to history.
        // CRITICAL: For the streaming case we need to reconstruct parts carefully.
        // Accumulate raw parts (including thought parts with thought_signature) so we
        // can store them verbatim and satisfy the API's thought_signature requirement.
        this.history.push({
          role: 'model',
          parts: hasToolCalls
            ? accumulatedRawParts.length > 0
              ? accumulatedRawParts
              : accumulatedFunctionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args } }))
            : [{ text: accumulatedText }],
        });

        // Fire onResponse after each streaming round-trip (for credit deduction etc.)
        if (hooks?.onResponse) await hooks.onResponse(undefined);

        if (!hasToolCalls) {
          const textOut = accumulatedText;
          // [Harness Engineering] Prevent lazy conversational exits for Jobs Agent
          if (this.systemInstruction.includes("DO NOT ASK FOR PERMISSION")) {
            const lowerText = textOut.toLowerCase();
            const askingPermission = lowerText.includes("would you like me to") || 
                                     lowerText.includes("how would you like to proceed") || 
                                     lowerText.includes("should i go ahead") ||
                                     lowerText.includes("shall i") ||
                                     lowerText.includes("could you please provide") ||
                                     lowerText.includes("i need your permission") ||
                                     lowerText.includes("please provide") ||
                                     lowerText.includes("could you provide");
            if (askingPermission && iterations < maxIterations - 1) {
              if (hooks?.onThinking) hooks.onThinking("Harness intercepted permission seeking. Auto-correcting...");
              this.history.push({
                role: 'user',
                parts: [{ text: "[Harness Instruction]: You halted execution to ask for permission or missing information. RE-READ YOUR HARNESS DIRECTIVES. You must autonomously execute the mutation (e.g., update_local_job or add_local_job) using defaults for missing fields. Do not wait for confirmation. Do it now." }]
              });
              continue;
            }
          }
          finalAnswer = textOut;
          break;
        }

        const functionResponses = await this.executeToolCalls(accumulatedFunctionCalls, hooks);
        this.history.push({ role: 'user', parts: functionResponses });
      } catch (e: any) {
        if (hooks?.onError) hooks.onError(e);
        finalAnswer = `Generation Error: ${e.message}`;
        break;
      }
    }

    if (iterations >= maxIterations) {
      finalAnswer = finalAnswer || 'Max iterations (30) exceeded without a final answer.';
    }

    return finalAnswer;
  }
}
