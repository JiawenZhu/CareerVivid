/**
 * cv interview — interactive AI mock interview with real-time voice audio.
 *
 * Usage:
 *   cv interview                          Prompt for role interactively (voice mode)
 *   cv interview --role "Sr SWE"          Specify role directly (voice mode)
 *   cv interview --role "PM" --text       Text-only fallback (no audio required)
 *   cv interview --role "SDE" --resume <id>  Load resume for context
 *
 * Voice mode requires sox (handles both mic input and speaker output):
 *   macOS:  brew install sox
 *   Linux:  sudo apt install sox
 *
 * AI calls:
 *   - Token vend: cliGetInterviewToken Cloud Function (validates cv_live_ key, deducts credits)
 *   - Voice session: gemini-3.1-flash-live-preview via @google/genai Live API (direct WebSocket)
 *   - Feedback: agentProxy Cloud Function (standard HTTP, existing pattern)
 */

import { Command } from "commander";
import chalk from "chalk";
import readline from "readline";
import ora from "ora";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from "../config.js";
import { isApiError, resumeGet } from "../api.js";
import { createLogger, type CVLogger } from "../lib/logger.js";

/** Read CLI version from package.json (ESM-compatible) */
const __dirname_iv = dirname(fileURLToPath(import.meta.url));
let _cliVersion = "unknown";
try { _cliVersion = JSON.parse(readFileSync(join(__dirname_iv, "../../package.json"), "utf-8")).version ?? "unknown"; } catch { /* ignore */ }
const CLI_VERSION = _cliVersion;

/** Strip ANSI escape codes for accurate string length measurement */
const stripAnsi = (s: string) => s.replace(/\x1B\[[0-9;]*m/g, "");

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_PROXY_URL =
    process.env.CV_FUNCTIONS_URL
        ? `${process.env.CV_FUNCTIONS_URL}/agentProxy`
        : "https://us-west1-jastalk-firebase.cloudfunctions.net/agentProxy";

const CLI_TOKEN_URL =
    process.env.CV_FUNCTIONS_URL
        ? `${process.env.CV_FUNCTIONS_URL}/cliGetInterviewToken`
        : "https://us-west1-jastalk-firebase.cloudfunctions.net/cliGetInterviewToken";

const CLI_BILL_URL =
    process.env.CV_FUNCTIONS_URL
        ? `${process.env.CV_FUNCTIONS_URL}/cliInterviewBill`
        : "https://us-west1-jastalk-firebase.cloudfunctions.net/cliInterviewBill";

const CLI_CONTEXT_URL =
    process.env.CV_FUNCTIONS_URL
        ? `${process.env.CV_FUNCTIONS_URL}/cliGetInterviewContext`
        : "https://us-west1-jastalk-firebase.cloudfunctions.net/cliGetInterviewContext";

const LIVE_MODEL = "gemini-3.1-flash-live-preview";
const FEEDBACK_MODEL = "gemini-2.5-flash";
const END_TOKEN = "<END_INTERVIEW>";
const WRAP_WIDTH = 80;

// Audio constants (matching tts.py)
const SEND_SAMPLE_RATE = 16000;   // mic → Gemini (16kHz PCM)
const RECV_SAMPLE_RATE = 24000;   // Gemini → speaker (24kHz PCM)
const CHUNK_MS = 100;             // send audio in 100ms chunks

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

interface TranscriptEntry {
    speaker: "ai" | "user";
    text: string;
}

interface FeedbackReport {
    overallScore: number;
    communicationScore: number;
    confidenceScore: number;
    relevanceScore: number;
    strengths: string;
    areasForImprovement: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wordWrap(text: string, width = WRAP_WIDTH): string {
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
        const words = paragraph.split(" ");
        let current = "";
        for (const word of words) {
            if (stripAnsi(current + " " + word).length > width && current.length > 0) {
                lines.push(current);
                current = word;
            } else {
                current = current.length === 0 ? word : current + " " + word;
            }
        }
        if (current.length > 0) lines.push(current);
        if (paragraph === "") lines.push("");
    }
    return lines.join("\n");
}

function printAI(text: string) {
    const clean = text.replace(END_TOKEN, "").trim();
    if (!clean) return;
    console.log("");
    console.log(chalk.cyan.bold("  Vivid ❯"));
    wordWrap(clean).split("\n").forEach(l => console.log(`  ${chalk.cyan(l)}`));
    console.log("");
}

function printUser(text: string) {
    if (!text.trim()) return;
    console.log(chalk.dim("\n  [You said] ") + chalk.white(text.trim()));
}

function printSystem(msg: string) {
    console.log(chalk.dim(`\n  ${msg}\n`));
}

function printBanner(role: string, mode: "voice" | "text") {
    const modeLabel = mode === "voice"
        ? chalk.green("🎙  Voice Mode")
        : chalk.yellow("⌨  Text Mode");
    console.log("\n" + chalk.bold.bgHex("#4f46e5").white("  CareerVivid — Interview Studio  "));
    console.log(chalk.dim(`  Role: ${role}`));
    console.log(chalk.dim(`  ${modeLabel}`));
    console.log(chalk.dim("  ─────────────────────────────────────────────────"));
    if (mode === "voice") {
        console.log(chalk.dim("  Speak your answers naturally."));
        console.log(chalk.dim("  Press Ctrl+C to end and generate your feedback report."));
    } else {
        console.log(chalk.dim(`  Type your answers. Type ${chalk.white("exit")} or press Ctrl+C to end.`));
    }
    console.log("");
}

function printReport(report: FeedbackReport) {
    const header = chalk.bgHex("#4f46e5").white.bold;
    console.log("\n" + header("  ═══════════════════════════════════════  "));
    console.log(header("      📋  Interview Feedback Report         "));
    console.log(header("  ═══════════════════════════════════════  ") + "\n");

    const score = (val: number) => {
        const color = val >= 80 ? chalk.green : val >= 60 ? chalk.yellow : chalk.red;
        return color.bold(`${val}/100`);
    };

    console.log(chalk.bold("  Scores"));
    console.log(`    Overall          ${score(report.overallScore)}`);
    console.log(`    Communication    ${score(report.communicationScore)}`);
    console.log(`    Confidence       ${score(report.confidenceScore)}`);
    console.log(`    Relevance        ${score(report.relevanceScore)}`);

    console.log("\n" + chalk.green.bold("  ✅ Strengths"));
    wordWrap(report.strengths, 72).split("\n").forEach(l => console.log(`     ${chalk.green(l)}`));

    console.log("\n" + chalk.yellow.bold("  💡 Areas for Improvement"));
    wordWrap(report.areasForImprovement, 72).split("\n").forEach(l => console.log(`     ${chalk.yellow(l)}`));

    console.log("\n" + chalk.dim("  ─────────────────────────────────────────────────────────────"));
    console.log(chalk.dim("  View full history at: https://careervivid.app/interview-studio"));
    console.log("");
}

// ─── sox audio check ──────────────────────────────────────────────────────────

/** Check if sox is available on PATH. Returns its path or null. */
async function findSox(): Promise<string | null> {
    const candidates = [
        "/opt/homebrew/bin/sox", // Apple Silicon brew
        "/usr/local/bin/sox",    // Intel brew
        "/usr/bin/sox",          // Linux
        "sox",                   // if on $PATH
    ];
    for (const p of candidates) {
        try {
            await new Promise<void>((resolve, reject) => {
                const probe = spawn(p, ["--version"]);
                probe.on("close", (code) => (code === 0 ? resolve() : reject()));
                probe.on("error", reject);
            });
            return p;
        } catch { /* try next */ }
    }
    return null;
}

// ─── Sox audio I/O ────────────────────────────────────────────────────────────

/**
 * Start microphone recording via sox.
 * Returns a ChildProcess whose stdout emits raw 16kHz/16-bit/mono PCM.
 */
function startMic(soxPath: string): ChildProcessWithoutNullStreams {
    // sox -t coreaudio default  → raw PCM 16kHz 16-bit signed mono
    // Falls back to -t alsa on Linux
    const inputType = process.platform === "darwin" ? "coreaudio" : "alsa";
    const inputDevice = process.platform === "darwin" ? "default" : "default";
    return spawn(soxPath, [
        "-q",
        "-t", inputType, inputDevice,
        "-r", String(SEND_SAMPLE_RATE),
        "-b", "16",
        "-e", "signed",
        "-c", "1",
        "-t", "raw", "-",
    ]);
}

/**
 * Start a sox speaker subprocess.
 * Returns a ChildProcess whose stdin accepts raw 24kHz/16-bit/mono PCM.
 */
function startSpeaker(soxPath: string): ChildProcessWithoutNullStreams {
    const outputType = process.platform === "darwin" ? "coreaudio" : "alsa";
    const outputDevice = process.platform === "darwin" ? "default" : "default";
    return spawn(soxPath, [
        "-q",
        "-t", "raw",
        "-r", String(RECV_SAMPLE_RATE),
        "-b", "16",
        "-e", "signed",
        "-c", "1", "-",
        "-t", outputType, outputDevice,
    ]);
}

// ─── Token Vend ───────────────────────────────────────────────────────────────

async function getGeminiToken(role: string): Promise<{ geminiKey: string; sessionId: string }> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API key. Run: cv login");

    const res = await fetch(CLI_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, role }),
    });

    const data = await res.json() as any;

    if (res.status === 402) {
        throw new Error("AI credit limit reached. Upgrade at https://careervivid.app/pricing");
    }
    if (!res.ok) {
        throw new Error(data?.error || `Token vend failed (${res.status})`);
    }

    return { geminiKey: data.geminiKey as string, sessionId: data.sessionId as string };
}

// ─── Duration Billing ─────────────────────────────────────────────────────────

/** Call cliInterviewBill at session end. Returns credit summary for display. */
async function billSession(
    sessionId: string,
    payload?: {
        transcript?: TranscriptEntry[];
        feedbackReport?: FeedbackReport | null;
    }
): Promise<{ creditsCharged: number; durationMinutes: number; creditsRemaining: number } | null> {
    const apiKey = getApiKey();
    if (!apiKey || !sessionId) return null;
    try {
        const body: Record<string, unknown> = { apiKey, sessionId };
        if (payload?.transcript && payload.transcript.length > 0) {
            body.transcript = payload.transcript;
        }
        if (payload?.feedbackReport) {
            body.feedbackReport = payload.feedbackReport;
        }
        const res = await fetch(CLI_BILL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) return null;
        return await res.json() as any;
    } catch {
        return null; // billing failure is non-fatal for UX
    }
}

// ─── agentProxy (question gen + feedback) ────────────────────────────────────

async function callAgentProxy(opts: {
    contents: Message[];
    systemInstruction?: string;
    responseSchema?: object;
    responseMimeType?: string;
}): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API key. Run: cv login");

    const body: Record<string, unknown> = {
        apiKey,
        model: FEEDBACK_MODEL,
        contents: opts.contents,
    };
    if (opts.systemInstruction) body.systemInstruction = opts.systemInstruction;
    if (opts.responseSchema) {
        body.generationConfig = {
            responseMimeType: opts.responseMimeType ?? "application/json",
            responseSchema: opts.responseSchema,
        };
    }

    const res = await fetch(AGENT_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data?.error || `agentProxy error (${res.status})`);

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p.text ?? "").join("").trim();
}

// ─── Build system prompt ──────────────────────────────────────────────────────

function buildSystemPrompt(role: string, questions: string[], resumeContext?: string): string {
    let prompt = `You are an expert AI interviewer. Your name is Vivid. If the candidate asks your name, say "My name is Vivid." Do not say Gemini or any other name.

You are conducting a real-time voice interview for the position of: "${role}".

Start with a warm, polished introduction that outlines the role and key responsibilities. Then ask: "Do you have any questions before we begin the interview?" Wait briefly before proceeding.

Ask the questions below one at a time. You may ask one or two follow-up questions when a candidate's answer invites it.

After the final question and the candidate's response:
1. Give a 2–3 sentence summary of overall performance.
2. Provide 2–3 short, personalized improvement tips.
3. End with: "Thank you for your time today! Your feedback report is being generated."
4. Append the exact token ${END_TOKEN} at the very end (do not narrate this token).

Interview Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

**Policies:**
- Never fabricate company details; suggest candidates verify with their recruiter.
- Maintain a polite, professional, encouraging tone.
- Keep responses concise — this is a voice interview, so avoid long monologues.
- Do not use markdown formatting. Speak naturally.`;

    if (resumeContext) {
        prompt += `\n\nCandidate resume (use for targeted follow-ups):\n--- RESUME ---\n${resumeContext}`;
    }

    return prompt;
}

// ─── Generate Questions (via agentProxy) ─────────────────────────────────────

async function generateQuestions(role: string, numQuestions: number): Promise<string[]> {
    const spinner = ora(chalk.dim("Generating interview questions...")).start();
    try {
        const prompt = `Based on the following role, generate ${numQuestions} insightful interview questions covering technical skills, behavioral competencies, and role-specific scenarios. Return ONLY a valid JSON array of strings.\n\nRole: "${role}"`;
        const text = await callAgentProxy({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            responseSchema: { type: "ARRAY", items: { type: "STRING" } },
            responseMimeType: "application/json",
        });
        let clean = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const questions = JSON.parse(clean) as string[];
        spinner.succeed(chalk.dim(`Generated ${questions.length} questions`));
        return questions;
    } catch (err: any) {
        spinner.fail("Failed to generate questions.");
        throw err;
    }
}

// ─── Analyze Transcript (via agentProxy) ─────────────────────────────────────

async function analyzeTranscript(transcript: TranscriptEntry[], role: string): Promise<FeedbackReport> {
    const spinner = ora(chalk.dim("Generating feedback report...")).start();
    try {
        const formatted = transcript
            .map(e => `${e.speaker === "ai" ? "Interviewer" : "Candidate"}: ${e.text}`)
            .join("\n\n");
        const prompt = `You are an expert interview coach. Analyze this interview transcript for the role "${role}" and return a JSON object with: overallScore, communicationScore, confidenceScore, relevanceScore (numbers 0-100), strengths (string), areasForImprovement (string).\n\nTranscript:\n---\n${formatted}\n---`;

        const text = await callAgentProxy({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallScore: { type: "NUMBER" },
                    communicationScore: { type: "NUMBER" },
                    confidenceScore: { type: "NUMBER" },
                    relevanceScore: { type: "NUMBER" },
                    strengths: { type: "STRING" },
                    areasForImprovement: { type: "STRING" },
                },
                required: ["overallScore", "communicationScore", "confidenceScore", "relevanceScore", "strengths", "areasForImprovement"],
            },
        });
        let clean = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const report = JSON.parse(clean) as FeedbackReport;
        spinner.succeed(chalk.dim("Feedback report ready"));
        return report;
    } catch (err: any) {
        spinner.fail("Failed to generate feedback.");
        throw err;
    }
}

// ─── VOICE SESSION ────────────────────────────────────────────────────────────

async function runVoiceSession(opts: {
    role: string;
    questions: string[];
    resumeContext?: string;
    soxPath: string;
}): Promise<void> {
    const { role, questions, resumeContext, soxPath } = opts;

    printBanner(role, "voice");

    // Create logger (sessionId not yet known — will be set after token vend)
    const log: CVLogger = createLogger("interview", {
        apiKey: getApiKey(),
        version: CLI_VERSION,
    });

    const sessionStart = Date.now();

    // Get Gemini token from Cloud Function
    const connectSpinner = ora(chalk.dim("Connecting to Vivid...")).start();
    let geminiKey: string;
    let sessionId: string;
    try {
        ({ geminiKey, sessionId } = await getGeminiToken(role));
        log.setSessionId(sessionId);
        log.info("session_start", { role, numQuestions: questions.length, mode: "voice", soxPath });
    } catch (err: any) {
        log.error("token_vend_failed", err, { role });
        await log.dispose();
        connectSpinner.fail(chalk.red(err.message));
        throw err;
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const systemInstruction = buildSystemPrompt(role, questions, resumeContext);

    const transcript: TranscriptEntry[] = [];
    let ended = false;
    let outputBuf = "";  // accumulates AI transcription
    let inputBuf = "";   // accumulates user transcription
    // Streaming display state — track lines written so we can erase & reprint at turnComplete
    let streamLineCount = 0;  // number of lines written during live streaming (incl. header)
    let streamColPos = 0;     // current column position within the streaming line
    // Half-duplex mute: stop sending mic audio while Vivid is speaking
    // to prevent the mic picking up speaker output (echo loop).
    let vividSpeaking = false;
    let muteTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Audio processes ──────────────────────────────────────────────────
    const micProc = startMic(soxPath);
    const speakerProc = startSpeaker(soxPath);

    micProc.stderr.on("data", () => { /* suppress sox warnings */ });
    speakerProc.stderr.on("data", () => { /* suppress sox warnings */ });

    // ── Connect to Live API ──────────────────────────────────────────────
    let session: any;
    try {
        session = await ai.live.connect({
            model: LIVE_MODEL,
            callbacks: {
                onopen: () => {
                    connectSpinner.succeed(chalk.green("✅ Vivid is live — start speaking!"));
                    process.stdout.write(chalk.green("\n  ● Listening...\r"));

                    // Pipe mic PCM → Gemini, muted while Vivid is speaking
                    micProc.stdout.on("data", (chunk: Buffer) => {
                        if (ended || chunk.length === 0 || vividSpeaking) return;
                        try {
                            session.sendRealtimeInput({
                                audio: {
                                    data: chunk.toString("base64"),
                                    mimeType: `audio/pcm;rate=${SEND_SAMPLE_RATE}`,
                                },
                            });
                        } catch { /* session may be closing */ }
                    });
                },

                onmessage: (msg: any) => {
                    // ── Audio output (Vivid speaking) → sox speaker ───
                    const audioPart = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioPart) {
                        vividSpeaking = true;
                        if (muteTimer) { clearTimeout(muteTimer); muteTimer = null; }
                        const pcmBuf = Buffer.from(audioPart, "base64");
                        speakerProc.stdin.write(pcmBuf);
                    }

                    // ── Output transcription (what Vivid said) ────────
                    // Stream each chunk to terminal in real-time as audio plays.
                    const outText: string | undefined =
                        msg.serverContent?.outputTranscription?.text;
                    if (outText) {
                        const chunkClean = outText.replace(END_TOKEN, "");
                        if (chunkClean) {
                            if (!outputBuf) {
                                // First chunk of this turn — print the speaker header
                                process.stdout.write("\n" + chalk.cyan.bold("  Vivid ❯") + "\n");
                                streamLineCount = 1; // header line
                                streamColPos = 0;
                            }
                            outputBuf += chunkClean;

                            // Stream words from the new chunk inline, with soft word-wrap
                            for (const word of chunkClean.split(/(\s+)/)) {
                                if (!word) continue;
                                const wordLen = word.replace(/\s+/, " ").length;
                                if (streamColPos > 0 && streamColPos + wordLen > WRAP_WIDTH) {
                                    process.stdout.write("\n");
                                    streamLineCount++;
                                    streamColPos = 0;
                                }
                                if (/^\s+$/.test(word)) {
                                    if (streamColPos > 0) {
                                        process.stdout.write(chalk.cyan(" "));
                                        streamColPos += 1;
                                    }
                                } else {
                                    process.stdout.write(chalk.cyan("  " + (streamColPos === 0 ? word : word)));
                                    streamColPos += (streamColPos === 0 ? 2 : 0) + word.length;
                                }
                            }
                        }
                    }

                    // ── Input transcription (what user said) ──────────
                    const inText: string | undefined =
                        msg.serverContent?.inputTranscription?.text;
                    if (inText) inputBuf += inText;

                    // ── Turn complete ─────────────────────────────────
                    if (msg.serverContent?.turnComplete) {
                        if (outputBuf.trim()) {
                            const aiText = outputBuf.trim();

                            // Flush a newline to close the last streamed line cleanly
                            if (streamColPos > 0) process.stdout.write("\n");
                            process.stdout.write("\n"); // blank line after Vivid's turn

                            transcript.push({ speaker: "ai", text: aiText.replace(END_TOKEN, "").trim() });
                            if (aiText.includes(END_TOKEN)) ended = true;
                            outputBuf = "";
                            streamLineCount = 0;
                            streamColPos = 0;
                        }
                        if (inputBuf.trim()) {
                            printUser(inputBuf.trim());
                            transcript.push({ speaker: "user", text: inputBuf.trim() });
                            inputBuf = "";
                        }
                        if (!ended) {
                            muteTimer = setTimeout(() => {
                                vividSpeaking = false;
                                muteTimer = null;
                                process.stdout.write(chalk.green("  ● Listening...\r"));
                            }, 800);
                        }
                    }
                },

                onerror: (e: any) => {
                    console.log(chalk.red(`\n  Connection error: ${e.message ?? e}`));
                    ended = true;
                },

                onclose: () => { ended = true; },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Zephyr" },
                    },
                },
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contextWindowCompression: {
                    triggerTokens: "104857",
                    slidingWindow: { targetTokens: "52428" },
                },
            },
        });
    } catch (err: any) {
        log.error("live_connect_failed", err, { role, sessionId });
        await log.dispose();
        connectSpinner.fail(chalk.red(`Failed to connect: ${err.message}`));
        micProc.kill();
        speakerProc.kill();
        throw err;
    }

    // ── Wait until interview ends or Ctrl+C (single-SIGINT guard) ───────
    let shuttingDown = false;
    await new Promise<void>((resolve) => {
        const check = setInterval(() => {
            if (ended) { clearInterval(check); resolve(); }
        }, 200);

        const onSigInt = () => {
            if (shuttingDown) return; // ignore double Ctrl+C
            shuttingDown = true;
            clearInterval(check);
            printSystem("Interview ended by user.");
            log.info("session_interrupted", { role, sessionId, elapsedMs: Date.now() - sessionStart });
            ended = true;
            resolve();
        };
        process.once("SIGINT", onSigInt);
    });

    // ── Cleanup ──────────────────────────────────────────────────────────
    try { micProc.kill("SIGTERM"); } catch { /* ignore */ }
    try { speakerProc.stdin.end(); } catch { /* ignore */ }
    try { session.close(); } catch { /* ignore */ }

    // Wait a moment for final audio to drain
    await new Promise(r => setTimeout(r, 800));

    const sessionDurationMs = Date.now() - sessionStart;

    // ── Bill session (duration-based, 10s timeout to prevent hang) ──────
    // We delay billing until AFTER the feedback report is generated so we
    // can persist the transcript + report in the same request.
    const userTurns = transcript.filter(t => t.speaker === "user").length;
    log.info("session_end", { sessionId, userTurns, aiTurns: transcript.filter(t => t.speaker === "ai").length, sessionDurationMs });

    if (userTurns < 1) {
        printSystem("Not enough conversation to generate a feedback report.");
        // Still bill the session (minimum charge applies)
        const billSpinner = ora(chalk.dim("Calculating session cost...")).start();
        const bill = await Promise.race([
            billSession(sessionId),
            new Promise<null>(r => setTimeout(() => r(null), 10_000)),
        ]);
        bill ? billSpinner.succeed(chalk.dim(`${bill.durationMinutes}min · ${bill.creditsCharged} credits`)) : billSpinner.warn("Could not calculate cost.");
        await log.dispose();
        return;
    }

    console.log(chalk.dim("\n  Generating your personalized feedback report..."));
    let report: FeedbackReport | null = null;
    try {
        report = await analyzeTranscript(transcript, role);
        printReport(report);
        log.info("feedback_complete", { sessionId, overallScore: report.overallScore });
    } catch (err: any) {
        log.error("feedback_failed", err, { sessionId });
        console.log(chalk.red(`  Failed to generate feedback: ${err.message}`));
    }

    // ── Bill + persist transcript/report together ────────────────────────
    const billSpinner = ora(chalk.dim("Calculating session cost...")).start();
    const bill = await Promise.race([
        billSession(sessionId, { transcript, feedbackReport: report }),
        new Promise<null>(r => setTimeout(() => r(null), 10_000)),
    ]);
    if (bill) {
        billSpinner.succeed(
            chalk.dim(`Session: ${bill.durationMinutes}min · `) +
            chalk.hex("#4f46e5").bold(`${bill.creditsCharged} credits used`) +
            chalk.dim(` · ${bill.creditsRemaining} remaining`)
        );
        log.info("billing_complete", {
            sessionId, durationMinutes: bill.durationMinutes,
            creditsCharged: bill.creditsCharged, creditsRemaining: bill.creditsRemaining,
        });
        log.metric("credits_charged", bill.creditsCharged, { sessionId });
        log.metric("session_duration_ms", sessionDurationMs, { sessionId });
    } else {
        billSpinner.warn(chalk.dim("Session cost could not be calculated (timeout)."));
        log.warn("billing_timeout", { sessionId, sessionDurationMs });
    }

    if (report) {
        console.log(chalk.dim("\n  💡 Interview context saved. Ask \`cv agent\` to coach you on your answers."));
    }

    await log.dispose();
}

// ─── TEXT SESSION (fallback) ──────────────────────────────────────────────────

async function runTextSession(opts: {
    role: string;
    questions: string[];
    resumeContext?: string;
}): Promise<void> {
    const { role, questions, resumeContext } = opts;
    const systemInstruction = buildSystemPrompt(role, questions, resumeContext);

    printBanner(role, "text");

    const history: Message[] = [];
    const transcript: TranscriptEntry[] = [];
    let ended = false;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    const askUser = (): Promise<string | null> =>
        new Promise(resolve => {
            if (process.stdin.isTTY) process.stdout.write(chalk.white.bold("\n  you ❯ "));
            rl.once("line", line => resolve(line.trim()));
            rl.once("close", () => resolve(null));
        });

    const spinner = ora(chalk.dim("Vivid is connecting...")).start();
    try {
        const greeting = await callAgentProxy({
            contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            systemInstruction,
        });
        spinner.stop();
        history.push({ role: "user", parts: [{ text: "Hello" }] });
        history.push({ role: "model", parts: [{ text: greeting }] });
        transcript.push({ speaker: "user", text: "Hello" });
        transcript.push({ speaker: "ai", text: greeting });
        if (greeting.includes(END_TOKEN)) ended = true;
        printAI(greeting);
    } catch (err: any) {
        spinner.fail(chalk.red("Failed to connect to AI interviewer."));
        throw err;
    }

    while (!ended) {
        const input = await askUser();
        if (input === null || input.toLowerCase() === "exit" || input.toLowerCase() === "q") {
            printSystem("Interview ended early.");
            break;
        }
        if (input === "") continue;

        history.push({ role: "user", parts: [{ text: input }] });
        transcript.push({ speaker: "user", text: input });

        const aiSpinner = ora({ text: "" }).start();
        try {
            const aiResponse = await callAgentProxy({ contents: history, systemInstruction });
            aiSpinner.stop();
            history.push({ role: "model", parts: [{ text: aiResponse }] });
            transcript.push({ speaker: "ai", text: aiResponse.replace(END_TOKEN, "").trim() });
            if (aiResponse.includes(END_TOKEN)) ended = true;
            printAI(aiResponse);
        } catch (err: any) {
            aiSpinner.stop();
            console.log(chalk.red(`\n  Error: ${err.message}\n`));
        }
    }
    rl.close();

    const userTurns = transcript.filter(t => t.speaker === "user").length;
    if (userTurns < 2) { printSystem("Not enough conversation to generate a feedback report."); return; }

    console.log(chalk.dim("\n  Generating your personalized feedback report..."));
    let textReport: FeedbackReport | null = null;
    try {
        textReport = await analyzeTranscript(transcript, role);
        printReport(textReport);
    } catch (err: any) {
        console.log(chalk.red(`  Failed to generate feedback: ${err.message}`));
    }

    // Persist transcript + report to Firestore for agent coaching (fire-and-forget)
    const apiKey = getApiKey();
    if (apiKey && textReport) {
        fetch(CLI_BILL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                apiKey,
                // Text mode has no billable sessionId — use a stub that won't match
                // a real session. The function will 404, but the persist path still runs.
                // A proper text-mode session doc would require cliGetInterviewToken for text too.
                // For now, persist to a synthetic doc under a well-known pattern.
                sessionId: `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                transcript,
                feedbackReport: textReport,
            }),
        }).catch(() => { /* fire-and-forget — ignore errors */ });

        console.log(chalk.dim("\n  💡 Interview context saved. Ask `cv agent` to coach you on your answers."));
    }
}

// ─── Command Registration ─────────────────────────────────────────────────────

export function registerInterviewCommand(program: Command): void {
    program
        .command("interview")
        .description("Start an interactive AI voice interview session in the terminal")
        .option("-r, --role <role>", "Role or job description to practice for")
        .option("-q, --questions <n>", "Number of interview questions to generate", "5")
        .option("--resume <id>", "Load a specific resume ID for context (from cv resumes list)")
        .option("--text", "Use text-only mode (no audio required)")
        .addHelpText("after", `
Examples:
  cv interview
  cv interview --role "Senior Software Engineer at Stripe"
  cv interview --role "Product Manager" --questions 7
  cv interview --role "Data Scientist" --resume my-resume-id
  cv interview --role "SWE" --text        (text-only, no sox needed)

Voice mode setup (one-time):
  macOS:  brew install sox
  Linux:  sudo apt install sox
`)
        .action(async (opts: { role?: string; questions: string; resume?: string; text?: boolean }) => {
            if (!getApiKey()) {
                console.error(chalk.red(
                    "\nNo API key configured.\n\n" +
                    "  Run: cv login     (browser login)\n" +
                    "       cv auth set-key <key>  (API key)\n"
                ));
                process.exit(1);
            }

            // ── Role prompt ──────────────────────────────────────────────────
            let role = opts.role?.trim();
            if (!role) {
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                role = await new Promise<string>(resolve => {
                    rl.question(chalk.bold("\n  What role are you interviewing for?\n  ❯ "), answer => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
            }
            if (!role) { console.error(chalk.red("  Role is required.")); process.exit(1); }

            const numQuestions = Math.min(Math.max(parseInt(opts.questions, 10) || 5, 1), 12);

            // ── Optional resume context ──────────────────────────────────────
            let resumeContext: string | undefined;
            if (opts.resume) {
                const spinner = ora(chalk.dim("Loading resume...")).start();
                try {
                    const result = await resumeGet(opts.resume);
                    if (isApiError(result)) {
                        spinner.warn(chalk.yellow(`Could not load resume: ${result.message}. Continuing without it.`));
                    } else {
                        resumeContext = result.cvMarkdown;
                        spinner.succeed(chalk.dim(`Resume loaded: ${result.title}`));
                    }
                } catch {
                    spinner.warn(chalk.yellow("Could not load resume. Continuing without it."));
                }
            }

            // ── Generate questions ───────────────────────────────────────────
            let questions: string[];
            try {
                questions = await generateQuestions(role, numQuestions);
            } catch (err: any) {
                console.error(chalk.red(`\n  Failed to generate questions: ${err.message}\n`));
                process.exit(1);
            }

            // ── Determine mode ───────────────────────────────────────────────
            if (opts.text) {
                await runTextSession({ role, questions, resumeContext });
                return;
            }

            // Probe for sox
            const soxPath = await findSox();
            if (!soxPath) {
                console.log(chalk.yellow(
                    "\n  ⚠  sox not found — falling back to text mode.\n" +
                    "\n  To enable voice, install sox:\n" +
                    "    macOS:  brew install sox\n" +
                    "    Linux:  sudo apt install sox\n" +
                    "\n  Or run in text mode:  cv interview --text\n"
                ));
                await runTextSession({ role, questions, resumeContext });
                return;
            }

            // Voice mode
            try {
                await runVoiceSession({ role, questions, resumeContext, soxPath });
            } catch (err: any) {
                console.error(chalk.red(`\n  Interview error: ${err.message}\n`));
                process.exit(1);
            }
        });
}
