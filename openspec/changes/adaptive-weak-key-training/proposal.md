# Change: Adaptive Weak-Key Training (V0.5.0)

> **Historical context (2026-11-02):** The vocabulary reuse statement below describes the original scope of this change. The initial vocabulary had unknown sources and has since been replaced with candidates; their rights remain under review. See [current provenance](../../../docs/vocabulary/PROVENANCE.md).

## Why

TriType Arena V0.4.1 introduced per-key error analytics and an initial weak-key review mode, but the current review generator relies on simple unweighted random sampling, does not track pre/post practice improvement, and lacks structured session lifecycle tracking. Typists need a deterministic, pedagogical training system that prioritizes their most critical error keys, samples lessons proportional to weakness coverage, measures exact performance changes in percentage points against a historical baseline, and persists adaptive records locally without cloud dependencies or complex machine learning models.

## What Changes

- **Adaptive Weak-Key Selection**: Compute a deterministic priority score for confirmed weak keys (meeting the 10-attempt, >=20% error rate threshold) and select up to five top target keys with stable tie-breaking.
- **Weighted Lesson Selection**: Dynamically select 10 practice lessons using weighted sampling without replacement that prioritizes high-priority weak keys, rewards multi-key coverage, penalizes immediate repetition, and strictly enforces mode/difficulty constraints with reproducible PRNG seeding.
- **Adaptive Practice Lifecycle & Session Type**: Introduce `sessionType: 'adaptive'` into the `GameSession` lifecycle (`IDLE → READY → RUNNING → PAUSED → COMPLETED` / `ABANDONED`), preserving strict isolation from Challenge Best Scores and preventing duplicate storage commits.
- **Zhuyin First-Tone Space Continuity**: Guarantee full runtime answer derivation and Daqian layout compatibility where first-tone Space keys are eligible weak keys, scored accurately, and displayed with visual open box `␣` (U+2423) glyphs without modifying raw vocabulary.
- **Measurement Integrity & Outcome Comparison**: Capture an immutable historical baseline snapshot before practice starts, observe current practice keystroke outcomes on target keys, compute observed improvement in percentage points (`baseline - current`), and flag insufficient sample sizes as `INSUFFICIENT_DATA`.
- **Versioned Local Persistence (`tritype.adaptive.v1`)**: Store detailed adaptive training session records with schema validation, idempotent single-write guarantees, and quota-exceeded fallback without altering existing `tritype.learning.v1` or `tritype.weakkeys.v1` stores.
- **Learning Dashboard Integration**: Expand the Learning Dashboard with an adaptive training launch card, target weak-key previews, progress comparisons, and localized messaging across Traditional Chinese, Simplified Chinese, and English.

## Capabilities

### New Capabilities
- `adaptive-weak-key-selection`: Rules-based identification of confirmed weak keys, deterministic priority ranking, and weighted lesson sampling without replacement.
- `adaptive-practice`: Adaptive training session lifecycle, `GameSession` integration with `sessionType: 'adaptive'`, Challenge Best Score isolation, and Zhuyin first-tone Space key handling.
- `adaptive-progress`: Pre-session historical baseline snapshotting, post-session target key measurement, percentage point improvement calculation, and sample sufficiency classification.
- `adaptive-storage`: Versioned persistence of adaptive sessions under `tritype.adaptive.v1`, schema validation, single-commit safety, and backward compatibility.

### Modified Capabilities
<!-- No existing capabilities under openspec/specs/ are modified; existing specs game-session, typing-engine, license-compliance remain intact -->

## Impact

- **Domain Models**: New pure functional modules `src/domain/learning/adaptive-priority.ts`, `src/domain/learning/adaptive-selector.ts`, `src/domain/learning/adaptive-progress.ts`.
- **Types**: Extension of `SessionType` in `src/domain/types.ts` from `'challenge' | 'review'` to `'challenge' | 'review' | 'adaptive'`.
- **Storage**: Addition of `src/shared/adaptive-storage.ts` managing `tritype.adaptive.v1` in `localStorage`.
- **UI Components**: Enhancements to `src/features/learning/LearningDashboard.tsx` and `src/app/App.tsx` for adaptive drill entry and comparison reporting.
- **Dependencies & Performance**: Zero external dependencies, zero LLMs/APIs, offline-first deterministic operation, <10ms selection time across 300-word pools.
- **Vocabulary & Copyright**: 100% reuse of the existing 1,100 vocabulary entries with zero modifications to raw data files or provenance registers.
