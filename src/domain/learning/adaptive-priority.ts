import { Mode } from '../types';
import { KeyAttempt } from './weak-keys';

export interface AdaptivePriorityConfig {
  minAttempts: number;
  minErrorRate: number;
  maxWeakKeys: number;
}

export interface RankedWeakKey {
  key: string;
  attempts: number;
  errors: number;
  errorRate: number;
  lastPracticed: number;
  priority: number;
}

export const DEFAULT_ADAPTIVE_PRIORITY_CONFIG: AdaptivePriorityConfig = {
  minAttempts: 10,
  minErrorRate: 0.2,
  maxWeakKeys: 5,
};

export const QUANTIZATION_SCALE = 1_000_000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Strict transitive comparator for ranked weak keys.
 *
 * To guarantee mathematical transitivity and eliminate non-transitive comparison
 * cycles in standard sorting algorithms (e.g. Timsort) when three or more candidate
 * keys have close floating point scores, composite priority and error rate are mapped
 * into 6-decimal quantized integer equivalence classes (round(score * 1_000_000)).
 *
 * Total ordering hierarchy:
 *   1. Quantized composite priority score (descending)
 *   2. Quantized error rate (descending)
 *   3. Keystroke attempts (descending)
 *   4. Key Unicode code point (ascending, locale-independent)
 */
export function compareRankedKeys(a: RankedWeakKey, b: RankedWeakKey): number {
  // 1. Quantized Priority descending
  const aPriorityQ = Math.round(a.priority * QUANTIZATION_SCALE);
  const bPriorityQ = Math.round(b.priority * QUANTIZATION_SCALE);
  if (bPriorityQ !== aPriorityQ) {
    return bPriorityQ - aPriorityQ;
  }

  // 2. Quantized Error Rate descending
  const aErrorRateQ = Math.round(a.errorRate * QUANTIZATION_SCALE);
  const bErrorRateQ = Math.round(b.errorRate * QUANTIZATION_SCALE);
  if (bErrorRateQ !== aErrorRateQ) {
    return bErrorRateQ - aErrorRateQ;
  }

  // 3. Keystroke attempts descending
  if (b.attempts !== a.attempts) {
    return b.attempts - a.attempts;
  }

  // 4. Unicode code point ascending (locale-independent)
  if (a.key < b.key) return -1;
  if (a.key > b.key) return 1;
  return 0;
}

/**
 * Pure function: Ranks confirmed weak keys using composite priority score.
 * 
 * Formula:
 *   Priority = 0.60 * ErrorRate + 0.20 * NormAttempts + 0.20 * RecencyBonus
 * 
 * Filtering:
 *   attempts >= minAttempts (default 10)
 *   errorRate >= minErrorRate (default 0.20)
 * 
 * Sorting:
 *   Uses `compareRankedKeys` ensuring strict transitivity and deterministic total order.
 */
export function rankWeakKeys(
  attempts: Readonly<Record<string, KeyAttempt>>,
  _mode: Mode,
  now: number,
  config?: Partial<AdaptivePriorityConfig>
): RankedWeakKey[] {
  if (!Number.isFinite(now)) {
    return [];
  }

  const effectiveConfig: AdaptivePriorityConfig = {
    minAttempts: config?.minAttempts ?? DEFAULT_ADAPTIVE_PRIORITY_CONFIG.minAttempts,
    minErrorRate: config?.minErrorRate ?? DEFAULT_ADAPTIVE_PRIORITY_CONFIG.minErrorRate,
    maxWeakKeys: config?.maxWeakKeys ?? DEFAULT_ADAPTIVE_PRIORITY_CONFIG.maxWeakKeys,
  };

  if (!Number.isFinite(effectiveConfig.maxWeakKeys) || effectiveConfig.maxWeakKeys <= 0) {
    return [];
  }

  const candidates: RankedWeakKey[] = [];

  for (const [key, stat] of Object.entries(attempts)) {
    if (!stat || typeof stat !== 'object') {
      continue;
    }

    const { attempts: keyAttempts, errors, lastPracticed } = stat;

    // Validate finite numbers
    if (
      !Number.isFinite(keyAttempts) ||
      !Number.isFinite(errors) ||
      !Number.isFinite(lastPracticed)
    ) {
      continue;
    }

    // Validate boundaries
    if (keyAttempts <= 0 || errors < 0 || errors > keyAttempts) {
      continue;
    }

    // Eligibility check
    if (keyAttempts < effectiveConfig.minAttempts) {
      continue;
    }

    const errorRate = errors / keyAttempts;
    if (errorRate < effectiveConfig.minErrorRate) {
      continue;
    }

    // Normalized attempts: min(1.0, attempts / 50)
    const normAttempts = Math.min(1.0, keyAttempts / 50);

    // Recency bonus: max(0, 1 - (now - lastPracticed) / 7 days)
    // If lastPracticed is in the future (> now), clamp bonus to 1.0
    let recencyBonus: number;
    if (lastPracticed >= now) {
      recencyBonus = 1.0;
    } else {
      recencyBonus = Math.max(0, 1.0 - (now - lastPracticed) / SEVEN_DAYS_MS);
    }

    const priority = 0.60 * errorRate + 0.20 * normAttempts + 0.20 * recencyBonus;

    if (!Number.isFinite(priority) || Number.isNaN(priority)) {
      continue;
    }

    candidates.push({
      key,
      attempts: keyAttempts,
      errors,
      errorRate,
      lastPracticed,
      priority,
    });
  }

  candidates.sort(compareRankedKeys);

  return candidates.slice(0, effectiveConfig.maxWeakKeys);
}
