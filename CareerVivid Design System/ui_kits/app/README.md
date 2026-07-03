# UI Kit — CareerVivid app workspace

Interactive recreation of the product workspace (`#f8f8fb` shell): Dashboard, Career Pipeline (Kanban job tracker), and Interview Studio (company guides). Sources: `src/pages/Dashboard.tsx`, `src/pages/JobTrackerPage.tsx`, `src/components/JobTracker/KanbanBoard.tsx`, `src/pages/InterviewStudio.tsx`, `docs/design/careervivid-system-theme.json`.

Open `index.html` — sidebar switches between the three views. Self-contained (inline-styled JSX + copied Lucide data) so it renders without the compiled bundle; use `components/` primitives when building new screens.
