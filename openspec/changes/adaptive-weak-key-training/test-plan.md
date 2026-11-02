# Test Plan: V0.5.0 Adaptive Weak-Key Training

## 1. Scope & Verification Strategy
Comprehensive verification across domain logic, mathematical correctness, IME/keyboard compatibility, data persistence, and UI integration:
1. **Weak-Key Priority Ranking Engine**: Threshold enforcement, composite ranking formula as primary sort key, explicit secondary tie-breaking rules, recency decay.
2. **Adaptive Lesson Selection Engine**: Lesson weighting, sampling without replacement, deterministic PRNG reproducibility, multi-key coverage, boundary deduplication, backfill fallback.
3. **Zhuyin Space Mechanics & Rule Compatibility Regression**: Taiwan Daqian first-tone space requirement, virtual keyboard `#daqian-space-key` highlighting, accurate key tracking under `' '`, complete preservation of English and Pinyin typing rules.
4. **Practice Lifecycle & Progress Metrics**: State transitions, Best Score isolation, baseline snapshot accuracy from `tritype.weakkeys.v1.${mode}`, percentage point delta measurement, data sufficiency thresholding (< 5 attempts), non-causal copy verification.
5. **Storage & Data Integrity**: `tritype.adaptive.v1` schema compliance, single-write idempotency, corrupted JSON recovery, 50-record FIFO capping, coexistence with legacy `tritype.learning.v1`, `tritype.weakkeys.v1.*`, and `tritype.best.v2`.
6. **E2E Browser Testing**: Cross-browser automated verification in Chromium and WebKit.

---

## 2. Test Execution Matrix (ADP-001 to ADP-038)

| Test ID | Test Suite / Command | Target Condition | Verification & Expected Output |
|---|---|---|---|
| `ADP-001` | `tests/domain/adaptive-priority.test.ts` | Min attempts threshold | Keys with `< 10` attempts are excluded from weak keys |
| `ADP-002` | `tests/domain/adaptive-priority.test.ts` | Min error rate threshold | Keys with `< 20%` error rate are excluded from weak keys |
| `ADP-003` | `tests/domain/adaptive-priority.test.ts` | Primary composite score ranking | Keys sorted primarily by composite score ($0.6 \times \text{Error} + 0.2 \times \text{NormAttempts} + 0.2 \times \text{Recency}$) descending |
| `ADP-004` | `tests/domain/adaptive-priority.test.ts` | Explicit secondary tie-breaking | When composite scores tie ($\Delta < 10^{-6}$), break by error rate desc, then total attempts desc, then key asc |
| `ADP-005` | `tests/domain/adaptive-priority.test.ts` | Zhuyin Space key eligibility | Space key `' '` qualifies when attempts $\ge 10$ and error rate $\ge 20\%$ |
| `ADP-006` | `tests/domain/adaptive-priority.test.ts` | Mode metric isolation | English typos do not contaminate Zhuyin or Pinyin weak-key calculations |
| `ADP-007` | `tests/domain/adaptive-priority.test.ts` | Mode-scoped weak-key aggregation | Weak keys stored per mode in `tritype.weakkeys.v1.${mode}` and shared across difficulty levels to preserve sample size |
| `ADP-008` | `tests/domain/adaptive-priority.test.ts` | Empty / zero history safety | Returns empty weak-key list when user has no keystroke history |
| `ADP-009` | `tests/domain/adaptive-selector.test.ts` | Lesson weight computation | Lesson weight equals $1.0 + \sum \text{Priority}(k) \times \text{Freq}(k, L)$ |
| `ADP-010` | `tests/domain/adaptive-selector.test.ts` | Sampling without replacement & deduplication | No duplicate lessons appear; candidate pool deduplicated by identity (FIX-01) |
| `ADP-011` | `tests/domain/adaptive-selector.test.ts` | Multi-key coverage balance | Selected lessons provide non-zero exposure across all targeted keys |
| `ADP-012` | `tests/domain/adaptive-selector.test.ts` | Backfill fallback | Backfills from mode/difficulty pool when matching candidate count $< 10$ |
| `ADP-013` | `tests/domain/adaptive-selector.test.ts` | Boundary deduplication | Last lesson of round $N \ne$ First lesson of round $N+1$; takes strict precedence over first-lesson weak-key targeting (FIX-02) |
| `ADP-014` | `tests/domain/adaptive-selector.test.ts` | Mode & difficulty boundary | Never selects lessons outside active catalog; rejects untagged entries unless explicit fallback supplied (FIX-03) |
| `ADP-015` | `tests/domain/adaptive-selector.test.ts` | Seeded PRNG determinism | Identical seed produces identical sequence of selected lessons |
| `ADP-016` | `tests/domain/adaptive-selector.test.ts` | Seeded PRNG divergence | Distinct seeds produce distinct lesson sequences |
| `ADP-017` | `tests/domain/adaptive-selector.test.ts` | Single matching lesson safety | Pool with only 1 matching lesson completes without infinite loop |
| `ADP-018` | `tests/domain/adaptive-zhuyin-space.test.ts` | Space key highlighting | `#daqian-space-key` has `.key-active` class when Space is expected |
| `ADP-019` | `tests/domain/adaptive-zhuyin-space.test.ts` | Space key metrics count | Valid Space keystroke increments `totalKeys` and `correctKeys` |
| `ADP-020` | `tests/domain/adaptive-zhuyin-space.test.ts` | First-tone block without Space | First-tone word cannot complete until physical Space is pressed |
| `ADP-021` | `tests/domain/adaptive-zhuyin-space.test.ts` | Space error recording | Pressing non-space on first tone records error under `' '` |
| `ADP-022` | `tests/domain/adaptive-zhuyin-space.test.ts` | English mode rule preservation | Space in English mode behaves strictly as word separator; no artificial tone rules |
| `ADP-023` | `tests/domain/adaptive-zhuyin-space.test.ts` | Pinyin mode rule preservation | Pinyin mode requires no trailing Space on first-tone syllables; preserves V0.4.1 answers |
| `ADP-024` | `tests/domain/adaptive-progress.test.ts` | Baseline snapshot capture | Freezes baseline error rate and attempts from `tritype.weakkeys.v1.${mode}` at session start |
| `ADP-025` | `tests/domain/adaptive-progress.test.ts` | In-practice keystroke tracking | Keystrokes for target keys are accumulated in `practiceStats` from session `keyAttempts` |
| `ADP-026` | `tests/domain/adaptive-progress.test.ts` | Percentage point delta | Improvement calculated as $\text{BaselineErrorRate} - \text{PracticeErrorRate}$ |
| `ADP-027` | `tests/domain/adaptive-progress.test.ts` | Insufficient data threshold | Target key with $< 5$ practice attempts marked `INSUFFICIENT_DATA` |
| `ADP-028` | `tests/domain/adaptive-progress.test.ts` | Non-causal claim verification | UI and logs label metric as "Observed Session Change" |
| `ADP-029` | `tests/domain/adaptive-progress.test.ts` | Lifecycle state transitions | Traverses IDLE -> READY -> RUNNING -> PAUSED -> COMPLETED |
| `ADP-030` | `tests/domain/adaptive-progress.test.ts` | Challenge Best Score isolation | High score in adaptive practice does NOT overwrite `tritype.best.v2` |
| `ADP-031` | `tests/domain/adaptive-progress.test.ts` | Abandoned session exclusion | Abandoned sessions are not stored in completed history |
| `ADP-032` | `tests/domain/adaptive-storage.test.ts` | Schema compliance | Saved record contains valid fields, null error rates when unpracticed, and `schemaVersion: 1` |
| `ADP-033` | `tests/domain/adaptive-storage.test.ts` | Single-write idempotency & Retry | Re-render / double-dispatch writes exactly once; persistence failure supports explicit retry without duplicating weak keys |
| `ADP-034` | `tests/domain/adaptive-storage.test.ts` | 50-record FIFO retention | Maximum 50 records stored; oldest existing records evicted on overflow while guaranteeing new record is preserved |
| `ADP-035` | `tests/domain/adaptive-storage.test.ts` | Corruption & Quota fallback | Fails closed against destructive overwrite on read failure; gracefully prunes 10 oldest existing records on `QuotaExceededError` |
| `ADP-036` | `tests/domain/adaptive-storage.test.ts` | Clear history integration | Clearing all history deletes `tritype.adaptive.v1` alongside other keys |
| `ADP-037` | `tests/e2e/adaptive-training.spec.ts` | Full adaptive flow (Chromium) | E2E run: weak key selection, practice, first-tone Space, progress UI |
| `ADP-038` | `tests/e2e/adaptive-training.spec.ts` | Full adaptive flow (WebKit) | E2E cross-browser compatibility verification in WebKit |
