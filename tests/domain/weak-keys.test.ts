import { describe, it, expect } from 'vitest';
import {
  analyzeWeakKeys,
  mapZhuyinSymbolToKey,
  KeyAttempt,
  DEFAULT_WEAK_KEY_CONFIG,
  saveWeakKeyStats,
} from '../../src/domain/learning/weak-keys';

describe('WEAK: Weak-Key Analysis Engine (FR-005)', () => {
  it('WEAK-001: Correctly aggregates attempts and errors', () => {
    const attempts: Record<string, KeyAttempt> = {
      a: { attempts: 20, errors: 5, lastPracticed: 1000 },
      b: { attempts: 15, errors: 0, lastPracticed: 1000 },
    };

    const stats = analyzeWeakKeys(attempts, 'en');
    const aStat = stats.find((s) => s.key === 'a')!;
    const bStat = stats.find((s) => s.key === 'b')!;

    expect(aStat.attempts).toBe(20);
    expect(aStat.errors).toBe(5);
    expect(bStat.attempts).toBe(15);
    expect(bStat.errors).toBe(0);
  });

  it('WEAK-002: Error rate calculations are accurate', () => {
    const attempts: Record<string, KeyAttempt> = {
      x: { attempts: 20, errors: 6, lastPracticed: 1000 }, // 30% error rate
    };

    const stats = analyzeWeakKeys(attempts, 'en');
    expect(stats[0].errorRate).toBeCloseTo(0.3, 4);
    expect(stats[0].isWeak).toBe(true);
  });

  it('WEAK-003: Insufficient attempts (< 10) do not classify as weak even with 100% error rate', () => {
    const attempts: Record<string, KeyAttempt> = {
      z: { attempts: 3, errors: 3, lastPracticed: 1000 }, // 100% error rate, but only 3 attempts
    };

    const stats = analyzeWeakKeys(attempts, 'en');
    expect(stats[0].insufficientData).toBe(true);
    expect(stats[0].isWeak).toBe(false);
  });

  it('WEAK-004: Zhuyin correctly maps phonetic symbols to physical keys', () => {
    // ㄜ maps to physical key 'k' in Daqian layout
    expect(mapZhuyinSymbolToKey('ㄜ')).toBe('k');
    // ㄋ maps to 's'
    expect(mapZhuyinSymbolToKey('ㄋ')).toBe('s');
    // ˊ (tone 2) maps to '6'
    expect(mapZhuyinSymbolToKey('ˊ')).toBe('6');

    const zhuyinAttempts: Record<string, KeyAttempt> = {
      ㄜ: { attempts: 12, errors: 4, lastPracticed: 1000 },
    };
    const stats = analyzeWeakKeys(zhuyinAttempts, 'zhuyin');
    expect(stats[0].key).toBe('ㄜ');
    expect(stats[0].physicalKey).toBe('k');
  });

  it('WEAK-005: Data stays independent across modes', () => {
    const enAttempts: Record<string, KeyAttempt> = {
      a: { attempts: 20, errors: 8, lastPracticed: 1000 },
    };
    const zhuyinAttempts: Record<string, KeyAttempt> = {
      a: { attempts: 15, errors: 0, lastPracticed: 1000 }, // in zhuyin 'a' maps to ㄇ
    };

    const enStats = analyzeWeakKeys(enAttempts, 'en');
    const zhStats = analyzeWeakKeys(zhuyinAttempts, 'zhuyin');

    expect(enStats[0].isWeak).toBe(true);
    expect(zhStats[0].isWeak).toBe(false);
  });

  it('WEAK-006: Sorting is deterministic (primary: errorRate desc, secondary: errors desc)', () => {
    const attempts: Record<string, KeyAttempt> = {
      k1: { attempts: 20, errors: 8, lastPracticed: 1000 }, // 40%
      k2: { attempts: 20, errors: 10, lastPracticed: 1000 }, // 50%
      k3: { attempts: 10, errors: 4, lastPracticed: 1000 }, // 40% (same error rate as k1, but fewer errors)
    };

    const stats = analyzeWeakKeys(attempts, 'en');
    expect(stats.map((s) => s.key)).toEqual(['k2', 'k1', 'k3']);
  });

  it('WEAK-007: Thresholds are configurable via WeakKeyConfig', () => {
    const attempts: Record<string, KeyAttempt> = {
      custom: { attempts: 5, errors: 1, lastPracticed: 1000 }, // 20% error rate, 5 attempts
    };

    // Default: minAttempts 10 -> not weak
    const defaultStats = analyzeWeakKeys(attempts, 'en', DEFAULT_WEAK_KEY_CONFIG);
    expect(defaultStats[0].isWeak).toBe(false);

    // Custom config: minAttempts 5, minErrorRate 0.15 -> weak
    const customStats = analyzeWeakKeys(attempts, 'en', { minAttempts: 5, minErrorRate: 0.15 });
    expect(customStats[0].isWeak).toBe(true);
  });

  describe('FIX-05: Legacy Weak-Key Storage Fail-Closed & Overwrite Prevention', () => {
    it('fails closed and does NOT overwrite when storage has malformed JSON', () => {
      const malformed = '{"corrupted": true, broken';
      localStorage.setItem('tritype.weakkeys.v1.en', malformed);

      const ok = saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 1000 } });
      expect(ok).toBe(false);
      // Raw string must not be overwritten
      expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(malformed);
    });

    it('fails closed and does NOT overwrite when storage root is non-object (e.g. array)', () => {
      const nonObject = JSON.stringify(['not', 'an', 'object']);
      localStorage.setItem('tritype.weakkeys.v1.en', nonObject);

      const ok = saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 1000 } });
      expect(ok).toBe(false);
      expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(nonObject);
    });

    it('returns false when setItem throws QuotaExceededError', () => {
      const err = new Error('Quota exceeded');
      err.name = 'QuotaExceededError';
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {
        throw err;
      };

      try {
        const ok = saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 1000 } });
        expect(ok).toBe(false);
      } finally {
        localStorage.setItem = originalSetItem;
      }
    });

    describe('Validation of KeyAttempt objects (Safety & Non-corruption)', () => {
      const validHistory = JSON.stringify({
        a: { attempts: 10, errors: 2, lastPracticed: 1000 },
      });

      it('rejects new attempt with NaN, Infinity, or negative attempts and does not overwrite valid history', () => {
        localStorage.setItem('tritype.weakkeys.v1.en', validHistory);

        // NaN attempts
        expect(saveWeakKeyStats('en', { a: { attempts: NaN, errors: 0, lastPracticed: 1000 } as any })).toBe(false);
        // Infinity attempts
        expect(saveWeakKeyStats('en', { a: { attempts: Infinity, errors: 0, lastPracticed: 1000 } as any })).toBe(false);
        // Negative attempts
        expect(saveWeakKeyStats('en', { a: { attempts: -1, errors: 0, lastPracticed: 1000 } as any })).toBe(false);

        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(validHistory);
      });

      it('rejects new attempt where errors > attempts or errors is negative/NaN', () => {
        localStorage.setItem('tritype.weakkeys.v1.en', validHistory);

        // errors > attempts
        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: 6, lastPracticed: 1000 } })).toBe(false);
        // negative errors
        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: -1, lastPracticed: 1000 } as any })).toBe(false);
        // NaN errors
        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: NaN, lastPracticed: 1000 } as any })).toBe(false);

        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(validHistory);
      });

      it('rejects new attempt where lastPracticed is invalid (NaN, negative, non-number)', () => {
        localStorage.setItem('tritype.weakkeys.v1.en', validHistory);

        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: NaN } as any })).toBe(false);
        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: -100 } as any })).toBe(false);
        expect(saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 'invalid' as any } as any })).toBe(false);

        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(validHistory);
      });

      it('fails closed when existing stored records contain invalid/corrupted KeyAttempt entries', () => {
        const corruptedExisting = JSON.stringify({
          a: { attempts: 'invalid', errors: 2, lastPracticed: 1000 },
        });
        localStorage.setItem('tritype.weakkeys.v1.en', corruptedExisting);

        const ok = saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 2000 } });
        expect(ok).toBe(false);
        // Must fail closed without writing NaN or overwriting
        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(corruptedExisting);
      });

      it('fails closed when existing stored records have errors > attempts', () => {
        const corruptedExisting = JSON.stringify({
          a: { attempts: 5, errors: 10, lastPracticed: 1000 },
        });
        localStorage.setItem('tritype.weakkeys.v1.en', corruptedExisting);

        const ok = saveWeakKeyStats('en', { a: { attempts: 5, errors: 1, lastPracticed: 2000 } });
        expect(ok).toBe(false);
        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(corruptedExisting);
      });

      it('fails closed when newAttempts itself is not an object or entry is malformed', () => {
        localStorage.setItem('tritype.weakkeys.v1.en', validHistory);

        expect(saveWeakKeyStats('en', null as any)).toBe(false);
        expect(saveWeakKeyStats('en', undefined as any)).toBe(false);
        expect(saveWeakKeyStats('en', { a: null as any })).toBe(false);
        expect(saveWeakKeyStats('en', { a: 'not an object' as any })).toBe(false);

        expect(localStorage.getItem('tritype.weakkeys.v1.en')).toBe(validHistory);
      });
    });
  });
});
