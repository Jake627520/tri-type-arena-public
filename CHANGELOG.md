# Changelog

All notable changes to TriType Arena will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-26

### Added
- **FR-001 Vocabulary Expansion**: 1,100 high-quality, verified entries (500 English, 300 Pinyin, 300 Zhuyin) across Beginner, Intermediate, and Advanced tiers, documented in `docs/VOCABULARY_PROVENANCE.md`.
- **FR-002 Seeded Shuffle Bag Selection**: Seeded Shuffle Bag algorithm with cycle exhaustion and boundary deduplication, supporting deterministic testing and randomized gameplay.
- **FR-003 Difficulty-Based Learning**: Beginner, Intermediate, and Advanced difficulty options per mode, persisted locally in `tritype.difficulty.v1`.
- **FR-004 Learning History**: Local-first session history stored in `tritype.learning.v1` with 200-session FIFO retention limit, duplicate render prevention, and history clearing.
- **FR-005 Weak-Key Analysis**: Per-mode key statistics tracking attempts, errors, and error rates with >= 20% review threshold (minimum 10 attempts) and Daqian physical key mapping.
- **FR-006 Personalized Review Mode**: Dynamic review lesson generator targeting identified weak keys without altering general leaderboard records.
- **FR-007 Learning Dashboard**: Localized modal dialog featuring summary statistics, accessible pure SVG trend charts (WPM and accuracy), weak-key table, and review practice entry point.
- **Verification Suite Expansion**: 126 Vitest unit/component tests, 60 Node runner tests, 18 Playwright Chromium/WebKit E2E tests, zero secret or license audit findings.

## [0.3.0] - 2026-10-26

### Added
- **Complete Tri-Language UI Support**: Formal `zh-TW` (繁體中文), `zh-CN` (简体中文), and `en` (English) dictionary in `src/i18n/core.ts`.
- **Zero Hardcoded Strings**: All components (`App`, `ModeDurationConfig`, `TypingArena`, `LiveStats`, `ResultModal`, `DaqianKeyboard`, `Onboarding`) fully localized with type-safe `t()` bindings.
- **Localized Hero Title**: Structured `introTitlePrefix` and `introTitleAccent` for robust gradient rendering across all languages without relying on punctuation splits.
- **Accessible First-Run Onboarding Guide**:
  - 3-step keyboard navigation guide with focus trap, backdrop interception of background keys, and Escape dismissal.
  - Focus restoration to opener button upon dismissal.
  - Safe, graceful handling when `localStorage` is disabled or throws SecurityErrors.
  - Replay button for subsequent access.
- **Comprehensive Verification**:
  - Vitest + Testing Library RTL component integration suite (49 tests).
  - Playwright bilingual and locale switching E2E test suite (11 tests).

## [0.2.0] - 2026-10-26

### Added
- **React + Vite + TypeScript Strict Architecture**: Complete frontend migration with feature-based directory structure (`src/features/`, `src/domain/`, `src/shared/`, `src/app/`).
- **Domain State Machine (`GameSession`)**: Formal algebraic finite state machine managing `idle`, `running`, `paused`, `finished` states.
- **Injected Monotonic Clock (`IClock`, `MockClock`)**: Deterministic time travel and frozen-clock testing capability.
- **Mulberry32 PRNG & Seedable Prompt Shuffling**: Reproducible word sequencing with deterministic seeds to eliminate player memorization bias.
- **Typo Tracking & Review (`TypoRecord`)**: Detailed recording of exact mistyped characters (`expected` vs `typed`) with post-game weak key review modal.
- **Anti-Cheat (Paste Rejection)**: Clipboard paste events in the arena input are rejected to maintain keystroke integrity and prevent artificial WPM spikes.
- **Initial WPM Dampener**: Smooth ramp-up protection for sessions under 2.0 seconds to prevent division-by-zero or transient 600+ WPM spikes.
- **Taiwan Standard Daqian Visual Keyboard**: Realtime key highlighting matching the next expected Zhuyin character.
- **Open Source & Copyright Compliance Suite**:
  - `LICENSE` (MIT)
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `THIRD_PARTY_NOTICES.md`
  - `docs/LICENSE_AUDIT.md`
  - `docs/ASSET_PROVENANCE.md`
  - Automated license and secret audit tests (`tests/license-audit.test.mjs`)
  - GitHub Actions CI workflow (`.github/workflows/license-check.yml`)
- **Comprehensive `.gitignore`**: Secret scanning and build artifact exclusion configured for public repository readiness.

### Changed
- Migrated test suite to native TDD baseline with RED -> GREEN verification cycle.
- Updated `index.html` to load React application mount point.

## [0.1.0] - 2026-10-26

### Added
- Offline-first vanilla ECMAScript MVP.
- 3 typing modes: English, Simplified Chinese Pinyin, Traditional Chinese Zhuyin (Daqian key mapping).
- 30s / 60s / 120s timer countdown.
- Live WPM, accuracy, combo, and local best score tracking via `localStorage`.
