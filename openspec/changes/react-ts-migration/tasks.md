# Tasks — React + TypeScript Migration

## Phase 1: Domain Core & RED Test Suite
- [x] Phase 0 Repository audit & baseline validation
- [x] OpenSpec gap analysis
- [ ] Implement Phase 1 RED test suite (`tests/domain.test.mjs`, `tests/session-machine.test.mjs`, `tests/prng.test.mjs`)
- [ ] Implement Mulberry32 seedable PRNG & shuffle algorithm
- [ ] Implement Injected Clock provider interface & mock clock
- [ ] Implement GameSession FSM with pause/resume and typing actions
- [ ] Implement anti-paste check and WPM dampener
- [ ] Implement typo recorder data structure
- [ ] Run domain tests until GREEN

## Phase 2: React Component Assembly & Features
- [ ] Setup React + Vite + TypeScript strict project configuration
- [ ] Implement `src/domain/` TypeScript definitions and modules
- [ ] Implement `useTypingSession` React hook
- [ ] Build UI components:
  - Header & Brand bar
  - Mode & Duration configuration
  - Typing Arena with live caret, letter highlights, and error indicator
  - Daqian keyboard visual guide with live active key highlighting
  - Live stats panel (WPM, Accuracy, Streak, Time remaining)
  - Result & Typo Review Modal (Mistake review, final score)
  - Pause/Resume controls & keyboard accessibility (Esc, Enter)
- [ ] Add CSS design system adhering to awesome-design-md standards

## Phase 3: Verification & Acceptance
- [ ] Vitest / RTL unit & component test coverage
- [ ] Playwright E2E test suite
- [ ] Typecheck & ESLint clean
- [ ] Production build verification
