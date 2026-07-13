# Contributing to CareerVivid

Thanks for helping job seekers everywhere! Contributions of all sizes are welcome.

## Easy ways to contribute

- **Add a course lesson or quiz** — courses are JSON files in `data/courses/`. No framework code needed; copy an existing exercise shape and the dev-mode validator will flag mistakes.
- **Add an algorithm or system-design animation** — build a widget on `src/components/CourseWidgets/algoViz/StepPlayerShell.tsx` (step data + visual only), register it in `src/components/CourseWidgets/index.ts`, reference it from a course JSON.
- **Add interview questions** — extend the banks in `src/lib/systemDesignQuestionBank.ts` (case drills, flaw scenes, ordering sets, flashcards). Please only contribute content you authored or that carries a commercial-friendly license (CC BY / MIT / Apache) with attribution noted in `data/learning/sources.json`.
- **Add a company interview guide** — JSON files in `data/interview-guides/`.
- **Fix bugs / improve docs** — issues labeled `good first issue` are curated for newcomers.

## Development

```bash
npm install
npm run dev        # Vite dev server
npx vitest run     # tests
npx tsc --noEmit   # typecheck
```

Please keep PRs focused, include tests for logic changes, and run typecheck + tests before submitting.

## Content licensing rules

- Never copy content from NonCommercial or NoDerivatives sources (e.g. CC BY-NC-ND repos) — link to them instead.
- CC BY sources are fine **with attribution**: add the source to `data/learning/sources.json` and an `attribution` field on the lesson.

## License of contributions

By submitting a contribution you agree it is licensed under the repository's [LICENSE](LICENSE), including use in the hosted service at [careervivid.app](https://careervivid.app).
