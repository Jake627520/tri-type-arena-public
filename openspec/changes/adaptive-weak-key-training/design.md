# Technical Design: V0.5.0 Adaptive Weak-Key Training

## 1. Architectural Overview

The adaptive weak-key training system extends TriType Arena's existing learning infrastructure with a dynamic, targeted drill generator. It introduces pure domain modules, dedicated storage, and non-intrusive UI components without mutating core challenge scoring, existing vocabulary databases, or V0.4.1 typing rules.

```
src/
├── domain/
│   ├── learning/
│   │   ├── weak-keys.ts             # Base KeyStat & KeyAttempt aggregations (existing, per-mode storage)
│   │   ├── adaptive-priority.ts     # NEW: Weak-key composite priority ranking & deterministic tie-breaking
│   │   ├── adaptive-selector.ts     # NEW: Weighted lesson selection without replacement
│   │   ├── adaptive-progress.ts     # NEW: Baseline snapshot capture & delta calculation
│   │   └── adaptive-storage.ts      # NEW: tritype.adaptive.v1 persistence & FIFO management
│   ├── types.ts                     # Extend SessionType = 'challenge' | 'review' | 'adaptive'
│   └── session.ts                   # GameSession lifecycle integration
├── features/
│   ├── learning/
│   │   ├── LearningDashboard.tsx    # Add "Adaptive Practice" entry point
│   │   ├── AdaptivePracticeModal.tsx# NEW: Configuration modal for target keys & round length
│   │   └── AdaptiveProgressView.tsx # NEW: Post-session comparison view (percentage points)
│   ├── keyboard/
│   │   └── DaqianKeyboard.tsx       # Preserves first-tone Space key highlighting (#daqian-space-key)
│   └── typing/
│       ├── TypingArena.tsx          # Preserves IME composition & input hardening
│       └── useTypingSession.ts      # Best score isolation & single-write completion
```

---

## 2. Component Design & Mathematical Formulations

### A. Weak-Key Composite Priority Ranking (`adaptive-priority.ts`)
To prevent low-volume noise from dominating drill selection while ensuring frequently missed keys are prioritized, weak keys are ranked primarily by their **composite priority score**:

$$\text{Priority}(k) = 0.60 \times \text{ErrorRate}(k) + 0.20 \times \text{NormAttempts}(k) + 0.20 \times \text{RecencyBonus}(k)$$

Where:
- $\text{ErrorRate}(k) = \frac{\text{errors}(k)}{\text{attempts}(k)}$, defined only when $\text{attempts}(k) \ge 10$ and $\text{ErrorRate}(k) \ge 0.20$.
- $\text{NormAttempts}(k) = \min\left(1.0, \frac{\text{attempts}(k)}{50}\right)$.
- $\text{RecencyBonus}(k) = \max\left(0, 1.0 - \frac{\text{now} - \text{lastPracticed}(k)}{86400000 \times 7}\right)$ (decays linearly over 7 days).

**Ranking & Tie-Breaking Rules**:
1. **Primary Sort Key**: Keys are sorted strictly by $\text{Priority}(k)$ descending. To guarantee mathematical transitivity and eliminate non-transitive comparison cycles in standard sorting algorithms (e.g. Timsort), comparison operates on 6-decimal quantized scores: $\text{round}(\text{Priority}(k) \times 10^6)$.
2. **Explicit Secondary Tie-Breakers**: When candidate keys have identical quantized composite priority scores:
   - Higher quantized $\text{ErrorRate}(k)$ descending ($\text{round}(\text{ErrorRate}(k) \times 10^6)$).
   - Higher total $\text{attempts}(k)$ descending.
   - Lexicographical Unicode code point ascending (e.g. `'a'` before `'b'`).

**Weak-Key Data Scope (Mode-Scoped)**:
- Weak-key tracking in `tritype.weakkeys.v1.${mode}` is stored **per mode** and shared across difficulty levels within that mode. Keystroke biomechanical muscle memory (finger dexterity, misreaching) is a typist-level trait, and aggregating across difficulties avoids dividing limited sample sizes by three.
- Candidate lesson filtering, however, remains strictly constrained by the active session's Difficulty tier.

**Daqian Space Key Integration**:
In `zhuyin` mode, the physical Space key (`' '`) is evaluated under identical rules. When `attempts(' ') >= 10` and `errorRate(' ') >= 0.20`, Space is eligible for adaptive targeting.

---

### B. Weighted Lesson Selection Algorithm (`adaptive-selector.ts`)
Standard random sampling produces sparse weak-key encounters. The adaptive selector biases lesson sampling so that chosen lessons heavily feature the selected target weak keys.

#### Lesson Weight Formulation:
For a candidate lesson $L$ containing answer characters $C(L)$, let $K(L)$ be the set of physical keys required to type $L$.
For target weak keys $T = \{k_1, k_2, \dots, k_m\}$:

$$\text{Weight}(L) = 1.0 + \sum_{k \in K(L) \cap T} \text{Priority}(k) \times \text{Frequency}(k, L)$$

Where:
- $\text{Frequency}(k, L)$ is the occurrence count of key $k$ in lesson $L$.
- Lessons containing none of the target keys retain a base weight of $1.0$ (ensuring natural language balance).

#### Selection Algorithm Without Replacement:
1. Filter vocabulary strictly by current `mode` and `difficulty`. Untagged entries are rejected by default unless caller explicitly supplies a trusted `fallbackMetadata` context (FIX-03).
2. Deduplicate candidate pool by unique lesson identity (`id` or composite fallback `${mode}::${difficulty}::${display}::${answer}::${hint}`) (FIX-01).
3. Compute $\text{Weight}(L)$ for each eligible unique lesson using runtime tone-derived answers.
4. Stage 1 (Multi-Key Coverage & Boundary Deduplication):
   - Iterate through target weak keys in priority order to select at least one unique lesson per key.
   - When selecting the first lesson ($i = 0$) and pool size $> 1$, $L_0 \ne \text{previousLessonId}$ takes strict precedence over weak-key coverage; any weak key matching solely the previous lesson is deferred until slot 1+ (FIX-02).
5. Stage 2 (Weighted Roulette-Wheel Selection):
   - Sample remaining slots proportionally to $\text{Weight}(L_i)$ without replacement.
   - If weak-key candidates are exhausted before requested count is met, backfill from unselected neutral lessons in the same pool.
6. Verify non-repetition: $L_0 \ne L_{\text{prev}}$ across cycle boundaries (with single-lesson pool exception).

---

### C. Progress & Improvement Metric Calculations (`adaptive-progress.ts`)
Rather than subjective or relative percentage change (which inflates small shifts), improvement is measured strictly in **percentage points (pp)**:

$$\Delta \text{ErrorRate}(k) = \text{BaselineErrorRate}(k) - \text{PracticeErrorRate}(k)$$

- **Positive Delta ($> 0$)**: Indicates reduced error rate (e.g. baseline 35% to practice 15% is $+20.0\text{ pp}$).
- **Negative Delta ($< 0$)**: Indicates increased error rate (performance regression during session).
- **Zero Delta ($= 0$)**: Performance unchanged.

#### Baseline and Practice Data Sources:
- **Baseline Stats**: Taken directly from the snapshot of `loadWeakKeyStats(mode)` (`tritype.weakkeys.v1.${mode}`) at session initialization.
- **Practice Stats**: Accumulated in real time via the active session's `GameSession.keyAttempts` map.
- **Existing Storage Compatibility**: No modifications to `LearningSessionRecord` or `tritype.learning.v1` schema are required.

#### Data Sufficiency & Non-Causal Framing Constraints:
- If $\text{PracticeAttempts}(k) < 5$, status is set to `INSUFFICIENT_DATA`.
- The UI and telemetry strictly label outcomes as "單次練習表現變化" (Observed Session Change).
- Absolute claims of "mastery", "fixed key", or permanent skill acquisition are explicitly prohibited in user-facing copy.

---

### D. Persistent Storage Schema (`adaptive-storage.ts`)

Stored under browser `localStorage` key `tritype.adaptive.v1`:

```typescript
export interface AdaptiveSessionRecord {
  id: string; // e.g., 'adp_1729900000_abc'
  schemaVersion: 1;
  mode: 'en' | 'pinyin' | 'zhuyin';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetWeakKeys: string[];
  seed: number | null;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wpm: number;
  accuracy: number;
  baselineStats: Record<string, {
    totalAttempts: number;
    errorCount: number;
    errorRate: number | null;
  }>;
  practiceStats: Record<string, {
    attempts: number;
    errors: number;
    errorRate: number | null;
  }>;
  status: 'COMPLETED' | 'ABANDONED';
}
```

#### Storage Policies:
1. **FIFO Retention**: Maximum 50 completed records. When limit is reached, oldest records are pruned.
2. **Single-Write Idempotency**: Written once when status transitions to `COMPLETED`. Double invocations for the same `id` are ignored.
3. **Corrupted JSON Recovery**: If parsing fails, logs diagnostic warning and initializes with `[]`.
4. **Storage Isolation**: Leaves `tritype.learning.v1`, `tritype.weakkeys.v1.*`, and `tritype.best.v2` untouched.
5. **Reset Integration**: Clearing history purges `tritype.adaptive.v1`.

---

## 3. Architecture Decision Records (ADRs)

### ADR-1: Extend `SessionType` to `'challenge' | 'review' | 'adaptive'`
- **Context**: TriType Arena distinguishes between competitive timed challenges and unranked learning sessions.
- **Decision**: Extend `SessionType` in `src/domain/types.ts` to include `'adaptive'`.
- **Consequences**:
  - `useTypingSession.ts` already gates `saveBestRecord()` strictly with `if (s.sessionType === 'challenge')`. Adding `'adaptive'` guarantees that Best Scores cannot be accidentally overwritten without altering challenge scoring logic.

### ADR-2: Daqian Space Key (`' '`) First-Class Modeling in Zhuyin Weak-Key Pipeline
- **Context**: V0.4.1 introduced the requirement that Zhuyin first tone must be completed by pressing Space.
- **Decision**: Treat `' '` as an ordinary key in `KeyStat`, `KeyAttempt`, and `adaptive-priority.ts`.
- **Consequences**:
  - Eliminates edge cases where Space errors were ignored.
  - Allows the adaptive engine to generate lessons targeting first-tone words when users frequently omit or mistime the Space key.

### ADR-3: Absolute Percentage Point Difference vs Relative Percentage Change
- **Context**: A drop from 10% to 5% error is a 50% relative reduction, whereas a drop from 40% to 35% is a 12.5% relative reduction, confusing users.
- **Decision**: Standardize all delta metrics on percentage points (pp).
- **Consequences**:
  - Direct, transparent, and mathematically grounded comparisons.

### ADR-4: Deterministic Pseudo-Random Number Generation (PRNG)
- **Context**: Unit and regression tests must verify that weighted selection produces identical lesson orders given identical seeds.
- **Decision**: Re-use the existing PRNG injection pattern from `src/domain/shuffle-bag.ts`.
- **Consequences**:
  - 100% reproducible test fixtures for weighted selection, boundary deduplication, and fallback mechanisms.

### ADR-5: Mode-Scoped Weak-Key Stats with Difficulty-Filtered Lesson Selection
- **Context**: Weak-key stats in V0.4.1 are stored per-mode in `tritype.weakkeys.v1.${mode}`. Typing difficulties share the same keyboard layout and typing mechanics.
- **Decision**: Retain per-mode weak-key aggregation across all difficulties for that mode, while constraining lesson selection to the active Difficulty pool.
- **Consequences**:
  - Prevents premature data fragmentation (splitting keystroke sample size by 3).
  - Maintains 100% backward compatibility with existing V0.4.1 storage schema.

### ADR-6: Strict Preservation of Existing Typing Rules
- **Context**: V0.4.1 established rules for English, Pinyin, and Zhuyin.
- **Decision**: English and Pinyin modes retain their existing typing behaviors without requiring trailing spaces or artificial tone inputs. Zhuyin retains mandatory physical Space for first tones.
- **Consequences**:
  - Zero regression in user typing experience across existing modes.

### ADR-7: Adaptive Persistent Storage Schema & Statistical Null Preservation
- **Context**: In Phase 4 (FIX-03), strict statistical validation established that when attempts are 0 or below minimum thresholds (<10 attempts for baseline, <5 for practice), `errorRate` must remain `null` rather than falsified into `0.0`. In addition, sessions initiated without an explicit pseudo-random seed must represent `seed: number | null` rather than an invented pseudo-seed.
- **Decision**: Define `AdaptiveSessionRecord` with `errorRate: number | null` in `baselineStats` and `practiceStats`, and `seed: number | null`.
- **Consequences**:
  - Eliminates false improvement reporting (e.g., baseline error rate of 50% vs unpracticed 0 attempts would falsely report +50.0 pp improvement if errorRate were forced to 0).
  - Preserves data integrity without fabricating random seeds or error rates.

### ADR-8: Fail-Closed Storage Reads, Persist Retry, & Quota Pruning Semantics
- **Context**: In Phase 5 review, three safety risks were identified:
  1. A read failure or corrupted JSON in LocalStorage returning an empty array `[]` would cause subsequent saves to destructively overwrite unverified raw data.
  2. Setting the completion lock before confirming `saveAdaptiveSession()` succeeded silently dropped persistence failures without retry capability.
  3. Quota pruning or saving records with timestamps older than existing history risked dropping the newly saved record while reporting success.
- **Decision**:
  1. Implement `readAdaptiveSessionsStrict()` returning `AdaptiveStorageReadResult` (`{ ok: true, records } | { ok: false, reason: 'CORRUPTED' | 'UNAVAILABLE' }`). `saveAdaptiveSession()` fails closed and preserves raw storage whenever read verification fails.
  2. Decouple lifecycle completion, weak-key accumulation, and adaptive persistence into independent states. Expose `retryPersistAdaptiveSession()` in `useTypingSession`. Accumulate weak keys exactly once per session ID regardless of adaptive persistence retries.
  3. In FIFO and quota degradation, prune oldest *existing* records to guarantee that the newly saved record is never evicted upon saving, even when its completion timestamp is older than existing records.
- **Consequences & Known Limitations**:
  - Eliminates destructive overwrite upon storage read failures.
  - Grants user-directed retry capability for failed session persistence without duplicate weak-key accumulation.
  - Acknowledges that LocalStorage lacks cross-key atomic transactions: `tritype.adaptive.v1` and `tritype.weakkeys.v1.*` write independently; exact-once atomicity across keys cannot be guaranteed by browser Web Storage without transactional backend support.

### ADR-9: Weak-Key Persistence Acknowledgment & Explicit-Only Retry Policy
- **Context**: In final safety inspection, two write consistency issues remained:
  1. `saveWeakKeyStats()` was called without write acknowledgment; storage failure did not mark failure, and legacy weak-key storage would destructively overwrite corrupted JSON.
  2. Unpersisted adaptive records would automatically retry saving on every timer tick (every 100ms) or component re-render, violating explicit retry safety principles.
- **Decision**:
  1. Make `saveWeakKeyStats()` fail-closed on corrupted JSON or non-object roots, returning `false` without overwriting unverified storage.
  2. Decouple weak-key persistence into explicit states (`weakKeysPersistStatus: 'idle' | 'persisted' | 'failed'`), exposing `retryPersistWeakKeys()`. Only mark persisted when `saveWeakKeyStats()` genuinely succeeds.
  3. Enforce exactly ONE automatic persistence attempt per completed session ID. Subsequent timer ticks, syncState invocations, and re-renders are strictly prevented from auto-retrying. Only explicit user invocation of `retryPersistAdaptiveSession()` or `retryPersistWeakKeys()` triggers retry.
- **Consequences**:
  - Independent fault isolation: adaptive history and weak-key history can fail and retry independently without duplicate accumulation.
  - Zero background retry spam or CPU/storage thrashing while in finished state.
