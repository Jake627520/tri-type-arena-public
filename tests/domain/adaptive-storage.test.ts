import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ADAPTIVE_STORAGE_KEY,
  MAX_ADAPTIVE_SESSIONS,
  AdaptiveSessionRecord,
  isValidAdaptiveSessionRecord,
  loadAdaptiveSessions,
  saveAdaptiveSession,
  clearAdaptiveSessions,
  adaptSummaryToRecord,
  generateAdaptiveSessionId,
  readAdaptiveSessionsStrict,
  AdaptiveStorageReadResult,
} from '../../src/domain/learning/adaptive-storage';
import {
  AdaptiveSessionSummary,
  compileAdaptiveSessionSummary,
  createAdaptiveBaseline,
} from '../../src/domain/learning/adaptive-progress';
import { useTypingSession } from '../../src/features/typing/useTypingSession';
import {
  loadLearningHistory,
  saveCompletedSession,
  loadBestRecords,
  saveBestRecord,
  clearLearningHistory,
} from '../../src/shared/storage';
import { createMockClock } from '../../src/domain/clock';

describe('Phase 5: Persistent Storage & Compatibility (ADP-032..036)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const createSampleRecord = (overrides: Partial<AdaptiveSessionRecord> = {}): AdaptiveSessionRecord => ({
    id: 'adp_1729900000_sample1',
    schemaVersion: 1,
    mode: 'zhuyin',
    difficulty: 'beginner',
    targetWeakKeys: [' ', 'ㄕ'],
    seed: 42,
    startedAt: 1729900000000,
    completedAt: 1729900060000,
    durationMs: 60000,
    totalKeystrokes: 120,
    correctKeystrokes: 110,
    wpm: 25.5,
    accuracy: 91.67,
    baselineStats: {
      ' ': { totalAttempts: 20, errorCount: 5, errorRate: 0.25 },
      'ㄕ': { totalAttempts: 15, errorCount: 3, errorRate: 0.2 },
    },
    practiceStats: {
      ' ': { attempts: 10, errors: 1, errorRate: 0.1 },
      'ㄕ': { attempts: 8, errors: 1, errorRate: 0.125 },
    },
    status: 'COMPLETED',
    ...overrides,
  });

  // ADP-032: Storage Schema Validation
  describe('ADP-032: Storage Schema Validation', () => {
    it('validates a compliant AdaptiveSessionRecord', () => {
      const record = createSampleRecord();
      expect(isValidAdaptiveSessionRecord(record)).toBe(true);
    });

    it('allows seed to be null when no seed was provided', () => {
      const record = createSampleRecord({ seed: null });
      expect(isValidAdaptiveSessionRecord(record)).toBe(true);
    });

    it('allows baseline and practice errorRate to be null for insufficient data', () => {
      const record = createSampleRecord({
        baselineStats: {
          ' ': { totalAttempts: 3, errorCount: 1, errorRate: null },
        },
        practiceStats: {
          ' ': { attempts: 0, errors: 0, errorRate: null },
        },
      });
      expect(isValidAdaptiveSessionRecord(record)).toBe(true);
    });

    it('rejects missing or unsupported schemaVersion', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ schemaVersion: 2 as any }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ schemaVersion: undefined as any }))).toBe(false);
    });

    it('rejects empty or whitespace id', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ id: '' }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ id: '   ' }))).toBe(false);
    });

    it('rejects invalid mode or difficulty', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ mode: 'invalid' as any }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ difficulty: 'expert' as any }))).toBe(false);
    });

    it('rejects non-finite, negative, or reversed timestamps (completedAt < startedAt)', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ startedAt: -100 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ startedAt: NaN }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ completedAt: 1000, startedAt: 2000 }))).toBe(false);
    });

    it('rejects negative durationMs or non-finite values', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ durationMs: -500 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ durationMs: Infinity }))).toBe(false);
    });

    it('rejects non-integer, negative, or excessive keystrokes (correctKeystrokes > totalKeystrokes)', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ totalKeystrokes: 10.5 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ totalKeystrokes: -5 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ correctKeystrokes: 15, totalKeystrokes: 10 }))).toBe(false);
    });

    it('rejects invalid accuracy or wpm (out of bounds or NaN)', () => {
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ accuracy: 105 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ accuracy: -1 }))).toBe(false);
      expect(isValidAdaptiveSessionRecord(createSampleRecord({ wpm: NaN }))).toBe(false);
    });

    it('rejects malformed baselineStats and practiceStats', () => {
      // errors > attempts
      expect(
        isValidAdaptiveSessionRecord(
          createSampleRecord({
            baselineStats: { ' ': { totalAttempts: 10, errorCount: 15, errorRate: 0.5 } },
          })
        )
      ).toBe(false);

      // negative attempts
      expect(
        isValidAdaptiveSessionRecord(
          createSampleRecord({
            practiceStats: { ' ': { attempts: -1, errors: 0, errorRate: null } },
          })
        )
      ).toBe(false);

      // errorRate > 1
      expect(
        isValidAdaptiveSessionRecord(
          createSampleRecord({
            practiceStats: { ' ': { attempts: 10, errors: 5, errorRate: 1.5 } },
          })
        )
      ).toBe(false);
    });

    it('correctly validates Zhuyin Space key (" ") in targetWeakKeys, baseline, and practice stats', () => {
      const record = createSampleRecord({
        targetWeakKeys: [' '],
        baselineStats: { ' ': { totalAttempts: 25, errorCount: 5, errorRate: 0.2 } },
        practiceStats: { ' ': { attempts: 12, errors: 2, errorRate: 0.1667 } },
      });
      expect(isValidAdaptiveSessionRecord(record)).toBe(true);
    });
  });

  // ADP-033: Idempotent Single-Write Guarantee
  describe('ADP-033: Idempotent Single-Write Guarantee', () => {
    it('persists record on first call, returns existing record without duplicating on repeated call', () => {
      const record = createSampleRecord({ id: 'adp_idempotent_1' });

      const res1 = saveAdaptiveSession(record);
      expect(res1.ok).toBe(true);
      expect(res1.records).toHaveLength(1);
      expect(res1.records[0].id).toBe('adp_idempotent_1');

      // Call again with same ID
      const res2 = saveAdaptiveSession(record);
      expect(res2.ok).toBe(true);
      expect(res2.duplicate).toBe(true);
      expect(res2.records).toHaveLength(1);

      // Verify in localStorage
      const stored = loadAdaptiveSessions();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('adp_idempotent_1');
    });

    it('does not overwrite existing record if same ID is called with different payload', () => {
      const record1 = createSampleRecord({ id: 'adp_same_id', totalKeystrokes: 100, correctKeystrokes: 90 });
      const record2 = createSampleRecord({ id: 'adp_same_id', totalKeystrokes: 200, correctKeystrokes: 180 });

      saveAdaptiveSession(record1);
      const res2 = saveAdaptiveSession(record2);

      expect(res2.ok).toBe(true);
      expect(res2.duplicate).toBe(true);
      expect(loadAdaptiveSessions()[0].totalKeystrokes).toBe(100);
    });

    it('strictly avoids persisting ABANDONED session records into completed storage log', () => {
      const abandoned = createSampleRecord({ id: 'adp_abandoned_1', status: 'ABANDONED' });
      const res = saveAdaptiveSession(abandoned);

      expect(res.ok).toBe(false);
      expect(res.reason).toBe('INVALID');
      expect(loadAdaptiveSessions()).toHaveLength(0);
    });
  });

  // ADP-034: 50-Record FIFO Retention
  describe('ADP-034: 50-Record FIFO Retention', () => {
    it('stores up to 50 records without pruning', () => {
      for (let i = 1; i <= 50; i++) {
        saveAdaptiveSession(
          createSampleRecord({
            id: `adp_fifo_${i}`,
            startedAt: 1000 + i * 100,
            completedAt: 1050 + i * 100,
          })
        );
      }

      const sessions = loadAdaptiveSessions();
      expect(sessions).toHaveLength(50);
      expect(sessions[0].id).toBe('adp_fifo_1');
      expect(sessions[49].id).toBe('adp_fifo_50');
    });

    it('prunes the oldest record when the 51st record is added (FIFO)', () => {
      for (let i = 1; i <= 51; i++) {
        saveAdaptiveSession(
          createSampleRecord({
            id: `adp_fifo_${i}`,
            startedAt: 1000 + i * 100,
            completedAt: 1050 + i * 100,
          })
        );
      }

      const sessions = loadAdaptiveSessions();
      expect(sessions).toHaveLength(MAX_ADAPTIVE_SESSIONS);
      // adp_fifo_1 was the oldest, must be pruned
      expect(sessions.some((s) => s.id === 'adp_fifo_1')).toBe(false);
      // adp_fifo_2 is now the oldest
      expect(sessions[0].id).toBe('adp_fifo_2');
      // adp_fifo_51 is the newest
      expect(sessions[49].id).toBe('adp_fifo_51');
    });

    it('maintains strict chronological ordering even when records are inserted with different completion timestamps', () => {
      saveAdaptiveSession(createSampleRecord({ id: 'adp_late', startedAt: 4000, completedAt: 5000 }));
      saveAdaptiveSession(createSampleRecord({ id: 'adp_early', startedAt: 500, completedAt: 1000 }));
      saveAdaptiveSession(createSampleRecord({ id: 'adp_mid', startedAt: 2000, completedAt: 3000 }));

      const sessions = loadAdaptiveSessions();
      expect(sessions.map((s) => s.id)).toEqual(['adp_early', 'adp_mid', 'adp_late']);
    });
  });

  // ADP-035: Corrupted JSON Recovery & Quota Recovery
  describe('ADP-035: Corrupted JSON Recovery & Quota Recovery', () => {
    it('returns empty array if storage key does not exist', () => {
      expect(loadAdaptiveSessions()).toEqual([]);
    });

    it('returns empty array and logs warning if key contains malformed JSON', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, '{invalid json');

      const sessions = loadAdaptiveSessions();
      expect(sessions).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns empty array if key contains JSON object instead of array', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({ not: 'an array' }));

      const sessions = loadAdaptiveSessions();
      expect(sessions).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('filters out corrupted records while retaining valid records in array', () => {
      const valid = createSampleRecord({ id: 'adp_valid_one' });
      const corrupted = { id: 'bad', schemaVersion: 99 };
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify([valid, corrupted]));

      const sessions = loadAdaptiveSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('adp_valid_one');
    });

    it('recovers from QuotaExceededError by pruning oldest 10 records and retrying', () => {
      // Seed 20 records
      for (let i = 1; i <= 20; i++) {
        saveAdaptiveSession(
          createSampleRecord({
            id: `adp_quota_${i}`,
            startedAt: 1000 + i * 10,
            completedAt: 1005 + i * 10,
          })
        );
      }

      // Mock setItem to throw QuotaExceededError once, then succeed
      let failedOnce = false;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
        if (key === ADAPTIVE_STORAGE_KEY && !failedOnce) {
          failedOnce = true;
          const err = new Error('Quota exceeded');
          err.name = 'QuotaExceededError';
          throw err;
        }
        return originalSetItem(key, val);
      });

      const newRecord = createSampleRecord({ id: 'adp_quota_21', startedAt: 1500, completedAt: 1550 });
      const res = saveAdaptiveSession(newRecord);

      expect(res.ok).toBe(true);
      expect(failedOnce).toBe(true);
      const remaining = loadAdaptiveSessions();
      // Originally 20, pruned 10 -> 10 + 1 = 11 records
      expect(remaining).toHaveLength(11);
      expect(remaining.some((r) => r.id === 'adp_quota_21')).toBe(true);
    });

    it('returns failure reason QUOTA if storage remains exhausted after pruning attempt', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      });

      const res = saveAdaptiveSession(createSampleRecord());
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('QUOTA');
    });

    // FIX-01: Strict Read & Prevent Destructive Overwrite After Read Failure
    describe('FIX-01: Strict Read & Destructive Overwrite Prevention', () => {
      it('readAdaptiveSessionsStrict returns empty array on missing or empty storage', () => {
        const resMissing = readAdaptiveSessionsStrict();
        expect(resMissing).toEqual({ ok: true, records: [] });

        localStorage.setItem(ADAPTIVE_STORAGE_KEY, '');
        const resEmpty = readAdaptiveSessionsStrict();
        expect(resEmpty).toEqual({ ok: true, records: [] });

        localStorage.setItem(ADAPTIVE_STORAGE_KEY, '   ');
        const resSpaces = readAdaptiveSessionsStrict();
        expect(resSpaces).toEqual({ ok: true, records: [] });
      });

      it('readAdaptiveSessionsStrict returns CORRUPTED on malformed JSON syntax', () => {
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, '{not-valid-json');
        const res = readAdaptiveSessionsStrict();
        expect(res).toEqual({ ok: false, reason: 'CORRUPTED' });
      });

      it('readAdaptiveSessionsStrict returns CORRUPTED on non-array root', () => {
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({ not: 'an-array' }));
        const res = readAdaptiveSessionsStrict();
        expect(res).toEqual({ ok: false, reason: 'CORRUPTED' });
      });

      it('readAdaptiveSessionsStrict returns UNAVAILABLE when getItem throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Access denied');
        });
        const res = readAdaptiveSessionsStrict();
        expect(res).toEqual({ ok: false, reason: 'UNAVAILABLE' });
      });

      it('readAdaptiveSessionsStrict returns CORRUPTED when storage contains mixed valid and corrupted records', () => {
        const valid = createSampleRecord({ id: 'adp_valid_one' });
        const invalid = { id: 'broken_record', schemaVersion: 99 };
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify([valid, invalid]));

        const res = readAdaptiveSessionsStrict();
        expect(res).toEqual({ ok: false, reason: 'CORRUPTED' });
      });

      it('saveAdaptiveSession FAILS CLOSED and does NOT overwrite when storage has malformed JSON', () => {
        const malformed = '{"corrupted": true, broken';
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, malformed);

        const newRecord = createSampleRecord({ id: 'adp_new_save' });
        const res = saveAdaptiveSession(newRecord);

        expect(res.ok).toBe(false);
        expect(res.reason).toBe('CORRUPTED');
        // Critical: raw value in localStorage MUST NOT be overwritten or destroyed!
        expect(localStorage.getItem(ADAPTIVE_STORAGE_KEY)).toBe(malformed);
      });

      it('saveAdaptiveSession FAILS CLOSED and does NOT overwrite when storage root is non-array object', () => {
        const nonArray = JSON.stringify({ data: 'important raw data' });
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, nonArray);

        const newRecord = createSampleRecord({ id: 'adp_new_save' });
        const res = saveAdaptiveSession(newRecord);

        expect(res.ok).toBe(false);
        expect(res.reason).toBe('CORRUPTED');
        expect(localStorage.getItem(ADAPTIVE_STORAGE_KEY)).toBe(nonArray);
      });

      it('saveAdaptiveSession FAILS CLOSED and does NOT silently drop invalid records when mixed', () => {
        const valid = createSampleRecord({ id: 'adp_valid_preserved' });
        const invalid = { id: 'bad_record', schemaVersion: 99 };
        const rawMixed = JSON.stringify([valid, invalid]);
        localStorage.setItem(ADAPTIVE_STORAGE_KEY, rawMixed);

        const newRecord = createSampleRecord({ id: 'adp_new_save' });
        const res = saveAdaptiveSession(newRecord);

        expect(res.ok).toBe(false);
        expect(res.reason).toBe('CORRUPTED');
        // Unverified raw data is untouched
        expect(localStorage.getItem(ADAPTIVE_STORAGE_KEY)).toBe(rawMixed);
      });

      it('saveAdaptiveSession FAILS CLOSED and does NOT call setItem when getItem throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('Storage unavailable');
        });
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

        const newRecord = createSampleRecord({ id: 'adp_new_save' });
        const res = saveAdaptiveSession(newRecord);

        expect(res.ok).toBe(false);
        expect(res.reason).toBe('UNAVAILABLE');
        expect(setItemSpy).not.toHaveBeenCalled();
      });
    });

    // FIX-03: Verify Quota Pruning Semantics & Older Timestamp Retention
    describe('FIX-03: Quota Pruning Semantics & Older Timestamp Retention', () => {
      it('retains the newly saved record even when its completedAt is older than existing 50 records', () => {
        // Pre-fill 50 records with completedAt from 1000 to 5900
        for (let i = 1; i <= 50; i++) {
          saveAdaptiveSession(
            createSampleRecord({
              id: `adp_existing_${i}`,
              startedAt: 1000 + i * 100,
              completedAt: 1050 + i * 100,
            })
          );
        }

        expect(loadAdaptiveSessions()).toHaveLength(50);

        // Save a new record with older completion time (500)
        const olderRecord = createSampleRecord({
          id: 'adp_older_new_record',
          startedAt: 400,
          completedAt: 500,
        });

        const res = saveAdaptiveSession(olderRecord);
        expect(res.ok).toBe(true);

        const sessions = loadAdaptiveSessions();
        expect(sessions).toHaveLength(50);
        // The new record MUST NOT be dropped even though it is chronologically older
        expect(sessions.some((r) => r.id === 'adp_older_new_record')).toBe(true);
        // The oldest existing record (adp_existing_1) was pruned to make room
        expect(sessions.some((r) => r.id === 'adp_existing_1')).toBe(false);
        // Chronological order maintained: olderRecord is first
        expect(sessions[0].id).toBe('adp_older_new_record');
      });

      it('preserves the newly saved record when QuotaExceededError triggers pruning, even for older timestamps', () => {
        // Pre-fill 50 records
        for (let i = 1; i <= 50; i++) {
          saveAdaptiveSession(
            createSampleRecord({
              id: `adp_quota50_${i}`,
              startedAt: 1000 + i * 100,
              completedAt: 1050 + i * 100,
            })
          );
        }

        // Mock QuotaExceededError on the first setItem call for the new save
        let quotaTriggered = false;
        const originalSetItem = localStorage.setItem.bind(localStorage);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
          if (key === ADAPTIVE_STORAGE_KEY && !quotaTriggered) {
            quotaTriggered = true;
            const err = new Error('Quota exceeded');
            err.name = 'QuotaExceededError';
            throw err;
          }
          return originalSetItem(key, val);
        });

        const olderRecord = createSampleRecord({
          id: 'adp_older_quota_record',
          startedAt: 400,
          completedAt: 500,
        });

        const res = saveAdaptiveSession(olderRecord);
        expect(res.ok).toBe(true);
        expect(quotaTriggered).toBe(true);

        const sessions = loadAdaptiveSessions();
        // 50 existing records -> pruned 10 oldest existing -> 40 existing + 1 new = 41 records
        expect(sessions.length).toBeLessThanOrEqual(50);
        expect(sessions.some((r) => r.id === 'adp_older_quota_record')).toBe(true);
        expect(sessions[0].id).toBe('adp_older_quota_record');
      });
    });
  });

  // ADP-036: Reset & History Clearing Integration
  describe('ADP-036: Reset & History Clearing Integration', () => {
    it('clearAdaptiveSessions removes tritype.adaptive.v1 and nothing else', () => {
      saveAdaptiveSession(createSampleRecord());
      saveCompletedSession({
        id: 'chal-1',
        mode: 'en',
        difficulty: 'beginner',
        startedAt: '2026-10-27T00:00:00Z',
        completedAt: '2026-10-27T00:01:00Z',
        durationSeconds: 60,
        completedWords: 20,
        totalKeys: 100,
        correctKeys: 95,
        errors: 5,
        wpm: 20,
        accuracy: 95,
        score: 150,
      });
      saveBestRecord('en', 150);
      localStorage.setItem('tritype.weakkeys.v1.en', JSON.stringify({ a: { attempts: 10, errors: 2 } }));

      clearAdaptiveSessions();

      expect(loadAdaptiveSessions()).toEqual([]);
      expect(loadLearningHistory()).toHaveLength(1);
      expect(loadBestRecords().en).toBe(150);
      expect(localStorage.getItem('tritype.weakkeys.v1.en')).not.toBeNull();
    });

    it('clearLearningHistory removes both tritype.learning.v1 and tritype.adaptive.v1 while preserving Best Score and Weak Keys', () => {
      saveAdaptiveSession(createSampleRecord());
      saveCompletedSession({
        id: 'chal-2',
        mode: 'en',
        difficulty: 'beginner',
        startedAt: '2026-10-27T00:00:00Z',
        completedAt: '2026-10-27T00:01:00Z',
        durationSeconds: 60,
        completedWords: 20,
        totalKeys: 100,
        correctKeys: 95,
        errors: 5,
        wpm: 20,
        accuracy: 95,
        score: 200,
      });
      saveBestRecord('en', 200);
      localStorage.setItem('tritype.weakkeys.v1.en', JSON.stringify({ e: { attempts: 15, errors: 4 } }));

      clearLearningHistory();

      // Both learning histories cleared
      expect(loadLearningHistory()).toEqual([]);
      expect(loadAdaptiveSessions()).toEqual([]);
      // Best Score and Weak-Key storage preserved
      expect(loadBestRecords().en).toBe(200);
      expect(localStorage.getItem('tritype.weakkeys.v1.en')).not.toBeNull();
    });
  });

  // Summary-to-Record Adapter & Stable Identity
  describe('Summary-to-Record Adapter & Stable Identity', () => {
    it('generateAdaptiveSessionId creates stable prefixed unique identifier', () => {
      const id1 = generateAdaptiveSessionId(1000, 'abc1');
      const id2 = generateAdaptiveSessionId(1000, 'abc2');
      expect(id1).toBe('adp_1000_abc1');
      expect(id2).toBe('adp_1000_abc2');
      expect(id1).not.toBe(id2);
    });

    it('adaptSummaryToRecord accurately converts AdaptiveSessionSummary to AdaptiveSessionRecord', () => {
      const baseline = createAdaptiveBaseline(
        {
          ' ': { attempts: 20, errors: 5, lastPracticed: 1000 },
          'ㄕ': { attempts: 15, errors: 3, lastPracticed: 1000 },
        },
        [' ', 'ㄕ'],
        1000
      );

      const summary: AdaptiveSessionSummary = compileAdaptiveSessionSummary({
        sessionId: 'adp_test_session_123',
        mode: 'zhuyin',
        difficulty: 'beginner',
        targetKeys: [' ', 'ㄕ'],
        baseline,
        sessionKeyAttempts: {
          ' ': { attempts: 8, errors: 1 },
          'ㄕ': { attempts: 6, errors: 0 },
        },
        lifecycleStatus: 'COMPLETED',
        startedAt: 1000,
        completedAt: 61000,
        durationSeconds: 60,
        totalKeys: 100,
        correctKeys: 95,
        errors: 5,
        wpm: 25,
        accuracy: 95,
      });

      const record = adaptSummaryToRecord(summary, 9999);

      expect(record.id).toBe('adp_test_session_123');
      expect(record.schemaVersion).toBe(1);
      expect(record.mode).toBe('zhuyin');
      expect(record.difficulty).toBe('beginner');
      expect(record.seed).toBe(9999);
      expect(record.durationMs).toBe(60000);
      expect(record.totalKeystrokes).toBe(100);
      expect(record.correctKeystrokes).toBe(95);
      expect(record.wpm).toBe(25);
      expect(record.accuracy).toBe(95);
      expect(record.baselineStats[' '].totalAttempts).toBe(20);
      expect(record.practiceStats[' '].attempts).toBe(8);
      expect(record.status).toBe('COMPLETED');
      expect(isValidAdaptiveSessionRecord(record)).toBe(true);
    });
  });

  // EXT-01..14: Real Hook & GameSession Integration
  describe('EXT-01..14: Real Hook & GameSession Integration', () => {
    it('EXT-01 & EXT-03: generates stable session ID at PREPARE, persists exactly once to tritype.adaptive.v1 upon COMPLETE', () => {
      const clock = createMockClock(1000);
      let capturedId = '';
      const customIdGen = () => {
        capturedId = 'adp_mock_stable_uuid';
        return capturedId;
      };

      const { result, rerender } = renderHook(() =>
        useTypingSession({
          mode: 'zhuyin',
          difficulty: 'beginner',
          clock,
          idGenerator: customIdGen,
        })
      );

      // 1. PREPARE
      act(() => {
        result.current.startAdaptiveMode(
          [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
          [' '],
          60
        );
      });

      expect(result.current.adaptiveLifecycle).toBe('READY');

      // 2. START
      act(() => {
        result.current.start();
      });

      // 3. Type characters
      act(() => {
        result.current.typeChar('ㄕ');
        result.current.typeChar('ㄢ');
        result.current.typeChar(' ');
      });

      // 4. Finish session via time expiration
      act(() => {
        clock.advance(61000);
        result.current.tick();
      });

      expect(result.current.state.status).toBe('finished');
      expect(result.current.adaptiveLifecycle).toBe('COMPLETED');

      // 5. Verify storage write
      const sessions = loadAdaptiveSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('adp_mock_stable_uuid');
      expect(sessions[0].targetWeakKeys).toEqual([' ']);

      // Re-render multiple times simulating React re-renders in finished state
      rerender();
      rerender();
      rerender();

      // Single-write idempotency: storage must NOT have duplicate records
      expect(loadAdaptiveSessions()).toHaveLength(1);

      // Challenge Best Score must NOT be modified
      expect(loadBestRecords().zhuyin).toBeUndefined();
      // Legacy Learning History must NOT contain adaptive records
      expect(loadLearningHistory().some((r) => r.sessionType === 'adaptive')).toBe(false);
    });

    it('EXT-02: generates a fresh new session ID on restart', () => {
      const clock = createMockClock(1000);
      let counter = 0;
      const customIdGen = () => `adp_session_${++counter}`;

      const { result } = renderHook(() =>
        useTypingSession({
          mode: 'zhuyin',
          difficulty: 'beginner',
          clock,
          idGenerator: customIdGen,
        })
      );

      act(() => {
        result.current.startAdaptiveMode(
          [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
          [' '],
          60
        );
      });
      const firstId = result.current.adaptiveSessionId;
      expect(firstId).toBe('adp_session_1');

      act(() => {
        result.current.start();
        result.current.restart();
      });

      const secondId = result.current.adaptiveSessionId;
      expect(secondId).toBe('adp_session_2');
      expect(secondId).not.toBe(firstId);
    });

    it('EXT-09: prevents duplicate accumulation of weak keys when session completes', () => {
      localStorage.setItem('tritype.weakkeys.v1.en', JSON.stringify({ a: { attempts: 10, errors: 2 } }));
      const clock = createMockClock(1000);

      const { result, rerender } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          clock,
          duration: 1,
          sessionType: 'adaptive',
          lessons: [{ display: 'apple', answer: 'apple', mode: 'en', difficulty: 'beginner' }],
        })
      );

      act(() => {
        result.current.start();
        result.current.typeChar('a');
      });

      act(() => {
        clock.advance(1500);
        result.current.tick();
      });

      expect(result.current.state.status).toBe('finished');

      // Re-render multiple times
      rerender();
      rerender();

      const weakKeys = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      // 'a' initially had 10 attempts, was typed once -> exactly 11 attempts
      expect(weakKeys.a.attempts).toBe(11);
      // Adaptive sessions table has exactly 1 entry
      expect(loadAdaptiveSessions()).toHaveLength(1);
    });

    it('EXT-10: normal challenge session writes to learning history and updates best score without touching adaptive storage', () => {
      const clock = createMockClock(1000);

      const { result } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          clock,
          duration: 1,
          lessons: [{ display: 'hi', answer: 'hi', mode: 'en', difficulty: 'beginner' }],
        })
      );

      act(() => {
        result.current.start();
        result.current.typeChar('h');
        result.current.typeChar('i');
      });

      act(() => {
        clock.advance(1500);
        result.current.tick();
      });

      expect(result.current.state.status).toBe('finished');
      expect(loadLearningHistory()).toHaveLength(1);
      expect(loadBestRecords().en).toBeGreaterThan(0);
      expect(loadAdaptiveSessions()).toHaveLength(0);
    });

    it('FIX-02: handles storage failure gracefully, allows retry, and does not duplicate weak key stats', () => {
      // Simulate storage containing corrupted JSON that causes initial persist to fail
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, '{corrupted-cannot-write');
      localStorage.setItem('tritype.weakkeys.v1.en', JSON.stringify({ a: { attempts: 10, errors: 2, lastPracticed: 100 } }));

      const clock = createMockClock(1000);
      const { result } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          clock,
          duration: 1,
          sessionType: 'adaptive',
          lessons: [{ display: 'apple', answer: 'apple', mode: 'en', difficulty: 'beginner' }],
        })
      );

      act(() => {
        result.current.start();
        result.current.typeChar('a');
      });

      act(() => {
        clock.advance(1500);
        result.current.tick();
      });

      // Session is completed
      expect(result.current.state.status).toBe('finished');
      expect(result.current.adaptiveLifecycle).toBe('COMPLETED');
      expect(result.current.adaptiveSummary).not.toBeNull();

      // Hook reports persistence failure because of corrupted storage
      expect(result.current.adaptivePersistStatus).toBe('failed');

      // Weak keys WERE accumulated once upon session completion
      const weakKeysAfterFinish = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      expect(weakKeysAfterFinish.a.attempts).toBe(11);

      // Now clear the corrupted storage so it can accept writes
      clearAdaptiveSessions();

      // Retry persistence
      let retryResult: any;
      act(() => {
        retryResult = result.current.retryPersistAdaptiveSession();
      });

      expect(retryResult.ok).toBe(true);
      expect(result.current.adaptivePersistStatus).toBe('persisted');

      // Adaptive storage now contains exactly 1 record with matching session ID
      const sessions = loadAdaptiveSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(result.current.adaptiveSessionId);

      // Critical: weak keys MUST NOT be re-accumulated on retry!
      const weakKeysAfterRetry = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      expect(weakKeysAfterRetry.a.attempts).toBe(11);

      // Subsequent retry is idempotent
      act(() => {
        const dupResult = result.current.retryPersistAdaptiveSession();
        expect(dupResult.ok).toBe(true);
        expect(dupResult.duplicate).toBe(true);
      });
      expect(loadAdaptiveSessions()).toHaveLength(1);
    });

    it('FIX-05: acknowledges weak-key failures, reports weakKeysPersistStatus, and allows decoupled retry', () => {
      localStorage.setItem('tritype.weakkeys.v1.en', JSON.stringify({ a: { attempts: 10, errors: 2, lastPracticed: 100 } }));

      // Mock setItem to fail ONLY for weakkeys storage key
      let weakKeyBlocked = true;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
        if (key === 'tritype.weakkeys.v1.en' && weakKeyBlocked) {
          const err = new Error('Quota exceeded for weakkeys');
          err.name = 'QuotaExceededError';
          throw err;
        }
        return originalSetItem(key, val);
      });

      const clock = createMockClock(1000);
      const { result } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          clock,
          duration: 1,
          sessionType: 'adaptive',
          lessons: [{ display: 'apple', answer: 'apple', mode: 'en', difficulty: 'beginner' }],
        })
      );

      act(() => {
        result.current.start();
        result.current.typeChar('a');
      });

      act(() => {
        clock.advance(1500);
        result.current.tick();
      });

      expect(result.current.state.status).toBe('finished');

      // Adaptive history succeeded!
      expect(result.current.adaptivePersistStatus).toBe('persisted');
      expect(loadAdaptiveSessions()).toHaveLength(1);

      // Weak-key write failed!
      expect(result.current.weakKeysPersistStatus).toBe('failed');
      const weakKeysBeforeRetry = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      expect(weakKeysBeforeRetry.a.attempts).toBe(10); // NOT accumulated yet

      // Now unblock weak-key storage and retry
      weakKeyBlocked = false;
      let weakRetrySuccess: boolean | undefined;
      act(() => {
        weakRetrySuccess = result.current.retryPersistWeakKeys();
      });

      expect(weakRetrySuccess).toBe(true);
      expect(result.current.weakKeysPersistStatus).toBe('persisted');

      const weakKeysAfterRetry = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      expect(weakKeysAfterRetry.a.attempts).toBe(11);

      // Adaptive history was NOT duplicated during weak-key retry
      expect(loadAdaptiveSessions()).toHaveLength(1);

      // Calling retry again is idempotent
      act(() => {
        expect(result.current.retryPersistWeakKeys()).toBe(true);
      });
      const weakKeysIdempotent = JSON.parse(localStorage.getItem('tritype.weakkeys.v1.en') || '{}');
      expect(weakKeysIdempotent.a.attempts).toBe(11);
    });

    it('FIX-06: strictly performs only ONE automatic persist attempt, refusing auto-retry on ticks or re-renders', () => {
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, '{corrupted-json');
      const saveSpy = vi.spyOn(Storage.prototype, 'setItem');

      const clock = createMockClock(1000);
      const { result, rerender } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          clock,
          duration: 1,
          sessionType: 'adaptive',
          lessons: [{ display: 'apple', answer: 'apple', mode: 'en', difficulty: 'beginner' }],
        })
      );

      act(() => {
        result.current.start();
        result.current.typeChar('a');
      });

      act(() => {
        clock.advance(1500);
        result.current.tick();
      });

      expect(result.current.state.status).toBe('finished');
      expect(result.current.adaptivePersistStatus).toBe('failed');

      // Record count of setItem calls up to now
      const initialCalls = saveSpy.mock.calls.length;

      // Simulate multiple background ticks and re-renders while finished
      act(() => {
        result.current.tick();
        result.current.tick();
      });
      rerender();
      rerender();

      // Crucial: NO additional setItem calls occurred automatically!
      expect(saveSpy.mock.calls.length).toBe(initialCalls);
      expect(result.current.adaptivePersistStatus).toBe('failed');

      // Now clear corrupted storage and call explicit retry
      clearAdaptiveSessions();
      act(() => {
        const res = result.current.retryPersistAdaptiveSession();
        expect(res.ok).toBe(true);
      });

      expect(result.current.adaptivePersistStatus).toBe('persisted');
      expect(loadAdaptiveSessions()).toHaveLength(1);
    });
  });
});
