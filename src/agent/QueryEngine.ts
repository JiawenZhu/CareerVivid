import { GoogleGenAI, GenerateContentResponse, Content, Part } from '@google/genai';
import { Tool, convertToGenAITool } from './Tool';
import { compactHistory } from './contextCompaction';

// ---------------------------------------------------------------------------
// Coding System Prompt (shared between CLI and web)
// ---------------------------------------------------------------------------
export const CODING_AGENT_SYSTEM_PROMPT = `
You are an expert autonomous coding agent running inside CareerVivid.
You have access to tools that let you analyze and edit code in the browser.

## Core Rules

1. **EXPLORE BEFORE ACTING** — Before editing any code, read and understand the existing structure first.
2. **PLAN BEFORE CODING** — Describe your approach in a short "Plan:" before producing code.
3. **MINIMAL FOOTPRINT** — Make the smallest, most focused change that solves the problem.
4. **SELF-VERIFY** — After producing code, review it for logical errors, edge cases, and TypeScript issues.
5. **BE EXPLICIT ABOUT UNCERTAINTY** — Present options and a recommendation rather than silently deciding.

## Code Quality Standards

- Use TypeScript with strict types. Avoid 'any' unless unavoidable.
- Follow the existing code style in the snippet being edited.
- Add JSDoc to all public functions and interfaces.
- Keep functions short and focused on a single responsibility.
`.trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryEngineOptions {
  model?: string;
  systemInstruction?: string;
  tools?: Tool[];
  apiKey?: string;
  /** Max thinking tokens for Gemini 2.5+. Set to 0 to disable. Default: 0 (off) */
  thinkingBudget?: number;
  /** Auto-compact history when it exceeds this many turns. Default: 40 */
  maxHistoryLength?: number;
}

export interface IterationHook {
  onStart?: () => void;
  onResponse?: (response: GenerateContentResponse) => void;
  onToolCall?: (toolName: string, args: any) => Promise<boolean | void>;
  onToolResult?: (toolName: string, result: any) => void;
  onError?: (error: Error) => void;
  /** Fired for each text chunk during streaming */
  onChunk?: (text: string) => void;
  /** Fired when the context is being auto-compacted */
  onCompacting?: () => void;
}

// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------

function isRetryableError(e: any): boolean {
  if (e?.status && [429, 500, 502, 503, 504].includes(e.status)) return true;
  if (e?.message && /rate.?limit|quota|too.?many.?requests|service.?unavailable/i.test(e.message)) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt === maxRetries || !isRetryableError(e)) throw e;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error('retryWithBackoff: unreachable');
}

// ---------------------------------------------------------------------------
// QueryEngine
// ---------------------------------------------------------------------------

/**
 * Browser-compatible QueryEngine with streaming, thinking mode, auto-compaction,
 * and exponential-backoff retry. Does not import any Node.js-only modules.
 */
export class QueryEngine {
  private ai: GoogleGenAI;
  private history: Content[] = [];
  private model: string;
  private systemInstruction: string;
  private tools: Tool[];
  private toolMap: Map<string, Tool>;
  private thinkingBudget: number;
  private maxHistoryLength: number;

  constructor(options: QueryEngineOptions = {}) {
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model || 'gemini-2.5-flash';
    this.systemInstruction = options.systemInstruction || CODING_AGENT_SYSTEM_PROMPT;
    this.tools = options.tools || [];
    this.toolMap = new Map(this.tools.map(t => [t.name, t]));
    this.thinkingBudget = options.thinkingBudget ?? 0;
    this.maxHistoryLength = options.maxHistoryLength ?? 40;
  }

  public getHistory(): Content[] {
    return this.history;
  }

  public setHistory(history: Content[]) {
    this.history = history;
  }

  public addTools(tools: Tool[]) {
    for (const t of tools) {
      this.tools.push(t);
      this.toolMap.set(t.name, t);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildConfig(genAITools: any[]) {
    const config: Record<string, any> = {
      systemInstruction: this.systemInstruction,
    };
    if (genAITools.length > 0) config.tools = genAITools;
    if (this.thinkingBudget > 0) {
      config.thinkingConfig = { thinkingBudget: this.thinkingBudget };
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
    const responses: Part[] = [];

    for (const call of functionCalls) {
      const toolName = call.name || '';
      const args = call.args || {};
      const tool = this.toolMap.get(toolName);

      if (!tool) {
        responses.push({
          functionResponse: {
            name: toolName,
            response: { error: `Tool "${toolName}" not found. Available: ${[...this.toolMap.keys()].join(', ')}` },
          },
        });
        continue;
      }

      if (hooks?.onToolCall) {
        const allow = await hooks.onToolCall(toolName, args);
        if (allow === false) {
          responses.push({
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
        responses.push({ functionResponse: { name: toolName, response: { result } } });
      } catch (err: any) {
        responses.push({
          functionResponse: { name: toolName, response: { error: String(err.message || err) } },
        });
      }
    }

    return responses;
  }

  // -------------------------------------------------------------------------
  // Non-streaming loop
  // -------------------------------------------------------------------------

  public async runLoop(prompt: string, hooks?: IterationHook): Promise<string> {
    this.history.push({ role: 'user', parts: [{ text: prompt }] });

    const genAITools = this.tools.map(convertToGenAITool);
    const config = this.buildConfig(genAITools);

    let maxIterations = 30;
    let iterations = 0;
    let finalAnswer = '';

    while (iterations < maxIterations) {
      iterations++;
      if (hooks?.onStart) hooks.onStart();

      await this.maybeCompact(hooks);

      try {
        const response = await retryWithBackoff(() =>
          this.ai.models.generateContent({
            model: this.model,
            contents: this.history,
            config: config as any,
          }),
        );

        if (hooks?.onResponse) hooks.onResponse(response);

        const functionCalls = response.functionCalls;
        const hasToolCalls = functionCalls && functionCalls.length > 0;

        this.history.push({
          role: 'model',
          parts: hasToolCalls
            ? functionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args } }))
            : [{ text: response.text || '' }],
        });

        if (!hasToolCalls) {
          finalAnswer = response.text || '';
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
      finalAnswer = finalAnswer || 'Max iterations (30) exceeded.';
    }

    return finalAnswer;
  }

  // -------------------------------------------------------------------------
  // Streaming loop
  // -------------------------------------------------------------------------

  /**
   * Like runLoop() but fires hooks.onChunk() for each text token.
   * Tool-call iterations are non-streaming (functionCalls are only in the full response).
   */
  public async runLoopStreaming(prompt: string, hooks?: IterationHook): Promise<string> {
    this.history.push({ role: 'user', parts: [{ text: prompt }] });

    const genAITools = this.tools.map(convertToGenAITool);
    const config = this.buildConfig(genAITools);

    let maxIterations = 30;
    let iterations = 0;
    let finalAnswer = '';

    while (iterations < maxIterations) {
      iterations++;
      if (hooks?.onStart) hooks.onStart();

      await this.maybeCompact(hooks);

      try {
        const stream = await retryWithBackoff(() =>
          this.ai.models.generateContentStream({
            model: this.model,
            contents: this.history,
            config: config as any,
          }),
        );

        let accText = '';
        let accFunctionCalls: any[] = [];

        for await (const chunk of stream) {
          if (chunk.text) {
            accText += chunk.text;
            if (hooks?.onChunk) hooks.onChunk(chunk.text);
          }
          if (chunk.functionCalls) {
            accFunctionCalls.push(...chunk.functionCalls);
          }
        }

        const hasToolCalls = accFunctionCalls.length > 0;

        this.history.push({
          role: 'model',
          parts: hasToolCalls
            ? accFunctionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args } }))
            : [{ text: accText }],
        });

        if (!hasToolCalls) {
          finalAnswer = accText;
          break;
        }

        const functionResponses = await this.executeToolCalls(accFunctionCalls, hooks);
        this.history.push({ role: 'user', parts: functionResponses });
      } catch (e: any) {
        if (hooks?.onError) hooks.onError(e);
        finalAnswer = `Generation Error: ${e.message}`;
        break;
      }
    }

    if (iterations >= maxIterations) {
      finalAnswer = finalAnswer || 'Max iterations (30) exceeded.';
    }

    return finalAnswer;
  }
}
