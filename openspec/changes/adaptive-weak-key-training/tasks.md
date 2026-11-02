# Tasks: V0.5.0 Adaptive Weak-Key Training

## Phase 1 — Weak-Key Priority Ranking Engine (ADP-001 to ADP-008)
- [x] 1.1 Create `tests/domain/adaptive-priority.test.ts` covering weak-key qualification, composite priority calculation, and tie-breaking.
- [x] 1.2 Implement `src/domain/learning/adaptive-priority.ts` implementing the composite priority formula:
  $$\text{Priority}(k) = 0.60 \times \text{ErrorRate}(k) + 0.20 \times \text{NormAttempts}(k) + 0.20 \times \text{RecencyBonus}(k)$$
- [x] 1.3 Verify filtering rules: threshold of min 10 attempts and min 20% error rate (ADP-001, ADP-002).
- [x] 1.4 Implement primary ranking by composite score descending (ADP-003).
- [x] 1.5 Implement explicit secondary tie-breaking logic with 6-decimal score quantization for transitive total ordering: error rate desc, total attempts desc, key string code point asc (ADP-004).
- [x] 1.6 Verify Daqian Zhuyin first-tone Space key (`' '`) eligibility in priority ranking (ADP-005).
- [x] 1.7 Verify pure function ranking on provided single-mode aggregated attempt dataset (ADP-006, ADP-007; full storage-level mode isolation and cross-difficulty loading to be verified in subsequent integration phases).
- [x] 1.8 Verify empty history handling returning empty candidate list gracefully (ADP-008).

## Phase 2 — Weighted Lesson Selection Engine (ADP-009 to ADP-017)
- [x] 2.1 Create `tests/domain/adaptive-selector.test.ts` covering lesson weighting, sampling without replacement, and boundary deduplication.
- [x] 2.2 Implement `src/domain/learning/adaptive-selector.ts` calculating lesson weights:
  $$\text{Weight}(L) = 1.0 + \sum_{k \in K(L) \cap T} \text{Priority}(k) \times \text{Frequency}(k, L)$$
- [x] 2.3 Implement seeded PRNG sampling without replacement for round generation (ADP-009, ADP-010).
- [x] 2.4 Implement multi-key coverage optimization ensuring balanced exposure across all targeted keys (ADP-011).
- [x] 2.5 Implement backfill fallback from active mode/difficulty catalog when matching lesson count is less than target round size (ADP-012).
- [x] 2.6 Verify boundary deduplication: $L_i \ne L_{i-1}$ across cycle boundaries (ADP-013).
- [x] 2.7 Verify mode and difficulty catalog boundary enforcement (ADP-014).
- [x] 2.8 Verify deterministic seeded reproducibility and divergence with distinct seeds (ADP-015, ADP-016).
- [x] 2.9 Verify safe single-lesson pool execution without infinite loops (ADP-017).

## Phase 3 — Zhuyin Space Key Integration & Rule Preservation (ADP-018 to ADP-023)
- [x] 3.1 Create `tests/domain/adaptive-zhuyin-space.test.ts` verifying first-tone Space key mechanics in adaptive practice.
- [x] 3.2 Ensure `DaqianKeyboard` displays active highlight (`#daqian-space-key.key-active`) when Space is expected (ADP-018).
- [x] 3.3 Ensure Space keystroke increments `totalKeys` and `correctKeys` when valid (ADP-019).
- [x] 3.4 Ensure typing cannot advance past a first-tone syllable without pressing Space (ADP-020).
- [x] 3.5 Ensure Space errors increment weak-key stats under key `' '` without corrupting alphabetical keys (ADP-021).
- [x] 3.6 Verify strict preservation of English typing rules (standard words & space separators; no artificial tone rules) (ADP-022).
- [x] 3.7 Verify strict preservation of Pinyin typing rules (standard V0.4.1 answers; no trailing space required for first tones) (ADP-023).

## Phase 4 — Adaptive Practice Lifecycle & Metrics Tracking (ADP-024 to ADP-031)
- [x] 4.1 Update `SessionType` in `src/domain/types.ts` to `'challenge' | 'review' | 'adaptive'`.
- [x] 4.2 Create `tests/domain/adaptive-progress.test.ts` covering baseline snapshots, in-practice tracking, and delta calculation.
- [x] 4.3 Implement `src/domain/learning/adaptive-progress.ts` for baseline snapshot capture directly from `tritype.weakkeys.v1.${mode}` upon session start (ADP-024).
- [x] 4.4 Implement real-time keystroke outcome accumulation for target keys in `practiceStats` via active session `keyAttempts` (ADP-025).
- [x] 4.5 Implement percentage point improvement delta calculation: $\text{Baseline} - \text{Practice}$ (ADP-026).
- [x] 4.6 Enforce minimum 5 attempts threshold for conclusive improvement metrics; classify `< 5` attempts as `INSUFFICIENT_DATA` (ADP-027).
- [x] 4.7 Enforce non-causal observational wording across all user-facing UI copy (ADP-028).
- [x] 4.8 Connect lifecycle transitions (IDLE -> READY -> RUNNING -> PAUSED -> COMPLETED / ABANDONED) in `useTypingSession.ts` (ADP-029).
- [x] 4.9 Verify Challenge Best Score isolation: prevent `tritype.best.v2` modification during adaptive practice (ADP-030).
- [x] 4.10 Ensure abandoned sessions are never marked as completed (ADP-031).

## Phase 5 — Persistent Storage & Compatibility (ADP-032 to ADP-036)
- [x] 5.1 Create `tests/domain/adaptive-storage.test.ts` testing `tritype.adaptive.v1` storage operations.
- [x] 5.2 Implement `src/domain/learning/adaptive-storage.ts` with schema validation (`schemaVersion: 1`) (ADP-032).
- [x] 5.3 Enforce single-write idempotency on session completion (ADP-033).
- [x] 5.4 Enforce 50-record FIFO pruning on storage overflow (ADP-034).
- [x] 5.5 Implement corrupted JSON fallback and `QuotaExceededError` graceful degradation (ADP-035).
- [x] 5.6 Integrate `tritype.adaptive.v1` into global data reset / clear history workflows (ADP-036).
- [x] 5.7 Verify complete coexistence with `tritype.learning.v1`, `tritype.weakkeys.v1.*`, and `tritype.best.v2` without schema alteration.

## Phase 6 — UI Integration & End-to-End Verification (ADP-037 to ADP-038)
- [ ] 6.1 Implement `AdaptivePracticeModal.tsx` in `src/features/learning/` for selecting target keys.
- [ ] 6.2 Implement `AdaptiveProgressView.tsx` in `src/features/learning/` displaying post-session improvement in percentage points.
- [ ] 6.3 Add "Adaptive Practice" launcher button in `LearningDashboard.tsx`.
- [ ] 6.4 Add i18n translation keys across `en`, `zh-TW`, and `zh-CN` in `src/i18n/core.ts`.
- [ ] 6.5 Write Playwright E2E test `tests/e2e/adaptive-training.spec.ts` testing full flow in Chromium and WebKit (ADP-037, ADP-038).
- [ ] 6.6 Verify typecheck (`tsc --noEmit`), lint (`eslint src`), unit tests (`vitest run`), and production build (`vite build`).
