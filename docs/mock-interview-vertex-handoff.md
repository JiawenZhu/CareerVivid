# Mock Interview Vertex AI Handoff

This branch is for the mock interview experience UI. Keep the existing Vertex AI live-interview architecture intact while changing the user experience.

## Active Worktree

- Worktree: `/Users/jiawenzhu/.codex/worktrees/a6f1/careervivid`
- Branch: `codex/mock-interview-experience-thread`
- Remote: `origin/codex/mock-interview-experience-thread`
- Baseline: `50a26ae`

## Source Of Truth

The current signed-in mock interview flow uses Vertex AI Gemini Live. Do not replace it with a browser-visible permanent Gemini API key.

Key files:

- `functions/src/index.ts`
  - `getInterviewVertexToken` is the web callable token vending endpoint.
  - It rejects anonymous users, checks monthly credits, supports prewarm mode, creates `interviewSessions` docs on real starts, and returns a short-lived Vertex OAuth token.
  - `billInterviewSession` charges credits after the voice session ends.
- `src/components/aiInterviewAgent/useAIInterviewAgentSession.ts`
  - Prewarm calls `getInterviewVertexToken({ role, prewarm: true })`.
  - Signed-in start calls `getInterviewVertexToken({ role })`.
  - The browser uses the returned token only for the Vertex Live WebSocket URL.
  - The current Vertex Live model path is `projects/{project}/locations/{location}/publishers/google/models/gemini-live-2.5-flash-native-audio`.
  - The WebSocket path is `/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`.
- `functions/src/utils/ai.ts`
  - Server-side text generation should use the shared `getAIClient(undefined, location)` Vertex pattern.

## Guardrails

- Preserve Vertex AI Live for authenticated users.
- Do not expose permanent Gemini keys in frontend code.
- Do not replace `getInterviewVertexToken` with `VITE_GOOGLE_API_KEY` for signed-in users.
- Guest/demo paths may still use a public configured key if the existing product intentionally allows that.
- Keep text-model routing separate from Live API routing. Gemini 3 text models may use `global`; Vertex Live must remain regional unless reverified.
- Do not deploy functions or hosting without explicit user approval.

## Verification

When changing interview UI only, run the relevant frontend checks.

When changing functions, run:

```bash
npm --prefix functions run build
```

If a live Vertex probe is needed, use a tiny non-sensitive prompt/session setup check and never log tokens or key values.
