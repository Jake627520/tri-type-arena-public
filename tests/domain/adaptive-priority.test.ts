import { describe, it, expect } from 'vitest';
import {
  rankWeakKeys,
  compareRankedKeys,
  QUANTIZATION_SCALE,
  AdaptivePriorityConfig,
  RankedWeakKey,
} from '../../src/domain/learning/adaptive-priority';
import { KeyAttempt } from '../../src/domain/learning/weak-keys';

describe('Adaptive Weak-Key Priority Engine (Phase 1)', () => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;
  const BASE_TIME = 1700000000000;

  // ADP-001: attempts = 9 excluded; 10 can be included
  it('ADP-001: Excludes keys with attempts < 10 and includes keys with attempts >= 10', () => {
    const attempts: Record<string, KeyAttempt> = {
      a: { attempts: 9, errors: 5, lastPracticed: BASE_TIME }, // 5/9 = 55.5% but attempts < 10
      b: { attempts: 10, errors: 2, lastPracticed: BASE_TIME }, // 2/10 = 20% and attempts = 10
    };

    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('b');
    expect(result[0].attempts).toBe(10);
    expect(result[0].errors).toBe(2);
  });

  // ADP-002: errorRate = 19% excluded; 20% included
  it('ADP-002: Excludes keys with errorRate < 20% and includes keys with errorRate >= 20%', () => {
    const attempts: Record<string, KeyAttempt> = {
      c: { attempts: 100, errors: 19, lastPracticed: BASE_TIME }, // 19% error rate
      d: { attempts: 100, errors: 20, lastPracticed: BASE_TIME }, // 20% error rate
    };

    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('d');
    expect(result[0].errorRate).toBe(0.2);
  });

  // ADP-003: exact formula: 0.60 * errorRate + 0.20 * normAttempts + 0.20 * recencyBonus
  it('ADP-003: Computes composite priority with exact 0.60 / 0.20 / 0.20 weighting', () => {
    // attempts = 25 -> normAttempts = 25/50 = 0.50
    // errors = 10 -> errorRate = 10/25 = 0.40
    // lastPracticed = BASE_TIME - 3.5 days -> recency = 1 - 3.5/7 = 0.50
    // expected priority = (0.60 * 0.40) + (0.20 * 0.50) + (0.20 * 0.50)
    //                   = 0.24 + 0.10 + 0.10 = 0.44
    const attempts: Record<string, KeyAttempt> = {
      k: { attempts: 25, errors: 10, lastPracticed: BASE_TIME - 3.5 * ONE_DAY },
    };

    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('k');
    expect(result[0].errorRate).toBeCloseTo(0.40, 6);
    expect(result[0].priority).toBeCloseTo(0.44, 6);
  });

  // ADP-004: tie-break: composite priority -> errorRate -> attempts -> key unicode asc
  it('ADP-004: Resolves ties deterministically with 6-decimal score quantization and strict transitivity', () => {
    // Both keys have exact same priority, errorRate, attempts, differing only by key string
    const attempts: Record<string, KeyAttempt> = {
      z: { attempts: 20, errors: 10, lastPracticed: BASE_TIME },
      a: { attempts: 20, errors: 10, lastPracticed: BASE_TIME },
      m: { attempts: 20, errors: 10, lastPracticed: BASE_TIME },
    };

    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result).toHaveLength(3);
    // Unicode code point ascending tie-break: 'a', 'm', 'z'
    expect(result.map((r) => r.key)).toEqual(['a', 'm', 'z']);

    // Tie-break by errorRate when priority ties within 1e-6
    // Key x: priority = 0.6*0.3 + 0.2*(30/50) + 0.2*1.0 = 0.18 + 0.12 + 0.20 = 0.50
    // Key y: priority = 0.6*0.4 + 0.2*(15/50) + 0.2*1.0 = 0.24 + 0.06 + 0.20 = 0.50
    // Priority ties (both 0.50), but Key y has higher errorRate (0.40 > 0.30)
    const tieAttempts: Record<string, KeyAttempt> = {
      x: { attempts: 30, errors: 9, lastPracticed: BASE_TIME }, // errorRate 0.30
      y: { attempts: 15, errors: 6, lastPracticed: BASE_TIME }, // errorRate 0.40
    };

    const tieResult = rankWeakKeys(tieAttempts, 'en', BASE_TIME);
    expect(tieResult[0].key).toBe('y');
    expect(tieResult[1].key).toBe('x');

    // Strict mathematical transitivity verification across close priority values:
    // Testing 3 keys with close priority values to confirm comparator transitivity:
    // If compare(A, B) <= 0 and compare(B, C) <= 0, then compare(A, C) <= 0
    const keyA: RankedWeakKey = { key: 'a', attempts: 20, errors: 8, errorRate: 0.40, lastPracticed: BASE_TIME, priority: 0.5000002 };
    const keyB: RankedWeakKey = { key: 'b', attempts: 20, errors: 6, errorRate: 0.30, lastPracticed: BASE_TIME, priority: 0.5000008 };
    const keyC: RankedWeakKey = { key: 'c', attempts: 20, errors: 5, errorRate: 0.25, lastPracticed: BASE_TIME, priority: 0.5000014 };

    const compAB = compareRankedKeys(keyA, keyB);
    const compBC = compareRankedKeys(keyB, keyC);
    const compAC = compareRankedKeys(keyA, keyC);

    // B and C quantize to same priority bucket (0.500001), where B has higher errorRate (0.30 > 0.25) => B ranks before C (compBC < 0)
    // A quantizes to 0.500000, which is lower than B's and C's bucket (compBA < 0, compCA < 0)
    expect(compAB > 0).toBe(true); // B before A
    expect(compBC < 0).toBe(true); // B before C
    expect(compAC > 0).toBe(true); // C before A

    // Permutation invariance: All 6 permutations of input order must sort to identical sequence [B, C, A]
    const permutations = [
      [keyA, keyB, keyC],
      [keyA, keyC, keyB],
      [keyB, keyA, keyC],
      [keyB, keyC, keyA],
      [keyC, keyA, keyB],
      [keyC, keyB, keyA],
    ];

    const expectedOrder = ['b', 'c', 'a'];
    for (const perm of permutations) {
      const sorted = [...perm].sort(compareRankedKeys);
      expect(sorted.map((k) => k.key)).toEqual(expectedOrder);
    }
  });

  // ADP-005: Zhuyin Space (' ') can qualify as weak key
  it('ADP-005: Qualifies Zhuyin physical Space key (" ") as an eligible weak key', () => {
    const attempts: Record<string, KeyAttempt> = {
      ' ': { attempts: 40, errors: 15, lastPracticed: BASE_TIME },
      j: { attempts: 20, errors: 5, lastPracticed: BASE_TIME },
    };

    const result = rankWeakKeys(attempts, 'zhuyin', BASE_TIME);
    const spaceKey = result.find((r) => r.key === ' ');
    expect(spaceKey).toBeDefined();
    expect(spaceKey?.attempts).toBe(40);
    expect(spaceKey?.errors).toBe(15);
  });

  // ADP-006: Phase 1 pure function operates on single-mode input; storage isolation verified in integration phase
  it('ADP-006 (Phase 1 Pure Function): Correctly ranks provided single-mode key attempts (Storage-level mode isolation verified in subsequent integration phases)', () => {
    // Phase 1 scope: Pure function operates exclusively on the provided attempts dictionary for the specified mode.
    // Full storage isolation (tritype.weakkeys.v1.${mode}) is verified during subsequent storage/lifecycle integration phases.
    const zhuyinAttempts: Record<string, KeyAttempt> = {
      'ㄐ': { attempts: 30, errors: 10, lastPracticed: BASE_TIME },
    };

    const result = rankWeakKeys(zhuyinAttempts, 'zhuyin', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('ㄐ');
  });

  // ADP-007: Phase 1 pure function processes pre-aggregated attempts; difficulty sharing verified in integration phase
  it('ADP-007 (Phase 1 Pure Function): Correctly ranks pre-aggregated key attempts without difficulty bias (Storage-level cross-difficulty aggregation verified in subsequent integration phases)', () => {
    // Phase 1 scope: Pure function evaluates aggregated attempt statistics without requiring difficulty tier context.
    // Cross-difficulty aggregation in storage (tritype.weakkeys.v1.${mode} shared across beginner/intermediate/advanced)
    // is an integration invariant verified in subsequent phases.
    const combinedAttempts: Record<string, KeyAttempt> = {
      e: { attempts: 50, errors: 25, lastPracticed: BASE_TIME }, // beginner + intermediate + advanced
    };

    const result = rankWeakKeys(combinedAttempts, 'en', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].attempts).toBe(50);
    expect(result[0].errors).toBe(25);
  });

  // ADP-008: empty record returns empty array
  it('ADP-008: Returns an empty array when given an empty attempts map', () => {
    const result = rankWeakKeys({}, 'en', BASE_TIME);
    expect(result).toEqual([]);
  });

  // ADP-009: attempts = 0 no divide-by-zero error
  it('ADP-009: Handles zero attempts safely without divide-by-zero or NaN output', () => {
    const attempts: Record<string, KeyAttempt> = {
      zero: { attempts: 0, errors: 0, lastPracticed: BASE_TIME },
    };

    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result).toEqual([]);
  });

  // ADP-010: expired lastPracticed (> 7 days) -> recencyBonus = 0
  it('ADP-010: Computes recencyBonus as 0 for sessions older than 7 days', () => {
    // 8 days ago
    const attempts: Record<string, KeyAttempt> = {
      old: { attempts: 50, errors: 20, lastPracticed: BASE_TIME - 8 * ONE_DAY },
    };

    // attempts = 50 -> normAttempts = 1.0 (0.20 * 1.0 = 0.20)
    // errorRate = 20/50 = 0.40 (0.60 * 0.40 = 0.24)
    // recency = 0 (0.20 * 0 = 0)
    // expected priority = 0.24 + 0.20 + 0 = 0.44
    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result[0].priority).toBeCloseTo(0.44, 6);
  });

  // ADP-011: future lastPracticed (> now) -> recencyBonus <= 1 (clamped)
  it('ADP-011: Clamps recencyBonus to maximum 1.0 when lastPracticed is in the future', () => {
    const attempts: Record<string, KeyAttempt> = {
      future: { attempts: 50, errors: 20, lastPracticed: BASE_TIME + 2 * ONE_DAY },
    };

    // normAttempts = 1.0 (0.20)
    // errorRate = 0.40 (0.24)
    // recency clamped at 1.0 (0.20 * 1.0 = 0.20)
    // expected priority = 0.24 + 0.20 + 0.20 = 0.64
    const result = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(result[0].priority).toBeCloseTo(0.64, 6);
  });

  // ADP-012: fixed now produces deterministic results
  it('ADP-012: Produces completely deterministic results with identical now and inputs', () => {
    const attempts: Record<string, KeyAttempt> = {
      k1: { attempts: 20, errors: 8, lastPracticed: BASE_TIME - ONE_DAY },
      k2: { attempts: 30, errors: 9, lastPracticed: BASE_TIME - 2 * ONE_DAY },
    };

    const run1 = rankWeakKeys(attempts, 'en', BASE_TIME);
    const run2 = rankWeakKeys(attempts, 'en', BASE_TIME);

    expect(run1).toEqual(run2);
  });

  // ADP-013: input object is not mutated
  it('ADP-013: Preserves immutability and never mutates the input attempts map', () => {
    const attempts: Record<string, KeyAttempt> = Object.freeze({
      immutable: Object.freeze({ attempts: 20, errors: 10, lastPracticed: BASE_TIME }),
    }) as any;

    expect(() => rankWeakKeys(attempts, 'en', BASE_TIME)).not.toThrow();
  });

  // ADP-014: at most 5 keys returned by default (configurable via maxWeakKeys)
  it('ADP-014: Returns at most 5 keys by default and respects custom maxWeakKeys limit', () => {
    const attempts: Record<string, KeyAttempt> = {};
    for (let i = 0; i < 10; i++) {
      const char = String.fromCharCode(97 + i); // a..j
      attempts[char] = { attempts: 20, errors: 10 + i, lastPracticed: BASE_TIME };
    }

    const defaultResult = rankWeakKeys(attempts, 'en', BASE_TIME);
    expect(defaultResult).toHaveLength(5);

    const customResult = rankWeakKeys(attempts, 'en', BASE_TIME, { maxWeakKeys: 3 });
    expect(customResult).toHaveLength(3);

    const unlimitedResult = rankWeakKeys(attempts, 'en', BASE_TIME, { maxWeakKeys: 10 });
    expect(unlimitedResult).toHaveLength(10);
  });

  // ADP-015: invalid numbers do not pollute output
  it('ADP-015: Rejects or safely sanitizes invalid inputs (negative, NaN, Infinity, errors > attempts)', () => {
    const malformedAttempts: Record<string, KeyAttempt> = {
      negAttempts: { attempts: -10, errors: 5, lastPracticed: BASE_TIME },
      negErrors: { attempts: 20, errors: -5, lastPracticed: BASE_TIME },
      nanAttempts: { attempts: NaN, errors: 5, lastPracticed: BASE_TIME },
      infAttempts: { attempts: Infinity, errors: 5, lastPracticed: BASE_TIME },
      errorsExceed: { attempts: 10, errors: 20, lastPracticed: BASE_TIME }, // errors > attempts
      invalidTime: { attempts: 20, errors: 10, lastPracticed: NaN },
      valid: { attempts: 20, errors: 10, lastPracticed: BASE_TIME },
    };

    const result = rankWeakKeys(malformedAttempts, 'en', BASE_TIME);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('valid');
    expect(Number.isFinite(result[0].priority)).toBe(true);
    expect(Number.isNaN(result[0].priority)).toBe(false);

    // Negative maxWeakKeys fallback
    const fallbackResult = rankWeakKeys(malformedAttempts, 'en', BASE_TIME, { maxWeakKeys: -1 });
    expect(fallbackResult).toEqual([]);
  });
});
