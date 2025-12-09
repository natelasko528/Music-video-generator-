---
name: codebase-hardening
overview: Raise overall health of the music video generator with structure, safety, and tests across frontend, API use, and tooling.
todos:
  - id: refactor-frontend
    content: Modularize frontend logic/state into src components
    status: completed
  - id: secure-api
    content: Add safe API layer and env handling
    status: completed
  - id: ux-resilience
    content: Improve error handling and playback/timeline UX states
    status: completed
  - id: tests
    content: Fix fixtures and add mocks/unit tests
    status: completed
  - id: tooling
    content: Add lint/format and tighten tsconfig
    status: completed
  - id: docs
    content: Update docs for setup/testing and keys
    status: completed
---

# Codebase Hardening Plan

- **Frontend structure & state**: Break the monolithic `index.tsx` into focused modules (state management, UI bindings, playback engine, logging) under `src/` and keep `index.html` minimal. Preserve current UX while improving readability and testability.
- **API/key handling**: Move Gemini/Veo calls behind a client-safe boundary (e.g., a lightweight serverless/proxy handler) so the API key is not bundled. Centralize env loading in `vite.config.ts` and document `.env.local` expectations.
- **Resilience & UX**: Add defensive checks (audio load failures, fetch errors, retry backoff), clean up intervals, and surface user-friendly status messages. Ensure timeline/tab navigation stays consistent on errors.
- **Testing**: Fix Playwright fixtures (`tests/fixtures/sample-audio.mp3`), mock AI calls, and add targeted unit tests for planner and safety logic. Keep existing E2E flows passing (`tests/storyboard-generation.spec.ts`).
- **Tooling & CI**: Introduce lint/format (ESLint + Prettier) and tighten TypeScript config for safer builds; add npm scripts and CI hooks to enforce.
- **Documentation**: Expand `README.md`/`TESTING.md` with setup, env/key guidance, and testing instructions.