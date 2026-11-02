# Technical Design: V0.4.0 Typing Learning System

## 1. Architectural Overview

The typing learning system builds modularly upon the existing offline-first domain architecture:

```
src/
├── domain/
│   ├── vocabulary/
│   │   ├── types.ts          # VocabularyEntry, Difficulty definitions
│   │   ├── validator.ts      # Offline validation rules for all 3 modes
│   │   ├── en.ts             # 500 English entries (beginner/intermediate/advanced)
│   │   ├── pinyin.ts         # 300 Pinyin entries
│   │   ├── zhuyin.ts         # 300 Zhuyin entries
│   │   └── index.ts          # Aggregated catalogs & lookup utilities
│   ├── shuffle-bag.ts        # Seeded ShuffleBag algorithm with boundary deduplication
│   ├── learning/
│   │   ├── types.ts          # LearningSessionRecord, WeakKeyRecord
│   │   ├── history-store.ts  # LocalStorage persistence, 200-item FIFO, migration
│   │   ├── weak-keys.ts      # Aggregation engine, 10-attempt threshold, ranking
│   │   └── review-generator.ts # Weak-key drill lesson synthesis
│   ├── session.ts            # GameSession integrated with difficulty & ShuffleBag
│   └── ...
├── features/
│   ├── learning/
│   │   ├── LearningDashboard.tsx # Modal / panel for statistics & trends
│   │   ├── TrendChart.tsx        # Pure SVG sparkline / bar chart without external libs
│   │   └── WeakKeyList.tsx       # Accessible ranked list of target keys
│   ├── typing/
│   │   ├── DifficultySelector.tsx # Beginner / Intermediate / Advanced UI toggle
│   │   └── TypingArena.tsx        # Preserves PR #3 keyboard & IME hardening
│   └── ...
```

---

## 2. Component Design & Algorithms

### A. Shuffle Bag Algorithm (`ShuffleBag`)
Standard PRNG shuffling can result in immediate repetitions when cycles restart (e.g. word X was the last item of cycle 1, and happens to be the first item of cycle 2).

**Algorithm**:
1. Internal state maintains `pool: T[]`, `bag: T[]`, `lastPicked: T | null`, and `rng: () => number`.
2. On refill:
   - Copy `pool` into `bag` and perform Fisher-Yates shuffle using `rng`.
   - If `lastPicked !== null` and `pool.length > 1` and `bag[0] === lastPicked`:
     - Swap `bag[0]` with `bag[bag.length - 1]`.
3. `next()` pops or shifts the next item from `bag`, records `lastPicked`, and refills when `bag.length === 0`.
4. Supports deterministic reproducibility via injected `createRng(seed)`.

### B. Weak-Key Metric Engine (`weak-keys.ts`)
```typescript
interface KeyMetricAccumulator {
  total: number;
  errors: number;
  lastPracticed: number;
}
```
1. Reads all `typos: TypoRecord[]` from completed `LearningSessionRecord` history.
2. For each completed session:
   - Count every expected character as an attempt.
   - Count each typo in `typos` against its expected character.
3. Apply classification thresholds:
   - `total >= 10`: `hasSufficientData = true`.
   - `total >= 10 && (errors / total) >= 0.20`: `isWeak = true`.
4. Rank ordering:
   - Primary: `errorRate` descending.
   - Secondary: `errors` descending.
   - Tertiary: `key` lexicographical.

### C. Review Practice Synthesis (`review-generator.ts`)
1. Extract top weak keys (up to 5) for current mode.
2. Scan active vocabulary for entries containing at least one of these weak keys.
3. If matching vocabulary entries exist:
   - Return entries as custom `lessons` into `GameSession`.
4. If no weak keys exist (or no matches):
   - Fall back to standard beginner lessons and inform the user.

### D. Zero-Dependency SVG Trend Visualizer (`TrendChart.tsx`)
Rather than pulling in Chart.js, Recharts, or D3 (which would inflate bundle size and risk dependency security vulnerabilities), trends are drawn using a lightweight React SVG component:
- Computes normalized coordinate viewBox `(0, 0, width, height)`.
- Renders `<polyline>` or `<path>` with smooth stroke and subtle gradient fill.
- Emits high-contrast, accessible `<title>` and `aria-label` table summaries for screen readers.

---

## 3. Storage Architecture & Migration

1. **Storage Schema Versioning**:
   - `tritype.learning.v1`: Stored as a JSON stringified array of `LearningSessionRecord`.
   - On write: prepends new record, trims to length 200 (`records.slice(0, 200)`).
   - On read: wraps in `try / catch`. If invalid JSON or non-array, logs warning and returns `[]` without crashing.
2. **Quota Handling**:
   - If `localStorage.setItem` throws `QuotaExceededError`:
     - Attempts trimming history to 100 entries and retrying.
     - If still failing, degrades gracefully without blocking gameplay.

---

## 4. Invariant Protection

1. **Keyboard Event & IME Hardening (PR #3)**:
   - `handleKeyDown` in `TypingArena.tsx` maintains `e.stopPropagation()` and shortcut bypass (`metaKey`, `ctrlKey`, `altKey`).
   - `onCompositionEnd` continues to skip Zhuyin mode to prevent double-dispatch.
   - Physical `code` resolution (`KeyK` -> `ㄜ`) is preserved.
2. **Deterministic Anti-Paste**:
   - Paste interception remains active and covered by regression tests.
3. **No Network / Guest Operation**:
   - Zero external fetch calls or telemetries.
