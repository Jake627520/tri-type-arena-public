# Test Plan: V0.4.0 Typing Learning System

## Scope
Comprehensive verification of all learning system enhancements across:
1. **Vocabulary Integrity**: Exact count thresholds, schema compliance, unique IDs and content, pronunciation validation, tone checking.
2. **Randomized Lesson Engine**: ShuffleBag uniformity, cycle exhaustion, boundary non-repetition, deterministic seeded ordering.
3. **Difficulty System**: Beginner, Intermediate, and Advanced pool partitioning, UI switching, persistence, translations.
4. **Learning History**: Finished session recording, idempotent re-renders, schema validation, FIFO retention, quota safety.
5. **Weak-Key Engine**: 10-attempt threshold, >=20% error rate classification, sorting stability, Backspace consistency.
6. **Review Practice**: Weak-key targeting, empty-state fallback, isolated score metrics.
7. **Dashboard UI**: Progress metrics, pure SVG charts, keyboard accessibility, screen-reader text alternatives.
8. **Regression Safety**: Preservation of PR #3 keyboard and IME hardening, 0 vulnerabilities in dependencies, 0 copyleft licenses.

---

## Test Execution Matrix

| Test ID | Test File / Command | Target Condition | Expected Output |
|---|---|---|---|
| `VOCAB-001` | `tests/domain/vocabulary.test.ts` | English vocabulary count | `>= 500` entries |
| `VOCAB-002` | `tests/domain/vocabulary.test.ts` | Pinyin vocabulary count | `>= 300` entries |
| `VOCAB-003` | `tests/domain/vocabulary.test.ts` | Zhuyin vocabulary count | `>= 300` entries |
| `VOCAB-004` | `tests/domain/vocabulary.test.ts` | ID uniqueness check | Zero duplicate IDs |
| `VOCAB-005` | `tests/domain/vocabulary.test.ts` | Content uniqueness check | Zero duplicate `(display, answer)` per mode |
| `VOCAB-006` | `tests/domain/vocabulary.test.ts` | Answer normalization check | 100% answers normalized |
| `VOCAB-007` | `tests/domain/vocabulary.test.ts` | Category and difficulty validity | All entries have valid enum values |
| `VOCAB-008` | `tests/domain/vocabulary.test.ts` | Tier distribution compliance | EN (200/200/100), Pinyin (120/120/60), Zhuyin (120/120/60) |
| `VOCAB-009` | `tests/domain/vocabulary.test.ts` | Malformed entry rejection | Rejects invalid tones, symbols, or empty answers |
| `VOCAB-010` | `node scripts/license-audit.mjs` | Provenance & license compliance | Valid document and permissive sources |
| `SELECT-001` | `tests/domain/shuffle-bag.test.ts` | Shuffle at session start | Order differs from static sequential array |
| `SELECT-002` | `tests/domain/shuffle-bag.test.ts` | In-cycle uniqueness | All N pool items drawn before any repeat |
| `SELECT-003` | `tests/domain/shuffle-bag.test.ts` | Seeded determinism | Same seed produces identical sequence |
| `SELECT-004` | `tests/domain/shuffle-bag.test.ts` | Seed divergence | Distinct seeds produce different sequences |
| `SELECT-005` | `tests/domain/shuffle-bag.test.ts` | Cycle boundary deduplication | Last item of cycle != First item of next cycle (N > 1) |
| `SELECT-006` | `tests/domain/shuffle-bag.test.ts` | Single-item pool safety | Single item drawn continuously without infinite loop |
| `SELECT-007` | `tests/domain/shuffle-bag.test.ts` | Mode switch pool reset | Switching mode resets to target mode bag |
| `SELECT-008` | `tests/domain/shuffle-bag.test.ts` | Difficulty switch pool reset | Switching difficulty resets to target difficulty bag |
| `SELECT-009` | `tests/domain/shuffle-bag.test.ts` | Restart behavior | Resets bag according to documented policy |
| `SELECT-010` | `node --test tests/*.test.mjs` | Legacy session regression | Existing deterministic unit tests pass unchanged |
| `LEVEL-001` | `tests/components/difficulty.test.tsx` | 3 difficulty options present | Beginner, Intermediate, Advanced available |
| `LEVEL-002` | `tests/components/difficulty.test.tsx` | Pool selection by difficulty | Correct difficulty subset used by session |
| `LEVEL-003` | `tests/components/difficulty.test.tsx` | State preservation | Changing level between games does not break session |
| `LEVEL-004` | `tests/components/difficulty.test.tsx` | Locale independence | Changing UI language preserves active difficulty |
| `LEVEL-005` | `tests/components/difficulty.test.tsx` | Local persistence | Active difficulty restored from `localStorage` |
| `LEVEL-006` | `tests/components/difficulty.test.tsx` | Multilingual display | Rendered in zh-TW, zh-CN, and en |
| `HISTORY-001` | `tests/domain/history.test.ts` | Single write on completion | Exactly 1 record written when session finishes |
| `HISTORY-002` | `tests/domain/history.test.ts` | Idempotent finished render | Re-renders do not duplicate entries |
| `HISTORY-003` | `tests/domain/history.test.ts` | Restoration on reload | Stored records parsed and loaded cleanly |
| `HISTORY-004` | `tests/domain/history.test.ts` | Corruption resilience | Corrupted JSON falls back safely to empty array |
| `HISTORY-005` | `tests/domain/history.test.ts` | Legacy best score intact | `tritype.best.v2` untouched |
| `HISTORY-006` | `tests/domain/history.test.ts` | Quota exceeded resilience | Storage error handled gracefully without throwing |
| `HISTORY-007` | `tests/domain/history.test.ts` | 200-record FIFO retention | Maximum 200 records kept, oldest dropped |
| `HISTORY-008` | `tests/domain/history.test.ts` | Clear history function | Clears records while keeping UI preferences |
| `WEAK-001` | `tests/domain/weak-keys.test.ts` | Keystroke counting | Counts total and incorrect attempts accurately |
| `WEAK-002` | `tests/domain/weak-keys.test.ts` | Error rate calculation | Accurate percentage computation |
| `WEAK-003` | `tests/domain/weak-keys.test.ts` | Insufficient data threshold | Total < 10 displays insufficient data status |
| `WEAK-004` | `tests/domain/weak-keys.test.ts` | Zhuyin mapping accuracy | Bopomofo symbols mapped to physical keys |
| `WEAK-005` | `tests/domain/weak-keys.test.ts` | Mode metric isolation | English errors do not bleed into Zhuyin |
| `WEAK-006` | `tests/domain/weak-keys.test.ts` | Deterministic ranking | Sorted by error rate desc, then error count desc |
| `WEAK-007` | `tests/domain/weak-keys.test.ts` | Deduplication immunity | Duplicate events do not pollute metrics |
| `WEAK-008` | `tests/domain/weak-keys.test.ts` | Backspace error consistency | Backspace handling follows documented contract |
| `REVIEW-001` | `tests/domain/review.test.ts` | Targeted drill generation | Exercises contain identified weak keys |
| `REVIEW-002` | `tests/domain/review.test.ts` | Empty state handling | Zero weak keys triggers guidance message |
| `REVIEW-003` | `tests/domain/review.test.ts` | Valid exercise format | Generated lessons pass validation |
| `REVIEW-004` | `tests/domain/review.test.ts` | Score isolation | Review does not modify standard best scores |
| `REVIEW-005` | `tests/domain/review.test.ts` | Deterministic review seed | Identical seed generates identical drill |
| `REVIEW-006` | `tests/domain/review.test.ts` | Dynamic adaptation | New session data updates recommended drills |
| `DASH-001` | `tests/components/dashboard.test.tsx` | Dashboard render | Displays summary, trends, weak keys, review |
| `DASH-002` | `tests/components/dashboard.test.tsx` | Empty state | Clear instructions for new players |
| `DASH-003` | `tests/components/dashboard.test.tsx` | Accessibility | ARIA labels, semantic markup, keyboard focus |
| `DASH-004` | `tests/components/dashboard.test.tsx` | Responsive layout | Clean display on desktop and mobile |
| `DASH-005` | `tests/components/dashboard.test.tsx` | Multilingual UI | All dashboard labels translated |
| `DASH-006` | `tests/components/dashboard.test.tsx` | Zero chart dependencies | Pure SVG components, zero extra packages |
