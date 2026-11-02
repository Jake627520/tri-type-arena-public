import { Difficulty, Mode } from '../types';
import { KeyAttempt } from './weak-keys';

export type AdaptiveLifecycleStatus =
  | 'IDLE'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';

export type AdaptiveLifecycleAction =
  | { type: 'PREPARE' }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'ABANDON' }
  | { type: 'RESTART' }
  | { type: 'RESET' };

export interface AdaptiveKeyBaseline {
  key: string;
  attempts: number;
  errors: number;
  errorRate: number | null;
  capturedAt: number;
  isValid: boolean;
}

export interface AdaptiveBaseline {
  capturedAt: number;
  keys: Readonly<Record<string, AdaptiveKeyBaseline>>;
}

export interface AdaptiveKeyPracticeStat {
  key: string;
  attempts: number;
  errors: number;
  errorRate: number | null;
}

export type AdaptiveImprovementStatus =
  | 'IMPROVED'
  | 'REGRESSED'
  | 'UNCHANGED'
  | 'INSUFFICIENT_DATA'
  | 'NO_BASELINE';

export interface AdaptiveKeyProgress {
  key: string;
  baseline: AdaptiveKeyBaseline;
  practice: AdaptiveKeyPracticeStat;
  deltaPP: number | null;
  status: AdaptiveImprovementStatus;
  label: string;
}

export interface AdaptiveSessionSummary {
  sessionId: string;
  mode: Mode;
  difficulty: Difficulty;
  targetKeys: readonly string[];
  baseline: AdaptiveBaseline;
  practiceStats: Record<string, AdaptiveKeyPracticeStat>;
  progress: Record<string, AdaptiveKeyProgress>;
  lifecycleStatus: AdaptiveLifecycleStatus;
  startedAt: number | null;
  completedAt: number | null;
  durationSeconds: number;
  totalKeys: number;
  correctKeys: number;
  errors: number;
  wpm: number;
  accuracy: number;
  isCompleted: boolean;
}

export const MIN_BASELINE_ATTEMPTS = 10;
export const MIN_PRACTICE_ATTEMPTS = 5;
export const NON_CAUSAL_PROGRESS_LABEL = 'Observed Session Change';

/**
 * Pure function: Transitions adaptive session lifecycle status.
 *
 * State flow:
 *   IDLE -> (PREPARE) -> READY
 *   READY -> (START) -> RUNNING
 *   RUNNING -> (PAUSE) -> PAUSED
 *   PAUSED -> (RESUME) -> RUNNING
 *   RUNNING -> (COMPLETE) -> COMPLETED
 *   READY | RUNNING | PAUSED -> (ABANDON) -> ABANDONED
 *   RUNNING | PAUSED | COMPLETED | ABANDONED -> (RESTART) -> READY
 *   ANY -> (RESET) -> IDLE
 */
export function transitionAdaptiveLifecycle(
  current: AdaptiveLifecycleStatus,
  action: AdaptiveLifecycleAction
): AdaptiveLifecycleStatus {
  switch (action.type) {
    case 'PREPARE':
      if (current === 'IDLE' || current === 'COMPLETED' || current === 'ABANDONED') {
        return 'READY';
      }
      return current;

    case 'START':
      if (current === 'READY' || current === 'IDLE') {
        return 'RUNNING';
      }
      return current;

    case 'PAUSE':
      if (current === 'RUNNING') {
        return 'PAUSED';
      }
      return current;

    case 'RESUME':
      if (current === 'PAUSED') {
        return 'RUNNING';
      }
      return current;

    case 'COMPLETE':
      if (current === 'RUNNING') {
        return 'COMPLETED';
      }
      return current;

    case 'ABANDON':
      if (current === 'READY' || current === 'RUNNING' || current === 'PAUSED') {
        return 'ABANDONED';
      }
      return current;

    case 'RESTART':
      if (current !== 'IDLE') {
        return 'READY';
      }
      return current;

    case 'RESET':
      return 'IDLE';

    default:
      return current;
  }
}

/**
 * Helper to validate positive integer counts.
 */
function isValidCount(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && Number.isInteger(val) && val >= 0;
}

/**
 * Pure function: Captures an immutable snapshot of historical key stats.
 * Does NOT call Date.now() or read LocalStorage.
 *
 * Rules (ADP-024, FIX-03):
 * - If target key has history with >= 10 attempts and valid integer counts (errors <= attempts), baseline is valid and errorRate is computed.
 * - Rejects NaN, Infinity, negative counts, non-integers, and errors > attempts.
 * - If target key has < 10 attempts, invalid data, or no history, errorRate is null and isValid is false.
 * - All numerical stats are frozen and immutable.
 */
export function createAdaptiveBaseline(
  historicalAttempts: Readonly<Record<string, KeyAttempt>> | undefined,
  targetKeys: readonly string[],
  capturedAt: number
): AdaptiveBaseline {
  const safeCapturedAt = Number.isFinite(capturedAt) ? capturedAt : 0;
  const keys: Record<string, AdaptiveKeyBaseline> = {};

  for (const key of targetKeys) {
    const record = historicalAttempts?.[key];
    const isAttemptsValid = isValidCount(record?.attempts);
    const isErrorsValid = isValidCount(record?.errors);

    if (
      record &&
      isAttemptsValid &&
      isErrorsValid &&
      record.errors <= record.attempts &&
      record.attempts >= MIN_BASELINE_ATTEMPTS
    ) {
      const attempts = record.attempts;
      const errors = record.errors;
      const errorRate = attempts > 0 ? errors / attempts : null;
      keys[key] = Object.freeze({
        key,
        attempts,
        errors,
        errorRate,
        capturedAt: safeCapturedAt,
        isValid: true,
      });
    } else if (
      record &&
      isAttemptsValid &&
      isErrorsValid &&
      record.errors <= record.attempts &&
      record.attempts > 0
    ) {
      // Valid counts but under minimum threshold of 10 attempts
      keys[key] = Object.freeze({
        key,
        attempts: record.attempts,
        errors: record.errors,
        errorRate: null,
        capturedAt: safeCapturedAt,
        isValid: false,
      });
    } else {
      // Malformed, negative, NaN, Infinity, errors > attempts, or missing
      keys[key] = Object.freeze({
        key,
        attempts: 0,
        errors: 0,
        errorRate: null,
        capturedAt: safeCapturedAt,
        isValid: false,
      });
    }
  }

  return Object.freeze({
    capturedAt: safeCapturedAt,
    keys: Object.freeze(keys),
  });
}

/**
 * Pure function: Extracts target key stats directly from active session keyAttempts.
 * Does NOT maintain a duplicate counter (ADP-025, FIX-03).
 *
 * Rules:
 * - Rejects NaN, Infinity, negative counts, non-integers, and errors > attempts.
 * - When attempts = 0 or data is malformed, errorRate MUST be null (never NaN, Infinity, or false 0%).
 */
export function extractPracticeStats(
  sessionKeyAttempts: Readonly<Record<string, { attempts: number; errors: number }>> | undefined,
  targetKeys: readonly string[]
): Record<string, AdaptiveKeyPracticeStat> {
  const result: Record<string, AdaptiveKeyPracticeStat> = {};

  for (const key of targetKeys) {
    const record = sessionKeyAttempts?.[key];
    const isAttemptsValid = isValidCount(record?.attempts);
    const isErrorsValid = isValidCount(record?.errors);

    if (
      record &&
      isAttemptsValid &&
      isErrorsValid &&
      record.errors <= record.attempts &&
      record.attempts > 0
    ) {
      const attempts = record.attempts;
      const errors = record.errors;
      const errorRate = errors / attempts;
      result[key] = {
        key,
        attempts,
        errors,
        errorRate,
      };
    } else {
      result[key] = {
        key,
        attempts: 0,
        errors: 0,
        errorRate: null,
      };
    }
  }

  return result;
}

/**
 * Pure function: Calculates observed improvement delta in percentage points (ADP-026, ADP-027, ADP-028, FIX-03).
 *
 * Formula:
 *   deltaPP = (baselineErrorRate - practiceErrorRate) * 100
 *
 * Constraints:
 * - Minimum 5 practice attempts required. If practice.attempts < 5 or errorRate is null -> 'INSUFFICIENT_DATA', deltaPP: null.
 * - Practice errorRate of null is NEVER automatically treated as 0%.
 * - Minimum 10 baseline attempts required. If !baseline.isValid -> 'NO_BASELINE', deltaPP: null.
 * - Rejects any NaN or Infinity calculations.
 * - Non-causal observation label enforced.
 */
export function calculateKeyProgress(
  baseline: AdaptiveKeyBaseline,
  practice: AdaptiveKeyPracticeStat
): AdaptiveKeyProgress {
  const label = NON_CAUSAL_PROGRESS_LABEL;

  // 1. Practice validation: must have valid non-null errorRate in [0, 1] and >= 5 attempts
  if (
    practice.errorRate === null ||
    !Number.isFinite(practice.errorRate) ||
    practice.errorRate < 0 ||
    practice.errorRate > 1 ||
    practice.attempts < MIN_PRACTICE_ATTEMPTS
  ) {
    return {
      key: baseline.key,
      baseline,
      practice,
      deltaPP: null,
      status: 'INSUFFICIENT_DATA',
      label,
    };
  }

  // 2. Baseline validation: must be valid, non-null errorRate in [0, 1], and >= 10 attempts
  if (
    !baseline.isValid ||
    baseline.errorRate === null ||
    !Number.isFinite(baseline.errorRate) ||
    baseline.errorRate < 0 ||
    baseline.errorRate > 1 ||
    baseline.attempts < MIN_BASELINE_ATTEMPTS
  ) {
    return {
      key: baseline.key,
      baseline,
      practice,
      deltaPP: null,
      status: 'NO_BASELINE',
      label,
    };
  }

  const baselineErrorRate = baseline.errorRate;
  const practiceErrorRate = practice.errorRate;

  // Delta: positive means improvement (error rate decreased)
  const rawDelta = (baselineErrorRate - practiceErrorRate) * 100;
  if (!Number.isFinite(rawDelta)) {
    return {
      key: baseline.key,
      baseline,
      practice,
      deltaPP: null,
      status: 'INSUFFICIENT_DATA',
      label,
    };
  }

  const deltaPP = Math.round(rawDelta * 10) / 10;

  let status: AdaptiveImprovementStatus = 'UNCHANGED';
  if (deltaPP > 0) {
    status = 'IMPROVED';
  } else if (deltaPP < 0) {
    status = 'REGRESSED';
  }

  return {
    key: baseline.key,
    baseline,
    practice,
    deltaPP,
    status,
    label,
  };
}

/**
 * Pure function: Compiles full session summary contract.
 */
export function compileAdaptiveSessionSummary(options: {
  sessionId: string;
  mode: Mode;
  difficulty: Difficulty;
  targetKeys: readonly string[];
  baseline: AdaptiveBaseline;
  sessionKeyAttempts: Readonly<Record<string, { attempts: number; errors: number }>> | undefined;
  lifecycleStatus: AdaptiveLifecycleStatus;
  startedAt: number | null;
  completedAt: number | null;
  durationSeconds: number;
  totalKeys: number;
  correctKeys: number;
  errors: number;
  wpm: number;
  accuracy: number;
}): AdaptiveSessionSummary {
  const practiceStats = extractPracticeStats(options.sessionKeyAttempts, options.targetKeys);
  const progress: Record<string, AdaptiveKeyProgress> = {};

  for (const key of options.targetKeys) {
    const b = options.baseline.keys[key] || {
      key,
      attempts: 0,
      errors: 0,
      errorRate: null,
      capturedAt: options.baseline.capturedAt,
      isValid: false,
    };
    const p = practiceStats[key];
    progress[key] = calculateKeyProgress(b, p);
  }

  const isCompleted = options.lifecycleStatus === 'COMPLETED';

  return {
    sessionId: options.sessionId,
    mode: options.mode,
    difficulty: options.difficulty,
    targetKeys: options.targetKeys,
    baseline: options.baseline,
    practiceStats,
    progress,
    lifecycleStatus: options.lifecycleStatus,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    durationSeconds: options.durationSeconds,
    totalKeys: options.totalKeys,
    correctKeys: options.correctKeys,
    errors: options.errors,
    wpm: options.wpm,
    accuracy: options.accuracy,
    isCompleted,
  };
}
