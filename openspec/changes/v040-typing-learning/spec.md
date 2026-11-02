# Specification: V0.4.0 Typing Learning System

## 1. Functional Requirements

### FR-001: Vocabulary Expansion
1. The vocabulary catalog must contain at least:
   - **English**: 500 unique entries (200 Beginner, 200 Intermediate, 100 Advanced).
   - **Simplified Chinese Pinyin**: 300 unique entries (120 Beginner, 120 Intermediate, 60 Advanced).
   - **Traditional Chinese Zhuyin**: 300 unique entries (120 Beginner, 120 Intermediate, 60 Advanced).
   - **Total minimum**: 1,100 unique entries.
2. Every vocabulary item must satisfy the `VocabularyEntry` data contract.
3. Every entry within a mode must possess a unique, immutable `id`.
4. The combination of `(mode, display, answer)` must be unique across all entries.
5. All answers must pass mode-specific normalization:
   - English: strictly lowercase letters `[a-z]`.
   - Pinyin: lowercase ASCII syllables without tone marks or spaces.
   - Zhuyin: valid Bopomofo symbols (`ㄅ-ㄦ`), tone marks (`˙`, `ˊ`, `ˇ`, `ˋ`), and implicit first tone.
6. Polyphonic characters must have verified pronunciations matching common standard dictionaries (MOE standard for Traditional Chinese; Putonghua standard for Simplified Chinese).
7. Vocabulary provenance and license attributions must be documented in `docs/VOCABULARY_PROVENANCE.md`.

### FR-002: Randomized Lesson Selection (Shuffle Bag)
1. For any given `(mode, difficulty)` combination, lessons are loaded into an active shuffle bag.
2. The order of lessons within the bag is randomized at the beginning of a cycle.
3. Lessons are drawn without repetition until the bag is completely exhausted.
4. When exhausted, the pool is reshuffled for the next cycle.
5. In pools with size > 1, the first item of the new cycle must not match the last item of the preceding cycle.
6. The shuffle engine must accept an optional seed parameter (`string` or `number`).
7. When provided identical seed and pool, output sequence must be strictly identical across runs (deterministic reproducibility).
8. When no seed is provided, normal user sessions must use cryptographically unbiased pseudo-randomness.
9. Switching `mode` or `difficulty` resets the bag to the newly selected pool.
10. Existing test injections of custom `lessons: Lesson[]` and deterministic seeds must continue to function without breaking changes.

### FR-003: Difficulty-Based Learning
1. Three difficulty tiers must be provided:
   - **Beginner**: High-frequency everyday vocabulary, simple physical patterns, short words (<=5 chars in EN, 2 chars in ZH), explicit input hints.
   - **Intermediate**: Medium-frequency words, moderate keyboard travel, 6-9 chars in EN, 2-4 chars in ZH, standard hints.
   - **Advanced**: Longer or lower-frequency words, complex phonetic combinations, >=8 chars in EN, 3-6 chars in ZH, optional challenge hints.
2. Difficulty selection must be independent of typing mode and independent of UI display locale.
3. Selected difficulty must be persisted in `localStorage` under `tritype.difficulty.v1`.
4. Difficulty changes must not mutate in-progress session states, distorting WPM or accuracy formulas.
5. All difficulty labels, badges, and descriptions must be translated into `zh-TW`, `zh-CN`, and `en`.

### FR-004: Learning History Storage
1. Completed learning sessions must be persisted to `localStorage` under `tritype.learning.v1`.
2. Storage records must conform to `LearningSessionRecord`.
3. Storage retention must enforce a FIFO limit of 200 records to prevent quota exhaustion.
4. Existing legacy records (`tritype.best.v2`) must be preserved and remain intact during migration.
5. Sessions aborted or in progress must not be saved to completed history.
6. Repeated renders of the finished state (e.g. state re-evaluation) must write to storage exactly once.
7. Corrupted JSON or unexpected storage errors (e.g. `QuotaExceededError`) must fail closed safely without crashing the UI.
8. Users must have a dedicated action in the UI to clear learning history without erasing UI language or sound preferences.

### FR-005: Weak-Key Analysis
1. Key performance must be tracked on a per-mode basis (`en`, `pinyin`, `zhuyin`).
2. Statistics must record:
   - Target key/symbol (`key`).
   - Total attempts (`totalAttempts`).
   - Error attempts (`errorAttempts`).
   - Error rate (`errorRate = errorAttempts / totalAttempts`).
   - Last practiced timestamp (`lastPracticedAt`).
3. Eligibility rule: A key requires at least 10 attempts (`MIN_ATTEMPTS = 10`) before it is eligible for weak-key classification.
4. Weakness threshold: A key is classified as a "weak key" if its error rate is >= 20% (`WEAK_THRESHOLD = 0.20`).
5. Primary sorting must be by `errorRate` descending; secondary sorting by `errorAttempts` descending.
6. Keys with < 10 attempts must display an "insufficient data" status indicator.
7. Backspace corrections must accurately adjust typing accuracy without distorting physical key counts.

### FR-006: Personalized Review Mode
1. The system must generate focused practice sessions derived from the user's identified weak keys.
2. The review generator must query the active mode's vocabulary catalog for entries that contain the weak keys.
3. If no weak keys currently meet the threshold, a clear guidance message must prompt the user to complete more standard challenges.
4. Review sessions must execute as isolated practice sessions without overwriting standard leaderboard best scores.
5. Review generation must support deterministic seeding for automated testing.

### FR-007: Learning Progress Dashboard
1. A dedicated modal or tab view must display:
   - Total completed practice sessions.
   - Recent WPM trend and Accuracy trend (compact SVG sparkline/bar without external libraries).
   - Best score breakdown by mode (`en`, `pinyin`, `zhuyin`).
   - Most-practiced mode and total practice time.
   - Ranked weak-key list with status indicators.
   - Direct button to launch Personalized Review.
   - Clear history button with confirmation dialog.
2. Accessible text alternatives must accompany visual trends.
3. Focus management and full keyboard navigation (Tab, Enter, Escape) must be supported.
4. All labels must be fully translated across `zh-TW`, `zh-CN`, and `en`.

---

## 2. Technical Contracts & Schemas

### Vocabulary Schema
```typescript
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VocabularyEntry {
  id: string;
  mode: 'en' | 'pinyin' | 'zhuyin';
  display: string;
  answer: string;
  hint?: string;
  difficulty: Difficulty;
  category: string;
  frequencyRank?: number;
  sourceNote?: string;
}
```

### Learning Session Record Schema
```typescript
export interface LearningSessionRecord {
  id: string;
  mode: 'en' | 'pinyin' | 'zhuyin';
  difficulty: Difficulty;
  startedAt: string;     // ISO-8601
  completedAt: string;   // ISO-8601
  durationSeconds: number;
  completedWords: number;
  totalKeys: number;
  correctKeys: number;
  errors: number;
  wpm: number;
  accuracy: number;
  score: number;
}
```

### Weak Key Statistics Schema
```typescript
export interface WeakKeyRecord {
  key: string;             // physical key code or symbol
  totalAttempts: number;
  errorAttempts: number;
  errorRate: number;       // 0.0 to 1.0
  isWeak: boolean;         // totalAttempts >= 10 && errorRate >= 0.20
  hasSufficientData: boolean; // totalAttempts >= 10
  lastPracticedAt: string; // ISO-8601
}
```

---

## 3. Storage Keys & Migration
| Key | Version | Purpose | Policy |
|---|---|---|---|
| `tritype.learning.v1` | v1 | Array of `LearningSessionRecord` | Max 200 items, FIFO pruning |
| `tritype.difficulty.v1` | v1 | Active difficulty tier (`beginner`, `intermediate`, `advanced`) | Defaults to `beginner` |
| `tritype.best.v2` | v2 | Existing best score map | Read/Write preserved, untouched |
| `tritype.ui.locale.v1` | v1 | UI interface locale (`zh-TW`, `zh-CN`, `en`) | Read/Write preserved, untouched |

---

## 4. Traceable Test Matrix

| Test ID | Requirement | Description | Target |
|---|---|---|---|
| `VOCAB-001` | FR-001 | English vocabulary count | Count >= 500 |
| `VOCAB-002` | FR-001 | Pinyin vocabulary count | Count >= 300 |
| `VOCAB-003` | FR-001 | Zhuyin vocabulary count | Count >= 300 |
| `VOCAB-004` | FR-001 | Vocabulary ID uniqueness | 0 duplicate IDs across all modes |
| `VOCAB-005` | FR-001 | Content uniqueness | 0 duplicate (display, answer) per mode |
| `VOCAB-006` | FR-001 | Normalization validation | 100% answers match normalized form |
| `VOCAB-007` | FR-001 | Category & difficulty enum validity | All match schema definitions |
| `VOCAB-008` | FR-001 | Tier distribution check | EN (200/200/100), Pinyin (120/120/60), Zhuyin (120/120/60) |
| `VOCAB-009` | FR-001 | Invalid tone / character rejection | Validator rejects malformed inputs |
| `VOCAB-010` | FR-001 | Provenance documentation | `VOCABULARY_PROVENANCE.md` exists and is non-empty |
| `SELECT-001` | FR-002 | Shuffled session start | Initial order differs from raw array order |
| `SELECT-002` | FR-002 | No in-cycle duplicates | All bag items seen before any repeats |
| `SELECT-003` | FR-002 | Deterministic seeding | Same seed yields identical order |
| `SELECT-004` | FR-002 | Divergent seeds | Different seeds produce different orders |
| `SELECT-005` | FR-002 | Boundary deduplication | Last item of cycle N != First item of cycle N+1 (pool > 1) |
| `SELECT-006` | FR-002 | Single item pool safety | Pool of size 1 repeats safely without hanging |
| `SELECT-007` | FR-002 | Mode switch pool refresh | Switching mode rebuilds bag |
| `SELECT-008` | FR-002 | Difficulty switch pool refresh | Switching difficulty rebuilds bag |
| `SELECT-009` | FR-002 | Restart reset behavior | Reset follows documented bag policy |
| `SELECT-010` | FR-002 | Legacy test stability | Existing deterministic tests pass unchanged |
| `LEVEL-001` | FR-003 | Three difficulty tiers | Beginner, Intermediate, Advanced available |
| `LEVEL-002` | FR-003 | Pool filtering | Selected tier selects corresponding entries |
| `LEVEL-003` | FR-003 | State preservation | Difficulty change does not corrupt running state |
| `LEVEL-004` | FR-003 | Locale independence | Changing UI locale does not alter selected level |
| `LEVEL-005` | FR-003 | Local persistence | Selected level restores after page reload |
| `LEVEL-006` | FR-003 | Multilingual labels | Level names translated in zh-TW, zh-CN, en |
| `HISTORY-001` | FR-004 | Single write on complete | Record written exactly once per finished game |
| `HISTORY-002` | FR-004 | Re-render deduplication | Multiple renders do not add duplicate records |
| `HISTORY-003` | FR-004 | Restoration on reload | Reload recovers historical sessions |
| `HISTORY-004` | FR-004 | Resilient corruption recovery | Malformed JSON in storage is handled safely |
| `HISTORY-005` | FR-004 | Legacy score preservation | `tritype.best.v2` unaffected |
| `HISTORY-006` | FR-004 | Storage quota protection | `QuotaExceededError` does not crash app |
| `HISTORY-007` | FR-004 | FIFO retention policy | Maximum 200 records maintained |
| `HISTORY-008` | FR-004 | History clear control | Clearing history preserves preferences |
| `WEAK-001` | FR-005 | Keystroke counting | Accurate total and error count tracking |
| `WEAK-002` | FR-005 | Error rate accuracy | Precise floating point percentage computation |
| `WEAK-003` | FR-005 | Insufficient data threshold | Attempts < 10 not marked weak |
| `WEAK-004` | FR-005 | Zhuyin symbol to key map | Correct physical mapping for Daqian symbols |
| `WEAK-005` | FR-005 | Mode isolation | Weak keys in EN do not bleed into Zhuyin |
| `WEAK-006` | FR-005 | Deterministic sorting | Stable ranking by error rate then error count |
| `WEAK-007` | FR-005 | Duplicate event immunity | Keystroke deduplication ensures accurate metrics |
| `WEAK-008` | FR-005 | Backspace contract | Backspace corrections handled deterministically |
| `REVIEW-001` | FR-006 | Targeted drill generation | Exercises contain identified weak keys |
| `REVIEW-002` | FR-006 | Empty state fallback | Helpful prompt when 0 weak keys exist |
| `REVIEW-003` | FR-006 | Valid lesson format | Generated review lessons pass `validateLesson` |
| `REVIEW-004` | FR-006 | Score isolation | Review sessions do not distort challenge records |
| `REVIEW-005` | FR-006 | Seeded reproducibility | Review generation is reproducible with seed |
| `REVIEW-006` | FR-006 | Recommendation update | New practice data updates review suggestions |
| `DASH-001` | FR-007 | Dashboard rendering | Displays summary, trends, weak keys, review |
| `DASH-002` | FR-007 | Empty state UI | Clean placeholder for zero-history users |
| `DASH-003` | FR-007 | Accessibility compliance | Semantic headings, aria labels, keyboard focus |
| `DASH-004` | FR-007 | Responsive layout | Clean mobile and desktop display |
| `DASH-005` | FR-007 | Multilingual UI | All dashboard labels translated |
| `DASH-006` | FR-007 | Zero external chart libs | SVG/CSS only, keeping bundle compact |
| `REVIEW-ISOLATION-001` | FR-006 | Challenge Best Score | Normal challenge sessions update best records |
| `REVIEW-ISOLATION-002` | FR-006 | Review Isolation | Review practice sessions never overwrite challenge best records |
| `REVIEW-ISOLATION-003` | FR-004 | SessionType Tagging | History records explicitly preserve `sessionType` |
| `REVIEW-ISOLATION-004` | FR-006 | Challenge Mode Return | Exiting review cleanly reinstates challenge gameplay session |
| `REVIEW-ISOLATION-005` | FR-004 | Storage Idempotency | Component re-renders do not duplicate saved records |
| `REVIEW-ISOLATION-006` | FR-004 | Backward Compatibility | Pre-v0.4.0 records without `sessionType` default to challenge |
| `VOCAB-011` | FR-001 | Pinyin Audit Regressions | Audit fixes verified (lvse, fuza, zerendandang, dulisikao, etc.) |
| `VOCAB-012` | FR-001 | Taiwan MOE Pronunciations | Taiwanese readings verified (微 ㄨㄟˊ, 權 ㄑㄩㄢˊ, 友誼 ㄧㄡˇ ㄧˋ) |
| `VOCAB-013` | FR-001 | Syllable Alignment | 100% of Chinese vocabulary entries have 1-to-1 character-syllable match |
| `PROV-001` | FR-001 | Traceable Vocabulary IDs | 1,100 vocabulary entries have valid, unique, and traceable IDs |
| `PROV-002` | FR-001 | Provenance Classification | Every entry is classified with origin_type and rights_status |
| `PROV-003` | FR-001 | External Source Register | External/verified sources are referenced by canonical URL |
| `PROV-004` | FR-001 | License & SPDX Evidence | Non-empty SPDX identifier and license evidence URL for all rows |
| `PROV-005` | FR-001 | Dataset Quotas Maintained | Quotas verified: 500 EN (200/200/100), 300 Pinyin (120/120/60), 300 Zhuyin (120/120/60) |
| `PROV-006` | FR-001 | Phonetic & Answer Integrity | Structural validation and 1:1 character-syllable alignment across all entries |
| `PROV-007` | FR-002 | Session & Bag Compatibility | All 1,100 entries integrate seamlessly with GameSession and ShuffleBag |
| `PROV-008` | FR-001 | Documentation Consistency | VOCABULARY_PROVENANCE.md structure and clearance conclusions align with register |
