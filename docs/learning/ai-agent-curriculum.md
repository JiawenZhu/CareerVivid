# CareerVivid AI-Agent Curriculum

A 10-step path from "what is an LLM" to shipping a real agent project. Each step has learning objectives, hands-on exercises, a capstone-flavored mini-project, and the source repos it draws from (see [resource-inventory.md](resource-inventory.md) for licenses). Content here is CareerVivid's own writing/curation — the source repos are references and exercise material, not something we republish verbatim.

Module ids match `data/learning/modules/*.json` 1:1.

## 01 — Foundations

**Objective:** build a mental model of the AI/LLM/agent landscape before touching code — what a model is, what "generative AI" actually means, where agents fit.

- What a language model is vs. a chatbot vs. an agent
- The current landscape: base models, fine-tunes, hosted APIs, open-weights
- Where CareerVivid-style products sit in this stack
- Map of the rest of this curriculum

**Exercise:** Draw (or fill in) a one-page map of the AI/LLM/agent landscape, placing 5 tools/products you already use into it.

**Project:** N/A (orientation module).

**Sources:** microsoft/generative-ai-for-beginners

## 02 — LLM Basics

**Objective:** understand what's actually happening inside a model call — tokens, context windows, sampling — well enough to reason about cost, latency, and failure modes.

- Tokenization and why it affects cost/latency
- Context windows and truncation
- Temperature, top-p, and other sampling controls
- Inference vs. training; what "fine-tuning" changes and what it doesn't
- Picking a model for a task (cost/quality/latency triangle)

**Exercise:** Take one prompt and run it at three different temperatures; explain the variance you see.

**Project:** A short model-selection memo: given a hypothetical feature (e.g. resume tailoring), justify a model choice on cost/quality/latency grounds.

**Sources:** mlabonne/llm-course, microsoft/generative-ai-for-beginners

## 03 — Prompt Engineering

**Objective:** move from "ask and hope" to reliable, structured prompting.

- Prompt anatomy: system/instructions/context/examples
- Few-shot examples and when they help vs. hurt
- Chain-of-thought and when to show/hide reasoning
- ReAct-style prompting (reason + act)
- Structured output (JSON mode / schemas) and why it matters for agents

**Exercise:** Take an unreliable prompt (provided) and rewrite it three ways — zero-shot, few-shot, structured-output — and compare outputs.

**Project:** Build a prompt template (with a schema) for one CareerVivid use case, e.g. "extract structured job requirements from a job description."

**Sources:** dair-ai/Prompt-Engineering-Guide, openai/openai-cookbook, anthropics/claude-cookbooks

## 04 — Retrieval-Augmented Generation (RAG)

**Objective:** ground model output in real data instead of relying on parametric memory.

- Embeddings and vector similarity, intuitively
- Chunking strategies and why chunk size/overlap matters
- Vector store basics (indexing, top-k retrieval)
- Re-ranking and why raw top-k retrieval often isn't enough
- Evaluating a RAG pipeline (not just "does it look right")

**Exercise:** Chunk a sample document three different ways and compare retrieval quality for the same query.

**Project:** A minimal RAG pipeline over a small CareerVivid-relevant corpus (e.g. a handful of interview guides) with retrieval + generation + a basic eval.

**Sources:** openai/openai-cookbook, google-gemini/cookbook, anthropics/claude-cookbooks, dair-ai/Prompt-Engineering-Guide, microsoft/generative-ai-for-beginners

## 05 — Agent Architecture

**Objective:** understand the core agent loop — plan, act, observe, repeat — and how tool calling actually works under the hood.

- Tool/function calling: schemas, invocation, result handling
- The plan → act → observe loop
- Memory: short-term (conversation) vs. long-term (persisted state)
- Single-agent patterns: reflexion, self-correction

**Exercise:** Implement a single tool-calling loop (calculator or web-search tool) with a hard iteration cap and observe where it goes wrong.

**Project:** A single agent that uses 2+ tools to complete a multi-step task end-to-end (e.g. "look up a company, summarize its interview process").

**Sources:** microsoft/ai-agents-for-beginners, huggingface/agents-course, anthropics/claude-cookbooks

## 06 — Multi-Agent Systems

**Objective:** understand when and how to split work across multiple cooperating agents instead of one god-agent.

- Supervisor/worker patterns
- Role specialization vs. one general-purpose agent
- Shared state and handoff protocols between agents
- Failure containment: one agent's mistake shouldn't cascade

**Exercise:** Take the module-05 single agent and split it into a supervisor + 2 specialist workers; compare reliability.

**Project:** A small multi-agent workflow (e.g. researcher agent + writer agent + reviewer agent) for one CareerVivid content task.

**Sources:** huggingface/agents-course, microsoft/ai-agents-for-beginners
**Reference (external, not cloned):** Claude Code Docs — sub-agent orchestration patterns (read for inspiration, written up original here)

## 07 — Evaluation & Observability

**Objective:** move from "it seemed to work in my one test" to a real evaluation practice.

- Building a small eval/test set for a given task
- Scoring approaches: exact-match, rubric-based, LLM-as-judge (and its pitfalls)
- Tracing a multi-step agent run for debugging
- Failure analysis: categorizing *why* a run failed, not just that it did

**Exercise:** Write a 10-case eval set for the module-05 agent and score its outputs against a rubric.

**Project:** Add tracing + an eval harness to the multi-agent project from module 06.

**Sources:** openai/openai-cookbook, huggingface/agents-course, anthropics/claude-cookbooks

## 08 — Security

**Objective:** understand the failure modes specific to LLM/agent systems, not just generic appsec.

- Prompt injection: direct and indirect (e.g. via retrieved documents)
- Tool/permission boundaries — least-privilege for agent tool access
- MCP security considerations when agents call external tools/servers
- Data exfiltration risks in RAG and tool-using agents

**Exercise:** Given a sample tool-using agent, find one prompt-injection vector and propose a mitigation.

**Project:** A security checklist applied to the module-06 multi-agent project: what's the blast radius if one agent is compromised?

**Sources:** microsoft/ai-agents-for-beginners
**Reference (external, not cloned):** OWASP LLM Top 10, Claude Code permission-model docs

## 09 — Deployment

**Objective:** get an agent from "works on my machine" to something that runs reliably in production.

- API design for agent-backed features (sync vs. streaming vs. async/queued)
- Caching strategies to cut cost and latency
- Cost controls: budgets, rate limits, fallback models
- Basic deployment templates (containerized service, serverless function)

**Exercise:** Add a response cache + a hard per-user rate limit to the module-06 project.

**Project:** Deploy one prior project (module 05, 06, or 07) behind a real API endpoint with basic cost controls.

**Sources:** anthropics/claude-quickstarts, google-gemini/cookbook, mlabonne/llm-course

## 10 — Capstone Projects

**Objective:** ship one real, end-to-end portfolio project using everything from modules 01–09.

Pick one (or do all three over time):

1. **OpenAI RAG app** — a RAG-backed Q&A tool over a real document set, with retrieval, generation, and an eval harness.
2. **Gemini multimodal app** — an app that combines text + image/audio input using Gemini's multimodal capabilities.
3. **Claude agent workflow** — a tool-using, multi-step agent workflow built on Claude, with tracing and a security review.

Each capstone should include: a README, an eval/test set, basic cost/latency notes, and a short security review (borrowing the module-08 checklist).

**Sources:** openai/openai-cookbook, google-gemini/cookbook, anthropics/claude-quickstarts
