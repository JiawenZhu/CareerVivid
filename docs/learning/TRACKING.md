# AI-Agent Curriculum — Setup Tracking

Master checklist for standing up CareerVivid's AI-agent learning curriculum. Source repos are downloaded only after the license table in [resource-inventory.md](resource-inventory.md) is confirmed accurate.

Check off an item only when the file/step is actually done — this file is the source of truth for "what's left."

## Phase 0 — Directory structure

- [x] `docs/learning/` created
- [x] `data/learning/modules/` created
- [x] `third_party/learning-sources/LICENSES/` created and populated with copied source licenses

## Phase 1 — Documentation

- [x] `docs/learning/TRACKING.md` — this file
- [x] `docs/learning/resource-inventory.md` — full resource list with **verified** licenses, commercial-use flag, and module mapping
- [x] `docs/learning/ai-agent-curriculum.md` — 10-step CareerVivid curriculum outline (objectives, exercises, project, source mapping per step)

## Phase 2 — Machine-readable data

- [x] `data/learning/sources.json` — resource metadata (id, url, license, downloadable flag, module ids)
- [x] `data/learning/modules/01-foundations.json`
- [x] `data/learning/modules/02-llm-basics.json`
- [x] `data/learning/modules/03-prompt-engineering.json`
- [x] `data/learning/modules/04-rag.json`
- [x] `data/learning/modules/05-agent-architecture.json`
- [x] `data/learning/modules/06-multi-agent.json`
- [x] `data/learning/modules/07-evaluation-observability.json`
- [x] `data/learning/modules/08-security.json`
- [x] `data/learning/modules/09-deployment.json`
- [x] `data/learning/modules/10-capstone-projects.json`

## Phase 3 — Sync tooling and source downloads (done)

- [x] `scripts/sync-learning-sources.mjs` written — reads `sources.json`, clones/updates each `downloadable: true` entry into `third_party/learning-sources/<id>/`, copies its LICENSE into `third_party/learning-sources/LICENSES/<id>.LICENSE`
- [x] Script syntax-checked (`node --check`) and dry-run verified (`--dry-run`) — confirmed it targets exactly the 9 approved MIT/Apache-2.0 sources and skips the 4 link-only ones, with zero network calls made
- [x] `.gitignore` updated: `third_party/learning-sources/*/` (actual cloned repos, incl. their nested `.git`) is ignored; `third_party/learning-sources/LICENSES/` stays tracked for compliance record-keeping. Verified with `git check-ignore`.
- [x] Script has been executed for real (2026-07-06) — all 9 sources cloned successfully
- [x] `third_party/learning-sources/<id>/` populated for each of the 9 downloadable sources (verified file counts: microsoft-generative-ai-for-beginners 12185, microsoft-ai-agents-for-beginners 9371, openai-cookbook 3119, dair-prompt-engineering-guide 1588, anthropic-claude-cookbooks 632, huggingface-agents-course 470, anthropic-claude-quickstarts 313, google-gemini-cookbook 236, mlabonne-llm-course 36)
- [x] `third_party/learning-sources/LICENSES/` populated — 9 LICENSE files copied, one per source

## Phase 4 — Course UI (done)

- [x] `src/lib/courseCurriculum.ts` — loader exposing the 10 modules + sequential unlock logic
- [x] `src/hooks/useCourseProgress.ts` — Firestore-backed hook tracking completed module ids (mirrors `useCompanyQuest`)
- [x] `src/pages/CoursePage.tsx` — chapter list (codedex-style) + progress sidebar, styled with `cv-design-*` to match Interview Studio
- [x] Route `/learning` registered in `App.tsx`
- [x] Nav entry ("Course", GraduationCap icon) added to `Sidebar.tsx` quickLinks
- [x] Module completion awards `lesson_completed` XP via existing `awardXp` service (idempotent, dedupeId `course_module_<id>`)
- [x] Verified in browser: expand/collapse, sequential lock→unlock, "Mark module complete" persists to Firestore, sidebar Level/Course Progress/Badges all update live, zero console errors

## Phase 5 — Interactive AI labs (done)

Codédex-style hands-on lessons adapted to CareerVivid's 10-step AI-agent curriculum. Code labs reuse the existing quest code runner (JS + Python via Pyodide), CodeMirror, react-markdown, and the course-progress/XP system. Drawing labs use Excalidraw whiteboards when the learner needs to design an architecture.

- [x] Runner **script mode** — `questCodeRunner.worker.ts` + `useQuestCodeRunner.ts` gained a `mode: 'script'` that runs top-level code and captures stdout/`console.log` (no function required). Backward-compatible; existing test-based coding challenges untouched.
- [x] `src/lib/interactiveCourses.ts` — typed course→chapter→exercise model with 10 AI-agent labs mapped to Foundations, LLM Basics, Prompt Engineering, RAG, Agent Architecture, Multi-Agent Systems, Evaluation & Observability, LLM Security, Deployment Controls, and Portfolio Projects.
- [x] Drawing support — the portfolio capstone exercise is a whiteboard exercise for drawing an OpenAI RAG app, Gemini multimodal app, or Claude agent workflow architecture.
- [x] `useCourseProgress` generalized to `(courseId, totalCount)` — per-course progress doc at `courseProgress/{courseId}`, so each course tracks its own completions + XP. AI-agent course now id `ai-agent-curriculum`.
- [x] `src/pages/InteractiveLessonPage.tsx` — full-screen split pane: markdown instructions left, CodeMirror + terminal for code labs or Excalidraw whiteboard for drawing labs, Run / Submit or Submit Drawing, XP badge, Back/Next, progress bar, hint reveal, per-exercise state persisted to localStorage.
- [x] `.cv-lesson-prose` markdown styles added to `index.css`.
- [x] Route `/learn/:courseId/:exerciseId` (+ bare `/learn/:courseId` → first exercise) in `App.tsx`; "Interactive AI labs" entry cards on `/learning`.
- [x] Verified in browser: `/learning` shows all 10 AI-agent labs; `/learn/portfolio-ai-projects` opens an Excalidraw whiteboard with drawing requirements instead of a code editor.

## License verification log (WebFetch against live GitHub pages, 2026-07-06)

| Source | License found | Commercial use | Action |
|---|---|---|---|
| microsoft/generative-ai-for-beginners | MIT | ✅ Yes | Download |
| microsoft/ai-agents-for-beginners | MIT | ✅ Yes | Download |
| openai/openai-cookbook | MIT | ✅ Yes | Download |
| google-gemini/cookbook | Apache-2.0 | ✅ Yes (attribution required) | Download |
| anthropics/claude-cookbooks | MIT | ✅ Yes | Download |
| anthropics/claude-quickstarts | MIT | ✅ Yes | Download |
| huggingface/agents-course | Apache-2.0 | ✅ Yes (attribution required) | Download |
| mlabonne/llm-course | Apache-2.0 | ✅ Yes (attribution required) | Download |
| dair-ai/Prompt-Engineering-Guide | MIT | ✅ Yes | Download |
| NirDiamant/RAG_Techniques | **Custom, non-commercial** — explicitly forbids commercial use/sublicensing without written permission from the author | ❌ No | **Link only, do not clone** |
| langchain-ai/rag-from-scratch | **No LICENSE file found** — defaults to all-rights-reserved under GitHub ToS | ❌ No (until confirmed otherwise) | **Link only, do not clone** |
| Claude Code Docs (docs.claude.com) | N/A — official product docs, not a course repo | N/A | Link only, rewrite as original tutorial content, do not scrape |
| YouTube / blogs / commercial course screenshots | Unknown / third-party copyright | ❌ No | Inspiration only, never copy content |

## Next action

The source inventory, downloads, 10-module curriculum data, course UI, and interactive AI labs are in place. Continue improving individual lesson depth and QA coverage before treating this as release-ready curriculum content.
