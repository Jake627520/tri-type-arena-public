# V0.4.0 Proposal — Typing Learning System

## Summary
TriType Arena currently provides an arcade-style typing practice experience with 16 fixed lessons per mode. While effective for basic dexterity and input verification, long-term skill acquisition requires structured pedagogical progression, vocabulary breadth, adaptive difficulty, practice history, weak-key diagnosis, and targeted reinforcement.

V0.4.0 upgrades TriType Arena from a pure speed arena into an offline-first **Typing Learning System** across English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin (Daqian layout).

## Problem Statement
1. **Vocabulary Ceiling**: With only 16 words per mode (48 total), users quickly memorize sequences rather than building genuine muscle memory.
2. **Fixed Sequential Cycling**: Lessons always start at index 0 and cycle predictably without variety.
3. **Absence of Difficulty Tiers**: Beginners face complex words immediately, while advanced typists lack challenging vocabulary.
4. **No Session Retention or Progress Tracking**: Players cannot review past performance trends (WPM, accuracy, errors over time).
5. **No Error Analytics**: Typists cannot identify which physical keys or phonetic symbols consistently cause errors.
6. **No Targeted Practice**: Mistakes cannot be converted into focused drill sessions.

> **Historical correction (2026-11-02):** References below to licensed vocabulary describe the original intent, not evidence that the initial vocabulary was licensed. Its source is unknown; the replacement candidates remain blocked pending review. See [current provenance](../../../docs/vocabulary/PROVENANCE.md).

## Goals
1. **Vocabulary Expansion (FR-001)**: Expand curated, licensed vocabulary to at least 1,100 total entries (500 English, 300 Pinyin, 300 Zhuyin), stratified across Beginner, Intermediate, and Advanced tiers.
2. **Randomized Lesson Selection (FR-002)**: Implement a seeded Shuffle Bag algorithm ensuring uniform coverage, zero in-cycle repetition, and boundary deduplication, with full deterministic test support.
3. **Difficulty-Based Learning (FR-003)**: Provide Beginner, Intermediate, and Advanced tiers selectable independently of mode and UI locale, persisted locally.
4. **Learning History Storage (FR-004)**: Store up to 200 completed session records under versioned `tritype.learning.v1`, with resilient schema validation, corruption recovery, and clear-history controls.
5. **Weak-Key Analysis (FR-005)**: Compute per-mode error rates and practice frequencies on physical keys and phonetic symbols with configurable eligibility thresholds (min 10 attempts, >=20% error rate).
6. **Personalized Review Practice (FR-006)**: Dynamically generate focused drill lessons containing user-specific weak keys without corrupting standard challenge leaderboards.
7. **Learning Progress Dashboard (FR-007)**: Deliver an accessible, localized dashboard displaying practice statistics, performance trends, and review entry points using vanilla React/SVG without external charting dependencies.

## Non-Goals & Scope Boundaries
- **No User Accounts or Authentication**: Maintain 100% guest, offline-first operation.
- **No Remote Servers or Databases**: All metrics and history remain strictly in browser `localStorage`.
- **No Proprietary or Unlicensed Data**: Only public domain, permissive, or community-licensed vocabulary with documented provenance.
- **No Complex Spaced Repetition (SRS) Cloud Sync**: Learning history is managed via local FIFO retention (200 records).
- **No Paid APIs or AI Services**: Offline deterministic algorithms only.

## Privacy & Data Sovereignty
All learning metrics, session history, and weak-key aggregates are stored exclusively on the user's local device under `localStorage`. No telemetry, analytics, or fingerprinting is collected or transmitted.
