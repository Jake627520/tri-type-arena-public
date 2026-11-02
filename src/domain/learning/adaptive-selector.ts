import type { Lesson, Mode, Difficulty } from '../types';
import type { RankedWeakKey } from './adaptive-priority';
import { prepareTypingLesson } from '../typing-answer';
import { createRng } from '../prng';

export interface AdaptiveSelectorOptions {
  mode: Mode;
  difficulty: Difficulty;
  vocabulary: readonly Lesson[];
  weakKeys: readonly RankedWeakKey[];
  count?: number;
  seed?: string | number;
  previousLessonId?: string;
  fallbackMetadata?: {
    mode?: Mode;
    difficulty?: Difficulty;
  };
}

export interface AdaptiveSelectionResult {
  lessons: Lesson[];
  targetKeys: string[];
  requestedCount: number;
  selectedCount: number;
  matchedCount: number;
  usedBackfill: boolean;
}

export interface LessonWeightResult {
  weight: number;
  matchedCount: number;
  keyFrequencies: Record<string, number>;
}

interface CandidateLesson {
  lesson: Lesson;
  id: string;
  weight: number;
  matchedTargetKeys: string[];
}

/**
 * Returns a stable unique identifier for a lesson.
 * Falls back to composite attributes if id is absent or whitespace.
 */
export function getLessonIdentifier(lesson: Lesson): string {
  if (lesson.id && lesson.id.trim()) {
    return lesson.id.trim();
  }
  return `${lesson.mode || ''}::${lesson.difficulty || ''}::${lesson.display}::${lesson.answer}::${lesson.hint || ''}`;
}

/**
 * Counts non-overlapping occurrences of a substring within text.
 */
function countOccurrences(text: string, search: string): number {
  if (!search) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}

/**
 * Safely resolves the runtime typing answer for a lesson (fail-closed).
 * For Zhuyin, ensures 1st tone Space is present without double-spacing.
 */
function getPreparedAnswer(lesson: Lesson, mode: Mode): string {
  const prepared = prepareTypingLesson(lesson, mode);
  return prepared.answer;
}

/**
 * Pure function: Calculates selection weight for a single lesson based on target weak keys.
 * 
 * Formula:
 *   W(L) = 1.0 + Sum_{k in K(L) cap T} Priority(k) * Frequency(k, L)
 */
export function calculateLessonWeight(
  lesson: Lesson,
  targetWeakKeys: readonly RankedWeakKey[],
  mode: Mode
): LessonWeightResult {
  const answer = getPreparedAnswer(lesson, mode);
  const keyFrequencies: Record<string, number> = {};
  let prioritySum = 0;
  let matchedCount = 0;

  for (const wk of targetWeakKeys) {
    const key = wk.key;
    let freq = 0;
    if (mode === 'en' || mode === 'pinyin') {
      freq = countOccurrences(answer.toLowerCase(), key.toLowerCase());
    } else {
      freq = countOccurrences(answer, key);
    }

    if (freq > 0) {
      keyFrequencies[key] = freq;
      matchedCount++;
      prioritySum += wk.priority * freq;
    }
  }

  const weight = 1.0 + prioritySum;
  return {
    weight,
    matchedCount,
    keyFrequencies,
  };
}

/**
 * Performs weighted roulette-wheel selection on a pool of candidate lessons.
 */
function pickWeightedCandidate(
  pool: CandidateLesson[],
  rng: () => number,
  excludeId?: string
): CandidateLesson | null {
  if (pool.length === 0) return null;

  let eligible = pool;
  if (excludeId && pool.length > 1) {
    const nonExcluded = pool.filter((c) => c.id !== excludeId);
    if (nonExcluded.length > 0) {
      eligible = nonExcluded;
    }
  }

  let totalWeight = 0;
  for (const c of eligible) {
    totalWeight += c.weight;
  }

  if (totalWeight <= 0) {
    const idx = Math.floor(rng() * eligible.length);
    return eligible[idx];
  }

  const threshold = rng() * totalWeight;
  let acc = 0;
  for (const c of eligible) {
    acc += c.weight;
    if (acc >= threshold) {
      return c;
    }
  }
  return eligible[eligible.length - 1];
}

/**
 * Pure function: Dynamically generates an adaptive practice lesson sequence
 * using weighted sampling without replacement.
 * 
 * Strategy:
 *   1. Filter by Mode and Difficulty tier with strict metadata policy (FIX-03).
 *   2. Deduplicate candidate pool by unique lesson identity (FIX-01).
 *   3. Compute lesson weights using runtime derived answers (ADP-009).
 *   4. Stage 1: Ensure multi-key coverage (ADP-011) with strict boundary deduplication (FIX-02).
 *   5. Stage 2: Fill remaining quota via weighted sampling without replacement (ADP-010, ADP-012).
 *   6. Boundary deduplication: First lesson never matches previousLessonId when pool > 1 (ADP-013).
 */
export function generateAdaptiveLessons(
  options: AdaptiveSelectorOptions
): AdaptiveSelectionResult {
  const targetKeys = options.weakKeys.map((wk) => wk.key);

  let requestedCount = 10;
  if (options.count !== undefined) {
    if (!Number.isFinite(options.count) || Number.isNaN(options.count)) {
      requestedCount = 10;
    } else {
      requestedCount = Math.max(0, Math.floor(options.count));
    }
  }

  if (requestedCount === 0 || options.vocabulary.length === 0) {
    return {
      lessons: [],
      targetKeys,
      requestedCount,
      selectedCount: 0,
      matchedCount: 0,
      usedBackfill: false,
    };
  }

  // 1. Filter by Mode and Difficulty with strict metadata policy (FIX-03)
  const filteredPool = options.vocabulary.filter((lesson) => {
    const effectiveMode = lesson.mode ?? options.fallbackMetadata?.mode;
    const effectiveDifficulty = lesson.difficulty ?? options.fallbackMetadata?.difficulty;

    // Both mode and difficulty must be resolvable from lesson or explicit caller fallback
    if (!effectiveMode || !effectiveDifficulty) {
      return false;
    }

    // Strict matching against requested mode and difficulty
    return effectiveMode === options.mode && effectiveDifficulty === options.difficulty;
  });

  if (filteredPool.length === 0) {
    return {
      lessons: [],
      targetKeys,
      requestedCount,
      selectedCount: 0,
      matchedCount: 0,
      usedBackfill: false,
    };
  }

  // 2. Prepare candidates with deduplication by unique lesson identity (FIX-01)
  const seenCandidateIds = new Set<string>();
  const candidates: CandidateLesson[] = [];

  for (const lesson of filteredPool) {
    const id = getLessonIdentifier(lesson);
    if (seenCandidateIds.has(id)) {
      continue;
    }

    let preparedLesson: Lesson;
    let weightResult: LessonWeightResult;
    try {
      preparedLesson = prepareTypingLesson(lesson, options.mode);
      weightResult = calculateLessonWeight(preparedLesson, options.weakKeys, options.mode);
    } catch {
      // Malformed Zhuyin lesson fails fail-closed validation and is excluded from candidate pool
      continue;
    }

    seenCandidateIds.add(id);

    candidates.push({
      lesson: preparedLesson,
      id,
      weight: weightResult.weight,
      matchedTargetKeys: Object.keys(weightResult.keyFrequencies),
    });
  }

  const rng = options.seed !== undefined ? createRng(options.seed) : Math.random;
  let availableCandidates = [...candidates];
  const selected: Lesson[] = [];
  const selectedIds = new Set<string>();
  const coveredTargetKeys = new Set<string>();
  const deferredKeys: RankedWeakKey[] = [];

  const totalCandidateCount = candidates.length;
  const canExcludePrevious = options.previousLessonId !== undefined && totalCandidateCount > 1;

  // Helper to remove a candidate from available pool and add to selected
  const selectCandidate = (chosen: CandidateLesson) => {
    selected.push(chosen.lesson);
    selectedIds.add(chosen.id);
    for (const k of chosen.matchedTargetKeys) {
      coveredTargetKeys.add(k);
    }
    availableCandidates = availableCandidates.filter((c) => c.id !== chosen.id);
  };

  // 3. Stage 1: Multi-Key Coverage (ADP-011) with strict boundary deduplication (FIX-02)
  for (const wk of options.weakKeys) {
    if (selected.length >= requestedCount || availableCandidates.length === 0) {
      break;
    }

    if (coveredTargetKeys.has(wk.key)) {
      continue;
    }

    const matching = availableCandidates.filter((c) => c.matchedTargetKeys.includes(wk.key));
    if (matching.length === 0) {
      continue;
    }

    // If picking the very first lesson of the round and pool > 1, previousLessonId must be excluded
    if (selected.length === 0 && canExcludePrevious) {
      const nonPreviousMatching = matching.filter((c) => c.id !== options.previousLessonId);
      if (nonPreviousMatching.length > 0) {
        const chosen = pickWeightedCandidate(nonPreviousMatching, rng);
        if (chosen) {
          selectCandidate(chosen);
        }
      } else {
        // All matching candidates for this weak key match previousLessonId.
        // Boundary deduplication takes strict precedence over first-lesson targeting.
        // Defer this weak key until after the first lesson is selected!
        deferredKeys.push(wk);
      }
    } else {
      const chosen = pickWeightedCandidate(matching, rng);
      if (chosen) {
        selectCandidate(chosen);
      }
    }
  }

  // If Stage 1 could not pick any first lesson (e.g. all weak key matches were previousLessonId or no matches),
  // pick the first lesson from available candidates (excluding previousLessonId)
  if (selected.length === 0 && availableCandidates.length > 0 && requestedCount > 0) {
    const eligibleForFirst = canExcludePrevious
      ? availableCandidates.filter((c) => c.id !== options.previousLessonId)
      : availableCandidates;

    if (eligibleForFirst.length > 0) {
      const chosen = pickWeightedCandidate(eligibleForFirst, rng);
      if (chosen) {
        selectCandidate(chosen);
      }
    }
  }

  // Now selected.length > 0 (or no eligible candidates exist).
  // Process any deferred weak keys from Stage 1 (now previousLessonId is eligible for selection in slot 2+)
  for (const wk of deferredKeys) {
    if (selected.length >= requestedCount || availableCandidates.length === 0) {
      break;
    }

    if (coveredTargetKeys.has(wk.key)) {
      continue;
    }

    const matching = availableCandidates.filter((c) => c.matchedTargetKeys.includes(wk.key));
    if (matching.length > 0) {
      const chosen = pickWeightedCandidate(matching, rng);
      if (chosen) {
        selectCandidate(chosen);
      }
    }
  }

  // 4. Stage 2: Weighted Sampling for Remaining Slots (ADP-009, ADP-010, ADP-012)
  while (selected.length < requestedCount && availableCandidates.length > 0) {
    const chosen = pickWeightedCandidate(availableCandidates, rng);
    if (!chosen) {
      break;
    }
    selectCandidate(chosen);
  }

  // 5. Evaluate Metrics
  const matchedLessons = selected.filter(
    (l) => calculateLessonWeight(l, options.weakKeys, options.mode).matchedCount > 0
  );
  const matchedCount = matchedLessons.length;
  const usedBackfill =
    targetKeys.length > 0 && selected.some(
      (l) => calculateLessonWeight(l, options.weakKeys, options.mode).matchedCount === 0
    );

  return {
    lessons: selected,
    targetKeys,
    requestedCount,
    selectedCount: selected.length,
    matchedCount,
    usedBackfill,
  };
}
