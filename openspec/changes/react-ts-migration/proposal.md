# Proposal — React + TypeScript Strict Migration

## Problem
The V0.1.0 MVP runs on direct DOM manipulation in `src/app.mjs`. While functional and zero-dependency, it has several architectural limitations:
- Ad-hoc state management without formal state machine guarantees (e.g. race conditions during rapid restart or mode switching).
- Tightly coupled wall-clock timing (`Date.now()` and `setInterval`), preventing deterministic time-travel testing.
- Static prompt order (12 words looping sequentially) leading to memorization bias.
- Susceptible to paste cheats (large chunks entered at once inflate WPM).
- Unrealistic initial WPM spikes in early seconds.
- Lack of detailed mistake tracking (cannot review which characters were mistyped).
- Inability to pause/resume sessions.

## Goal
Migrate TriType Arena to React + Vite with TypeScript strict mode while:
1. Preserving and strengthening pure domain engine isolation.
2. Implementing an explicit finite state machine (`GameSession`).
3. Injecting a monotonic testable clock.
4. Introducing seedable PRNG for reproducible randomized prompt generation.
5. Implementing paste rejection, initial WPM spike dampening, and detailed typo recording.
6. Differentiating keyboard practice from native IME candidate composition.

## Scope
- Domain engine refactored into TypeScript (`src/domain/`) with full unit test coverage.
- React feature architecture (`src/features/` & `src/shared/`).
- Responsive, accessible UI supporting WCAG AA contrast and keyboard shortcuts.
- TDD with RED -> GREEN -> REFACTOR discipline.
