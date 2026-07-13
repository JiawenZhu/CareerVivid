# Learning Resource Inventory

Source of truth for every external resource considered for CareerVivid's AI-agent curriculum: what it is, its actual license (verified against the live repo, not assumed), whether it may be redistributed commercially, where it lands on disk, and which curriculum module(s) it feeds.

The approved MIT / Apache-2.0 repositories have been downloaded into `third_party/learning-sources/` — see [TRACKING.md](TRACKING.md) for the current verification status. Raw third-party material never ships in `src/` or the frontend bundle; it lives in `third_party/learning-sources/` and CareerVivid's own rewritten course content lives in `docs/learning/` + `data/learning/`.

## Downloadable sources (MIT / Apache-2.0 — safe to clone and adapt)

| # | Repo | License | Local path | Feeds modules |
|---|---|---|---|---|
| 1 | [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) | MIT | `third_party/learning-sources/microsoft-generative-ai-for-beginners/` | 01, 02, 03, 04, 05 |
| 2 | [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) | MIT | `third_party/learning-sources/microsoft-ai-agents-for-beginners/` | 05, 06, 08 |
| 3 | [openai/openai-cookbook](https://github.com/openai/openai-cookbook) | MIT | `third_party/learning-sources/openai-cookbook/` | 03, 04, 07, 10 |
| 4 | [google-gemini/cookbook](https://github.com/google-gemini/cookbook) | Apache-2.0 | `third_party/learning-sources/google-gemini-cookbook/` | 04, 09, 10 |
| 5 | [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | MIT | `third_party/learning-sources/anthropic-claude-cookbooks/` | 03, 04, 05, 07 |
| 6 | [anthropics/claude-quickstarts](https://github.com/anthropics/claude-quickstarts) | MIT | `third_party/learning-sources/anthropic-claude-quickstarts/` | 09, 10 |
| 7 | [huggingface/agents-course](https://github.com/huggingface/agents-course) | Apache-2.0 | `third_party/learning-sources/huggingface-agents-course/` | 05, 06, 07 |
| 8 | [mlabonne/llm-course](https://github.com/mlabonne/llm-course) | Apache-2.0 | `third_party/learning-sources/mlabonne-llm-course/` | 02, 09 |
| 9 | [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) | MIT | `third_party/learning-sources/dair-prompt-engineering-guide/` | 03, 04 |

Apache-2.0 entries (4, 7, 8) require carrying forward attribution/NOTICE — the sync script copies each repo's LICENSE/NOTICE into `third_party/learning-sources/LICENSES/<id>.LICENSE` for exactly this reason.

## Do-not-download (link out only, never clone or copy content)

| Resource | Why | Handling |
|---|---|---|
| [NirDiamant/RAG_Techniques](https://github.com/NirDiamant/RAG_Techniques) | **Verified custom license** — explicitly prohibits commercial use, commercial distribution, and sublicensing without the author's written permission (contact: nirdiamant21@gmail.com) | External link in curriculum docs only. If we ever want to use it, get written permission first — do not clone in the meantime. |
| [langchain-ai/rag-from-scratch](https://github.com/langchain-ai/rag-from-scratch) | **Verified: no LICENSE file present.** Under GitHub's Terms of Service, a public repo with no license is "all rights reserved" by default — viewing the code is fine, reusing or redistributing it is not, without asking the maintainers. | External link only. Treat as more restrictive than "license unclear." |
| Claude Code Docs (docs.claude.com) | Official Anthropic product documentation, not an open-source course repository — nothing to "clone," and scraping product docs into a competing course isn't the intent | External link for reference; module 06/08 content referencing Claude Code is written original by CareerVivid, not copied |
| YouTube videos / blog posts / commercial course screenshots | Copyright status unclear or explicitly proprietary | Inspiration for structure/sequencing only — never copy transcripts, slides, or images |

## Directory layout

| Path | Contents | Downloaded from GitHub? |
|---|---|---|
| `docs/learning/resource-inventory.md` | This file — human-readable resource list, license, purpose | No |
| `docs/learning/ai-agent-curriculum.md` | 10-step curriculum outline, CareerVivid's own writing | No |
| `docs/learning/TRACKING.md` | Setup checklist for this whole initiative | No |
| `data/learning/sources.json` | Machine-readable mirror of this table, for the app to read | No |
| `data/learning/modules/*.json` | Per-module chapters, exercises, project, source references | No |
| `third_party/learning-sources/` | Actual cloned repos (only the 9 MIT/Apache-2.0 ones above) | **Yes**, once the sync script is run |
| `third_party/learning-sources/LICENSES/` | Copied LICENSE/NOTICE per cloned repo | **Yes**, alongside each clone |
| `scripts/sync-learning-sources.mjs` | Script that performs the actual `git clone`/`git pull` | No (it's the tool, not a downloaded artifact) |
