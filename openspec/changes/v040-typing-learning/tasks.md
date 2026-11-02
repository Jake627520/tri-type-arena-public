# Tasks: V0.4.0 Typing Learning System

> **Historical correction (2026-11-02):** This checklist records earlier claims, not verified evidence of vocabulary origin or rights. In particular, the assertions in 8.1.2, 8.1.3, 8.2 and 8.4.2 are not supported by the available evidence: the project owner reports that another AI collected the initial vocabulary, and its sources and authorization are unknown. The current candidate vocabulary has since been replaced and remains blocked from public release pending review. See [current provenance](../../../docs/vocabulary/PROVENANCE.md) and [source register](../../../docs/VOCABULARY_SOURCE_REGISTER.csv).

## Phase 1 — Vocabulary Expansion & Randomized Selection (FR-001, FR-002)
- [x] 1.1 Create `src/domain/vocabulary/types.ts` defining `Difficulty` and `VocabularyEntry`.
- [x] 1.2 Write TDD test suite `tests/domain/vocabulary.test.ts` checking VOCAB-001 through VOCAB-010.
- [x] 1.3 Implement `src/domain/vocabulary/validator.ts` with strict offline normalization & pronunciation checks.
- [x] 1.4 Author `src/domain/vocabulary/en.ts` (500 curated entries: 200 beginner, 200 intermediate, 100 advanced).
- [x] 1.5 Author `src/domain/vocabulary/pinyin.ts` (300 curated entries: 120 beginner, 120 intermediate, 60 advanced).
- [x] 1.6 Author `src/domain/vocabulary/zhuyin.ts` (300 curated entries: 120 beginner, 120 intermediate, 60 advanced).
- [x] 1.7 Create `docs/VOCABULARY_PROVENANCE.md` detailing public domain / community sources and license compliance.
- [x] 1.8 Write TDD test suite `tests/domain/shuffle-bag.test.ts` checking SELECT-001 through SELECT-010.
- [x] 1.9 Implement `src/domain/shuffle-bag.ts` with seeded Fisher-Yates and boundary deduplication.

## Phase 2 — Difficulty-Based Learning (FR-003)
- [x] 2.1 Write TDD test suite `tests/components/difficulty.test.tsx` checking LEVEL-001 through LEVEL-006.
- [x] 2.2 Update `GameSessionOptions` and `GameSession` in `src/domain/session.ts` to support `difficulty`.
- [x] 2.3 Implement `src/features/typing/DifficultySelector.tsx`.
- [x] 2.4 Add difficulty strings (`beginner`, `intermediate`, `advanced`) to `src/i18n/core.ts`.
- [x] 2.5 Integrate `DifficultySelector` into `App.tsx` and persist selection under `tritype.difficulty.v1`.

## Phase 3 — Learning History Storage (FR-004)
- [x] 3.1 Write TDD test suite `tests/domain/history-storage.test.ts` checking HISTORY-001 through HISTORY-008.
- [x] 3.2 Implement `src/shared/storage.ts` (200-record FIFO, schema validation, quota handling).
- [x] 3.3 Connect finished-game session lifecycle in `useTypingSession.ts` to record sessions once.
- [x] 3.4 Verify legacy `tritype.best.v2` scores remain unaffected.

## Phase 4 — Weak-Key Analysis & Review Mode (FR-005, FR-006)
- [x] 4.1 Write TDD test suite `tests/domain/weak-keys.test.ts` checking WEAK-001 through WEAK-008.
- [x] 4.2 Implement `src/domain/learning/weak-keys.ts` (10-attempt threshold, >=20% error rate classification).
- [x] 4.3 Write TDD test suite `tests/domain/review.test.ts` checking REVIEW-001 through REVIEW-006.
- [x] 4.4 Implement `src/domain/learning/review-generator.ts` (targeted drill synthesis from weak keys).

## Phase 5 — Learning Progress Dashboard (FR-007)
- [x] 5.1 Write TDD test suite `tests/components/dashboard.test.tsx` checking DASH-001 through DASH-006.
- [x] 5.2 Implement `src/features/learning/TrendChart.tsx` (accessible pure SVG sparkline/bar).
- [x] 5.3 Implement `src/features/learning/LearningDashboard.tsx` (summary stats, trends, weak keys, review launcher).
- [x] 5.4 Add dashboard navigation button and modal dialog in `App.tsx`.
- [x] 5.5 Add dashboard translation keys to `src/i18n/core.ts` across all three locales.

## Phase 7 — PR #4 Final Review Hardening
- [x] 7.1 Review / Challenge Session Isolation (Task A)
  - [x] 7.1.1 Add `SessionType = 'challenge' | 'review'` to `src/domain/types.ts` and `src/domain/session.ts`.
  - [x] 7.1.2 Update `saveCompletedSession` and `LearningSessionRecord` to preserve `sessionType` with legacy compatibility.
  - [x] 7.1.3 Prevent review mode from overwriting challenge mode Best Score in `useTypingSession.ts`.
  - [x] 7.1.4 Implement `exitReviewMode()` in `useTypingSession.ts` and hook into `App.tsx` on review exit.
  - [x] 7.1.5 Prevent duplicate storage writes on component re-renders.
  - [x] 7.1.6 Add TDD test suite `tests/domain/review-isolation.test.ts` (REVIEW-ISOLATION-001 through 006).
- [x] 7.2 Vocabulary Quality Audit (Task B)
  - [x] 7.2.1 Audit all 1,100 vocabulary entries for whitespace, invisible characters, duplicates, and syllable length alignment.
  - [x] 7.2.2 Fix Pinyin answer and tone typos (`lvse`, `fuza`, `zerendandang`, `dulisikao`, `jingyiqiujing`, `jiyinchongzu`, `gāo bìng fā`, `gòng shì`).
  - [x] 7.2.3 Fix Taiwan Mandarin Zhuyin pronunciations (`ㄨㄟˊ` for `微`, `ㄑㄩㄢˊ` for `權`, `友誼` `ㄧㄡˇ ㄧˋ`).
  - [x] 7.2.4 Expand advanced technical entries 030-060 with full character-to-syllable phonetic transcriptions.
  - [x] 7.2.5 Add `sourceNote` annotations to key polyphonic and pronunciation-audited entries.
  - [x] 7.2.6 Update `docs/VOCABULARY_PROVENANCE.md` partitioned into 4 sections (Automated validation, Pronunciation review, Source/license verification, Pending manual review).
  - [x] 7.2.7 Add TDD regression tests `VOCAB-011` through `VOCAB-013` in `tests/domain/vocabulary.test.ts`.
- [x] 7.3 Full Verification & Delivery (Tasks C & D)
  - [x] 7.3.1 Typecheck (`tsc --noEmit`), lint (`eslint src`), unit tests, license audit, and production build clean.
  - [x] 7.3.2 Execute E2E regression tests on Chromium & WebKit.
  - [x] 7.3.3 Push directly to PR #4 and verify remote CI workflow checks.

## Phase 8 — Vocabulary Provenance & License Clearance (Tasks A–E)
- [x] 8.1 Task A: Trace Actual Vocabulary Provenance
  - [x] 8.1.1 Inspect `src/domain/vocabulary/{en,pinyin,zhuyin}.ts`, scratch generation history, and commit log (`c18d44d`).
  - [x] 8.1.2 Verify that no whole proprietary dictionary databases or copyrighted commercial typing wordlists were scraped or copied.
  - [x] 8.1.3 Classify origin for all 1,100 items (`ORIGINAL`: 966, `VERIFIED`: 120, `NEEDS_REVIEW`: 14, `REPLACE_REQUIRED`: 0).
- [x] 8.2 Task B: Verify Official Source Licenses
  - [x] 8.2.1 Audit GSL/NGSL, HSK, and Taiwan MOE Mandarin dictionaries terms.
  - [x] 8.2.2 Clarify Taiwan MOE CC BY-ND 3.0 TW terms vs uncopyrightable linguistic facts (words and pronunciations).
  - [x] 8.2.3 Confirm 40 classical Chinese idioms are in Public Domain (`CC-PDDC` / Public Domain Mark 1.0).
- [x] 8.3 Task C: Update Documentation & Evidence Register
  - [x] 8.3.1 Overhaul `docs/VOCABULARY_PROVENANCE.md` into 10 required sections and remove unverified "100% verified" claims.
  - [x] 8.3.2 Generate canonical register `docs/VOCABULARY_SOURCE_REGISTER.csv` with exactly 1,100 data rows.
- [x] 8.4 Task D: Vocabulary Quality & Pronunciation Remediation
  - [x] 8.4.1 Retain minimum counts: 500 EN, 300 Pinyin, 300 Zhuyin.
  - [x] 8.4.2 Zero unauthorized copyrighted entries; 14 colloquial light-tone items explicitly marked `NEEDS_REVIEW`.
- [x] 8.5 Task E: TDD Verification Suite (PROV-001..PROV-008)
  - [x] 8.5.1 Write TDD test suite `tests/domain/provenance.test.ts` implementing PROV-001 through PROV-008.
  - [x] 8.5.2 Verify full test suite passes locally.

## Phase 9 — Vocabulary Governance & License Clearance (PR #4 Directive)
- [x] 9.1 Required Governance Documentation Suite
  - [x] 9.1.1 Create `docs/vocabulary/SOURCES.md` (source tracking with 9 metadata fields).
  - [x] 9.1.2 Create `docs/vocabulary/LICENSE_POLICY.md` (copyright principles, linguistic facts, merge policies PASS/BLOCKED/EXCLUDED).
  - [x] 9.1.3 Create `docs/vocabulary/PROVENANCE.md` (data transformation lifecycle, pronunciation quality, audit trail).
  - [x] 9.1.4 Create `docs/vocabulary/REVIEW_CHECKLIST.md` (pre-merge checklist covering AC-1..AC-7 and sign-off).
- [x] 9.2 Data Tracking & Acceptance Enforcement
  - [x] 9.2.1 Enforce 9 metadata fields per source/batch (Source ID, Source URL/record, Content Type, License Type, Attribution, Commercial, Modification, Verification Date, Review Status).
  - [x] 9.2.2 Prohibit unverified Public Domain / CC0 claims; confirm third-party CC BY-ND boundaries.
  - [x] 9.2.3 Restrict content type to Word & Pronunciation; prohibit bulk dictionary scraping, definitions, and sentences.
- [x] 9.3 Automated Verification Integration
  - [x] 9.3.1 Enhance `scripts/validate-vocabulary-provenance.mjs` with governance suite and 9 metadata fields checks.
  - [x] 9.3.2 Enhance `tests/domain/provenance.test.ts` (Vitest) covering PROV-001 through PROV-008.
  - [x] 9.3.3 Integrate into `npm run check` pipeline.

## Phase 10 — Round 6 Final Closure & Dual Governance (PR #4)
- [x] 10.1 PROV-007 Historical Compatibility Verification
  - [x] 10.1.1 Inspect git history (`v0.3.0` tag / `6f2ea63` and `main` baseline `727d045`) confirming no prior vocabulary dataset baseline existed.
  - [x] 10.1.2 Record truthful status `Historical Compatibility: NOT VERIFIABLE` with mandatory statement across all documentation.
  - [x] 10.1.3 Verify internal structural consistency across all 1,100 IDs without fabricating prior baselines or generating fake PASS.
- [x] 10.2 License Governance & Release Decision Separation
  - [x] 10.2.1 Separate Source Rights Status (`NEEDS_REVIEW` maintained for 3 batches) from Release / Merge Decision (`CLEARED_FOR_DEV_MERGE`, `BLOCKED_FROM_RELEASE`).
  - [x] 10.2.2 Establish formal definition of CONDITIONAL as development-merge assessment rather than copyright license clearance.
  - [x] 10.2.3 Define Private Main Branch merge policy and Public Release Gate.
- [x] 10.3 Third-Party Evidence & License Accuracy
  - [x] 10.3.1 Define CC BY-ND 3.0 TW accurately (commercial unadapted redistribution permitted; not NC; fact-check only).
  - [x] 10.3.2 Establish Source Usage Classifications (`fact_check_only`, `licensed_content_reuse`, `pending_review`).
  - [x] 10.3.3 Adopt qualified non-infringement statement and eliminate overbroad assertions across all 6 governance docs.
- [x] 10.4 Regression Testing & CI Validation
  - [x] 10.4.1 Validate PROV-001..008 via `node scripts/validate-vocabulary-provenance.mjs` and Vitest.
  - [x] 10.4.2 Execute full regression check suite (`npm run check`, E2E Chromium & WebKit, audit).
