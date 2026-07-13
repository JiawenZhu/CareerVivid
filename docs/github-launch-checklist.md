# GitHub Launch & Discoverability Checklist

Everything below is applied on github.com/JiawenZhu/CareerVivid (Settings / About panel) — items marked ⚙️ can only be done in the GitHub UI.

## ⚙️ 1. About panel (top-right of repo page)

**Description (350 chars max, keyword-front-loaded):**

> Open-source AI career workspace: animated coding & system design interview courses, AI mock interviews for 300+ companies, verified live jobs from official ATS APIs, AI resume optimization, and auto-apply. Learn → Practice → Get hired. Live at careervivid.app

**Website:** `https://careervivid.app`

**Topics (GitHub allows 20 — these are searched heavily):**

```
job-search  interview-preparation  coding-interview  system-design-interview
ai  career-development  resume  leetcode  mock-interview  job-board
learning-platform  interview-questions  react  typescript  firebase
tailwindcss  framer-motion  auto-apply  tech-jobs  hacktoberfest
```

## ⚙️ 2. Social preview image (Settings → General → Social preview)

1280×640 PNG. Screenshot the Coding Interview Patterns animation or the /learning catalog with the tagline overlaid: "Learn → Practice → Get hired". This image is what shows on Twitter/X, LinkedIn, Slack, Discord — it's the single highest-leverage viral asset.

## 3. In-repo assets (done / to do)

- [x] README rewritten: keyword-rich hero, features, quick start, license notice, star CTA
- [x] LICENSE: source-available, personal use free, commercial use requires attribution link to careervivid.app
- [x] CONTRIBUTING.md with "add a course/animation/question in JSON" easy paths
- [ ] Add 3–5 GIFs/screenshots to README (`docs/media/`): an algorithm animation, the hash-ring animation, the case drill, the jobs feed — GIFs of animations are what people retweet
- [ ] Issue templates + 10–15 `good first issue` items (each new algorithm animation is a perfect one)
- [ ] Release v1.0.0 with release notes (GitHub surfaces releases in feeds)

## 4. Viral playbook (ordered by ROI)

1. **GIFs in the README** — the animations are the moat; show them moving within 2 seconds of page load.
2. **Show HN post** — "Show HN: I open-sourced an animated interview-prep workspace (coding patterns, system design, live jobs)". Post Tue–Thu ~8am PT. The animations demo well.
3. **Awesome-list PRs** — submit to: awesome-react, awesome-interview-questions, awesome-system-design, awesome-job-boards, awesome-firebase. Each merged PR is a permanent backlink.
4. **Reddit** — r/cscareerquestions, r/leetcode, r/ExperiencedDevs (as "I built a free animated system design course", not an ad), r/reactjs (technical writeup: "how I built 30 algorithm animations with one shared shell").
5. **Twitter/X + LinkedIn thread** — one animation GIF per tweet, 8-tweet thread ending at the repo. Tag #buildinpublic.
6. **Dev.to / Hashnode article** — "Every algorithm deserves its own animation: the architecture behind CareerVivid's course engine" with embedded GIFs → canonical backlinks.
7. **good first issues + hacktoberfest topic** — contributors star and share what they contribute to.
8. **README badges that update** — add a jobs-count badge ("160+ live company boards") once the public API exists; dynamic numbers invite re-visits.

## 5. Guardrails (already handled, keep them true)

- `third_party/learning-sources/*/` is gitignored — the cloned repos (especially the CC BY-NC-ND one) must never be pushed
- Secret scan clean; keep real keys only in `.env` (gitignored) and Firebase Secret Manager
- System-design content built on The System Design Primer is CC BY 4.0 and attributed in-app and in sources.json
