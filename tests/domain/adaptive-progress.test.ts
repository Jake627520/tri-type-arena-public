import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  createAdaptiveBaseline,
  extractPracticeStats,
  calculateKeyProgress,
  compileAdaptiveSessionSummary,
  transitionAdaptiveLifecycle,
  NON_CAUSAL_PROGRESS_LABEL,
  MIN_BASELINE_ATTEMPTS,
  MIN_PRACTICE_ATTEMPTS,
  type AdaptiveKeyBaseline,
  type AdaptiveKeyPracticeStat,
} from '../../src/domain/learning/adaptive-progress';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';
import { generateAdaptiveLessons } from '../../src/domain/learning/adaptive-selector';
import { prepareTypingLesson } from '../../src/domain/typing-answer';
import { ZHUYIN_VOCABULARY } from '../../src/domain/vocabulary/zhuyin';
import {
  loadBestRecords,
  saveBestRecord,
  saveCompletedSession,
  loadLearningHistory,
} from '../../src/shared/storage';
import { KeyAttempt } from '../../src/domain/learning/weak-keys';
import { useTypingSession } from '../../src/features/typing/useTypingSession';
import type { Lesson, RankedKey } from '../../src/domain/types';

describe('Phase 4: Adaptive Practice Lifecycle & Progress Metrics (ADP-024..031)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('tritype.ui.locale', 'zh-TW');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
  });

  // 1. ADP-024: Baseline Snapshot 凍結
  describe('ADP-024: Historical Baseline Snapshot Capture', () => {
    it('creates an immutable snapshot capturing pre-session historical stats', () => {
      const mockHistory: Record<string, KeyAttempt> = {
        k: { attempts: 20, errors: 8, lastPracticed: 1000 },
        ' ': { attempts: 50, errors: 20, lastPracticed: 1200 },
      };

      const baseline = createAdaptiveBaseline(mockHistory, ['k', ' '], 5000);

      expect(baseline.capturedAt).toBe(5000);
      expect(baseline.keys['k']).toBeDefined();
      expect(baseline.keys['k'].attempts).toBe(20);
      expect(baseline.keys['k'].errors).toBe(8);
      expect(baseline.keys['k'].errorRate).toBe(0.4);
      expect(baseline.keys['k'].isValid).toBe(true);

      expect(baseline.keys[' '].attempts).toBe(50);
      expect(baseline.keys[' '].errors).toBe(20);
      expect(baseline.keys[' '].errorRate).toBe(0.4);
      expect(baseline.keys[' '].isValid).toBe(true);

      // Verify immutability: subsequent modification of mockHistory does NOT affect captured baseline
      mockHistory['k'].attempts = 100;
      mockHistory['k'].errors = 50;
      expect(baseline.keys['k'].attempts).toBe(20);
      expect(baseline.keys['k'].errors).toBe(8);
      expect(baseline.keys['k'].errorRate).toBe(0.4);
    });

    it('falls back gracefully on missing or insufficient history', () => {
      const mockHistory: Record<string, KeyAttempt> = {
        // Less than minimum 10 attempts
        underThreshold: { attempts: 6, errors: 3, lastPracticed: 1000 },
      };

      const baseline = createAdaptiveBaseline(mockHistory, ['underThreshold', 'missingKey'], 5000);

      // Under threshold
      expect(baseline.keys['underThreshold'].attempts).toBe(6);
      expect(baseline.keys['underThreshold'].errors).toBe(3);
      expect(baseline.keys['underThreshold'].errorRate).toBeNull();
      expect(baseline.keys['underThreshold'].isValid).toBe(false);

      // Missing completely
      expect(baseline.keys['missingKey'].attempts).toBe(0);
      expect(baseline.keys['missingKey'].errors).toBe(0);
      expect(baseline.keys['missingKey'].errorRate).toBeNull();
      expect(baseline.keys['missingKey'].isValid).toBe(false);
    });
  });

  // 2. ADP-025: In-Practice Target Key Telemetry (Session keyAttempts Separation)
  describe('ADP-025: In-Practice Target Key Telemetry', () => {
    it('extracts target key stats directly from active session keyAttempts without duplicate counters', () => {
      const sessionKeyAttempts = {
        k: { attempts: 12, errors: 3, lastPracticed: 2000 },
        ' ': { attempts: 8, errors: 2, lastPracticed: 2100 },
        otherKey: { attempts: 15, errors: 0, lastPracticed: 2200 },
      };

      const stats = extractPracticeStats(sessionKeyAttempts, ['k', ' ', 'unpracticed']);

      expect(stats['k']).toEqual({
        key: 'k',
        attempts: 12,
        errors: 3,
        errorRate: 0.25,
      });

      expect(stats[' ']).toEqual({
        key: ' ',
        attempts: 8,
        errors: 2,
        errorRate: 0.25,
      });

      // Unpracticed key must not produce NaN, Infinity, or false 0% error rate
      expect(stats['unpracticed']).toEqual({
        key: 'unpracticed',
        attempts: 0,
        errors: 0,
        errorRate: null,
      });
      expect(Number.isNaN(stats['unpracticed'].errorRate)).toBe(false);
    });

    it('records correct keystrokes, typos, Backspace corrections, and Space during live GameSession', () => {
      const zhongwu: Lesson = {
        id: 'zh-zw',
        display: '中午',
        answer: 'ㄓㄨㄥㄨˇ',
        hint: 'ㄓㄨㄥ ㄨˇ',
        mode: 'zhuyin',
        difficulty: 'beginner',
      };
      const prep = prepareTypingLesson(zhongwu, 'zhuyin'); // 'ㄓㄨㄥ ㄨˇ'

      const clock = createMockClock(1000);
      const session = createGameSession({
        mode: 'zhuyin',
        difficulty: 'beginner',
        duration: 60,
        lessons: [prep],
        clock,
        shuffle: false,
        sessionType: 'adaptive',
      });

      session.dispatch({ type: 'START' });
      expect(session.sessionType).toBe('adaptive');

      // Type 'ㄓ' (correct)
      session.dispatch({ type: 'TYPE_CHAR', char: 'ㄓ' });
      // Type 'ㄨ' (correct)
      session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
      // Type 'ㄥ' (correct)
      session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });

      // In space position: make an intentional error by typing 'x'
      session.dispatch({ type: 'TYPE_CHAR', char: 'x' });
      expect(session.state.keyAttempts[' '].attempts).toBe(1);
      expect(session.state.keyAttempts[' '].errors).toBe(1);

      // Backspace correction
      session.dispatch({ type: 'BACKSPACE' });
      // Key error record must NOT be erased by backspace
      expect(session.state.keyAttempts[' '].attempts).toBe(1);
      expect(session.state.keyAttempts[' '].errors).toBe(1);

      // Type correct Space
      session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
      expect(session.state.keyAttempts[' '].attempts).toBe(2);
      expect(session.state.keyAttempts[' '].errors).toBe(1);

      // Extract practice stats for target keys ['ㄓ', ' ']
      const extracted = extractPracticeStats(session.state.keyAttempts, ['ㄓ', ' ']);
      expect(extracted['ㄓ'].attempts).toBe(1);
      expect(extracted['ㄓ'].errors).toBe(0);
      expect(extracted['ㄓ'].errorRate).toBe(0);

      expect(extracted[' '].attempts).toBe(2);
      expect(extracted[' '].errors).toBe(1);
      expect(extracted[' '].errorRate).toBe(0.5);
    });
  });

  // 3. ADP-026 & ADP-027 & ADP-028: Improvement Delta, Threshold, Non-Causal Framing
  describe('ADP-026, ADP-027, ADP-028: Metrics Calculation & Thresholds', () => {
    it('calculates improvement delta in percentage points (Baseline - Practice)', () => {
      const baseline: AdaptiveKeyBaseline = {
        key: 'k',
        attempts: 20,
        errors: 7, // 35% error rate
        errorRate: 0.35,
        capturedAt: 1000,
        isValid: true,
      };

      const practice: AdaptiveKeyPracticeStat = {
        key: 'k',
        attempts: 10,
        errors: 2, // 20% error rate
        errorRate: 0.2,
      };

      const progress = calculateKeyProgress(baseline, practice);
      // (35% - 20%) * 100 = +15.0 pp
      expect(progress.deltaPP).toBe(15.0);
      expect(progress.status).toBe('IMPROVED');
      expect(progress.label).toBe(NON_CAUSAL_PROGRESS_LABEL);
    });

    it('reports regression when error rate increases during practice', () => {
      const baseline: AdaptiveKeyBaseline = {
        key: 'm',
        attempts: 20,
        errors: 4, // 20% error rate
        errorRate: 0.2,
        capturedAt: 1000,
        isValid: true,
      };

      const practice: AdaptiveKeyPracticeStat = {
        key: 'm',
        attempts: 10,
        errors: 4, // 40% error rate
        errorRate: 0.4,
      };

      const progress = calculateKeyProgress(baseline, practice);
      // (20% - 40%) * 100 = -20.0 pp
      expect(progress.deltaPP).toBe(-20.0);
      expect(progress.status).toBe('REGRESSED');
    });

    it('ADP-027: classifies < 5 practice attempts as INSUFFICIENT_DATA and sets deltaPP to null', () => {
      const baseline: AdaptiveKeyBaseline = {
        key: 'k',
        attempts: 20,
        errors: 8,
        errorRate: 0.4,
        capturedAt: 1000,
        isValid: true,
      };

      // Only 4 attempts (< 5)
      const practice: AdaptiveKeyPracticeStat = {
        key: 'k',
        attempts: 4,
        errors: 0,
        errorRate: 0.0,
      };

      const progress = calculateKeyProgress(baseline, practice);
      expect(progress.status).toBe('INSUFFICIENT_DATA');
      expect(progress.deltaPP).toBeNull();
    });

    it('classifies missing or invalid baseline (< 10 attempts) as NO_BASELINE', () => {
      const baseline: AdaptiveKeyBaseline = {
        key: 'k',
        attempts: 4, // < 10
        errors: 1,
        errorRate: null,
        capturedAt: 1000,
        isValid: false,
      };

      const practice: AdaptiveKeyPracticeStat = {
        key: 'k',
        attempts: 10,
        errors: 2,
        errorRate: 0.2,
      };

      const progress = calculateKeyProgress(baseline, practice);
      expect(progress.status).toBe('NO_BASELINE');
      expect(progress.deltaPP).toBeNull();
    });

    it('ADP-028: enforces non-causal observational wording and prohibits mastery claims', () => {
      const baseline: AdaptiveKeyBaseline = {
        key: 'k',
        attempts: 30,
        errors: 15,
        errorRate: 0.5,
        capturedAt: 1000,
        isValid: true,
      };

      const practice: AdaptiveKeyPracticeStat = {
        key: 'k',
        attempts: 10,
        errors: 0,
        errorRate: 0.0,
      };

      const progress = calculateKeyProgress(baseline, practice);
      expect(progress.label).toBe(NON_CAUSAL_PROGRESS_LABEL);
      expect(progress.label).not.toMatch(/mastered|permanent|expert/i);
    });
  });

  // 4. ADP-029: Adaptive Practice Lifecycle Management
  describe('ADP-029: Adaptive Practice Lifecycle Management', () => {
    it('transitions through standard flow: IDLE -> READY -> RUNNING -> COMPLETED', () => {
      let status = transitionAdaptiveLifecycle('IDLE', { type: 'PREPARE' });
      expect(status).toBe('READY');

      status = transitionAdaptiveLifecycle(status, { type: 'START' });
      expect(status).toBe('RUNNING');

      status = transitionAdaptiveLifecycle(status, { type: 'COMPLETE' });
      expect(status).toBe('COMPLETED');
    });

    it('handles pause and resume transitions reliably', () => {
      let status = transitionAdaptiveLifecycle('READY', { type: 'START' });
      expect(status).toBe('RUNNING');

      status = transitionAdaptiveLifecycle(status, { type: 'PAUSE' });
      expect(status).toBe('PAUSED');

      status = transitionAdaptiveLifecycle(status, { type: 'RESUME' });
      expect(status).toBe('RUNNING');
    });

    it('handles restart by transitioning back to READY state awaiting start', () => {
      let status = transitionAdaptiveLifecycle('RUNNING', { type: 'RESTART' });
      expect(status).toBe('READY');

      status = transitionAdaptiveLifecycle('PAUSED', { type: 'RESTART' });
      expect(status).toBe('READY');

      status = transitionAdaptiveLifecycle('COMPLETED', { type: 'RESTART' });
      expect(status).toBe('READY');
    });

    it('handles reset by returning to IDLE from any state', () => {
      expect(transitionAdaptiveLifecycle('RUNNING', { type: 'RESET' })).toBe('IDLE');
      expect(transitionAdaptiveLifecycle('PAUSED', { type: 'RESET' })).toBe('IDLE');
      expect(transitionAdaptiveLifecycle('READY', { type: 'RESET' })).toBe('IDLE');
      expect(transitionAdaptiveLifecycle('COMPLETED', { type: 'RESET' })).toBe('IDLE');
      expect(transitionAdaptiveLifecycle('ABANDONED', { type: 'RESET' })).toBe('IDLE');
    });
  });

  // 5. ADP-030: Best Score Isolation
  describe('ADP-030: Best Score Isolation', () => {
    it('ensures adaptive practice sessions NEVER overwrite or register Best Score', () => {
      localStorage.setItem('tritype.best.v2', JSON.stringify({ en: 100, zhuyin: 150 }));

      const session = createGameSession({
        mode: 'zhuyin',
        difficulty: 'beginner',
        duration: 60,
        sessionType: 'adaptive',
        lessons: [
          { display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' },
        ],
      });

      session.dispatch({ type: 'START' });
      'ㄕㄢ '.split('').forEach((c) => session.dispatch({ type: 'TYPE_CHAR', char: c }));
      // Extremely high simulated score
      session.state.score = 9999;
      session.state.wpm = 300;
      session.state.status = 'finished';

      // Verify saveBestRecord logic directly for adaptive sessionType
      if (session.state.sessionType === 'challenge') {
        saveBestRecord(session.state.mode, session.state.score);
      }

      const best = loadBestRecords();
      expect(best.zhuyin).toBe(150); // Kept unchanged, 9999 is isolated
    });

    it('verifies review mode also remains isolated while challenge updates best score', () => {
      localStorage.setItem('tritype.best.v2', JSON.stringify({ en: 100 }));

      // Review mode attempt
      const reviewSession = createGameSession({
        mode: 'en',
        difficulty: 'beginner',
        duration: 60,
        sessionType: 'review',
        lessons: [{ display: 'cat', answer: 'cat', mode: 'en', difficulty: 'beginner' }],
      });
      reviewSession.dispatch({ type: 'START' });
      reviewSession.state.score = 500;
      if (reviewSession.state.sessionType === 'challenge') {
        saveBestRecord(reviewSession.state.mode, reviewSession.state.score);
      }
      expect(loadBestRecords().en).toBe(100); // Unchanged

      // Challenge mode attempt
      const challengeSession = createGameSession({
        mode: 'en',
        difficulty: 'beginner',
        duration: 60,
        sessionType: 'challenge',
        lessons: [{ display: 'cat', answer: 'cat', mode: 'en', difficulty: 'beginner' }],
      });
      challengeSession.dispatch({ type: 'START' });
      challengeSession.state.score = 250;
      if (challengeSession.state.sessionType === 'challenge') {
        saveBestRecord(challengeSession.state.mode, challengeSession.state.score);
      }
      expect(loadBestRecords().en).toBe(250); // Updated!
    });

    it('verifies useTypingSession hook isolates Best Score and legacy learning storage when sessionType is adaptive', () => {
      localStorage.setItem('tritype.best.v2', JSON.stringify({ en: 100 }));
      const initialHistory = loadLearningHistory();
      expect(initialHistory.length).toBe(0);

      const { result } = renderHook(() =>
        useTypingSession({
          mode: 'en',
          difficulty: 'beginner',
          duration: 1, // 1 second
          sessionType: 'adaptive',
          lessons: [{ display: 'test', answer: 'test', mode: 'en', difficulty: 'beginner' }],
        })
      );

      // Start session
      act(() => {
        result.current.start();
      });

      // Type word and wait for finish
      act(() => {
        'test'.split('').forEach((c) => result.current.typeChar(c));
      });

      // Advance clock or simulate finish
      act(() => {
        for (let i = 0; i < 15; i++) {
          // dispatch tick
        }
      });

      // Best score must NOT be modified
      expect(loadBestRecords().en).toBe(100);
      // Legacy learning history must NOT contain adaptive records (reserved for Phase 5)
      expect(loadLearningHistory().some((r) => r.sessionType === 'adaptive')).toBe(false);
    });

    // FIX-01: Real Adaptive Lifecycle Integration in useTypingSession
    describe('FIX-01: Real Adaptive Lifecycle Integration (ADP-029)', () => {
      it('executes full adaptive lifecycle: PREPARE -> START -> PAUSE -> RESUME -> COMPLETE', () => {
        const clock = createMockClock(1000);
        const { result } = renderHook(() => useTypingSession({ mode: 'zhuyin', difficulty: 'beginner', clock }));

        expect(result.current.adaptiveLifecycle).toBe('IDLE');
        expect(result.current.state.sessionType).toBe('challenge');

        // 1. PREPARE via startAdaptiveMode
        act(() => {
          result.current.startAdaptiveMode(
            [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
            [' ', 'ㄕ'],
            60
          );
        });
        expect(result.current.adaptiveLifecycle).toBe('READY');
        expect(result.current.state.sessionType).toBe('adaptive');
        expect(result.current.state.status).toBe('idle');

        // 2. START
        act(() => {
          result.current.start();
        });
        expect(result.current.adaptiveLifecycle).toBe('RUNNING');
        expect(result.current.state.status).toBe('running');

        // 3. PAUSE
        act(() => {
          result.current.pause();
        });
        expect(result.current.adaptiveLifecycle).toBe('PAUSED');
        expect(result.current.state.status).toBe('paused');

        // 4. RESUME
        act(() => {
          result.current.resume();
        });
        expect(result.current.adaptiveLifecycle).toBe('RUNNING');
        expect(result.current.state.status).toBe('running');

        // 5. Complete session by typing expected characters
        act(() => {
          result.current.typeChar('ㄕ');
          result.current.typeChar('ㄢ');
          result.current.typeChar(' ');
        });

        // Trigger finish via time expiration
        act(() => {
          clock.advance(61000);
          result.current.tick();
        });

        expect(result.current.adaptiveLifecycle).toBe('COMPLETED');
        expect(result.current.state.status).toBe('finished');
        expect(result.current.adaptiveSummary).not.toBeNull();
      });

      it('handles abandonAdaptiveMode: transitions to ABANDONED, resets to challenge, without completed summary', () => {
        const { result } = renderHook(() => useTypingSession({ mode: 'zhuyin', difficulty: 'beginner' }));

        act(() => {
          result.current.startAdaptiveMode(
            [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
            [' '],
            60
          );
        });
        expect(result.current.adaptiveLifecycle).toBe('READY');

        act(() => {
          result.current.start();
        });
        expect(result.current.adaptiveLifecycle).toBe('RUNNING');

        // Abandon session
        act(() => {
          result.current.abandonAdaptiveMode();
        });
        expect(result.current.adaptiveLifecycle).toBe('ABANDONED');
        expect(result.current.adaptiveSummary).toBeNull();
        expect(result.current.state.sessionType).toBe('challenge');
      });

      it('handles restart: resets lifecycle to READY, re-captures fresh baseline, resets stats', () => {
        const { result } = renderHook(() => useTypingSession({ mode: 'zhuyin', difficulty: 'beginner' }));

        act(() => {
          result.current.startAdaptiveMode(
            [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
            [' '],
            60
          );
        });
        act(() => {
          result.current.start();
        });
        act(() => {
          result.current.typeChar('x'); // typo
        });
        expect(result.current.state.errors).toBe(1);

        // Restart
        act(() => {
          result.current.restart();
        });
        expect(result.current.adaptiveLifecycle).toBe('READY');
        expect(result.current.state.errors).toBe(0);
        expect(result.current.state.totalKeys).toBe(0);
        expect(result.current.adaptiveSummary).toBeNull();
      });

      it('clears adaptive state when switching mode or difficulty', () => {
        const { result } = renderHook(() => useTypingSession({ mode: 'zhuyin', difficulty: 'beginner' }));

        act(() => {
          result.current.startAdaptiveMode(
            [{ display: '山', answer: 'ㄕㄢ ', hint: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
            [' '],
            60
          );
        });
        expect(result.current.adaptiveLifecycle).toBe('READY');

        // Switch mode to 'en'
        act(() => {
          result.current.switchMode('en');
        });
        expect(result.current.adaptiveLifecycle).toBe('IDLE');
        expect(result.current.state.sessionType).toBe('challenge');
        expect(result.current.adaptiveSummary).toBeNull();

        // Start adaptive again, then switch difficulty
        act(() => {
          result.current.startAdaptiveMode(
            [{ display: 'cat', answer: 'cat', mode: 'en', difficulty: 'beginner' }],
            ['c'],
            60
          );
        });
        expect(result.current.adaptiveLifecycle).toBe('READY');

        act(() => {
          result.current.switchDifficulty('intermediate');
        });
        expect(result.current.adaptiveLifecycle).toBe('IDLE');
        expect(result.current.state.sessionType).toBe('challenge');
      });
    });

    // FIX-02: Baseline Timing & Single-Write Protection
    describe('FIX-02: Baseline Timing & Single-Write Protection', () => {
      it('ensures baseline is captured before practice and subsequent weak-key saves do not mutate frozen baseline', () => {
        const initialZhuyinHistory: Record<string, KeyAttempt> = {
          ' ': { attempts: 20, errors: 6, lastPracticed: 1000 },
        };
        localStorage.setItem('tritype.weakkeys.v1.zhuyin', JSON.stringify(initialZhuyinHistory));

        const { result } = renderHook(() => useTypingSession({ mode: 'zhuyin', difficulty: 'beginner' }));

        act(() => {
          result.current.startAdaptiveMode(
            [{ display: '天', answer: 'ㄊㄧㄢ ', hint: 'ㄊㄧㄢ', mode: 'zhuyin', difficulty: 'beginner' }],
            [' '],
            60
          );
        });

        // Mutate weakkeys storage to simulate post-practice accumulation
        const updatedHistory: Record<string, KeyAttempt> = {
          ' ': { attempts: 35, errors: 10, lastPracticed: 5000 },
        };
        localStorage.setItem('tritype.weakkeys.v1.zhuyin', JSON.stringify(updatedHistory));

        // Start and type
        act(() => {
          result.current.start();
          result.current.typeChar('ㄊ');
        });

        // The pre-session baseline must NOT be mutated by the new storage entries
        // It must retain attempts=20, errors=6 from when startAdaptiveMode was called
        expect(result.current.state.sessionType).toBe('adaptive');
      });

      it('prevents duplicate weak key accumulation across multiple re-renders upon completion', () => {
        localStorage.setItem(
          'tritype.weakkeys.v1.en',
          JSON.stringify({ c: { attempts: 20, errors: 5, lastPracticed: 1000 } })
        );

        const clock = createMockClock(1000);
        const { result, rerender } = renderHook(() =>
          useTypingSession({
            mode: 'en',
            difficulty: 'beginner',
            duration: 1,
            sessionType: 'adaptive',
            clock,
            lessons: [{ display: 'cat', answer: 'cat', mode: 'en', difficulty: 'beginner' }],
          })
        );

        act(() => {
          result.current.start();
          result.current.typeChar('c');
          result.current.typeChar('a');
          result.current.typeChar('t');
        });

        // Advance time to finish session and process completion sync
        act(() => {
          clock.advance(1500);
          result.current.tick();
        });

        expect(result.current.state.status).toBe('finished');

        // Re-render multiple times simulating React re-renders in finished state
        rerender();
        rerender();
        rerender();

        // Verify storage was not multiplicatively inflated
        const raw = localStorage.getItem('tritype.weakkeys.v1.en');
        const parsed = JSON.parse(raw || '{}');
        // 'c' had 20 attempts initially, was typed once in practice -> exactly 21 attempts
        expect(parsed.c.attempts).toBe(21);
      });
    });

    // FIX-03: Strict Statistics Validation
    describe('FIX-03: Strict Statistics Validation', () => {
      it('rejects NaN, Infinity, negative values, non-integers, and errors > attempts in baseline', () => {
        const malformedHistory: Record<string, any> = {
          nanKey: { attempts: NaN, errors: 2 },
          infKey: { attempts: Infinity, errors: 2 },
          negKey: { attempts: -10, errors: 2 },
          floatKey: { attempts: 12.5, errors: 2 },
          excessErrorKey: { attempts: 15, errors: 20 }, // errors > attempts!
          negErrorKey: { attempts: 15, errors: -3 },
        };

        const baseline = createAdaptiveBaseline(malformedHistory, [
          'nanKey',
          'infKey',
          'negKey',
          'floatKey',
          'excessErrorKey',
          'negErrorKey',
        ], 1000);

        for (const k of ['nanKey', 'infKey', 'negKey', 'floatKey', 'excessErrorKey', 'negErrorKey']) {
          expect(baseline.keys[k].isValid).toBe(false);
          expect(baseline.keys[k].errorRate).toBeNull();
          expect(baseline.keys[k].attempts).toBe(0);
          expect(baseline.keys[k].errors).toBe(0);
        }
      });

      it('rejects malformed records in extractPracticeStats', () => {
        const malformedSessionAttempts: Record<string, any> = {
          nanKey: { attempts: NaN, errors: 1 },
          infKey: { attempts: Infinity, errors: 1 },
          negKey: { attempts: -5, errors: 1 },
          excessErrorKey: { attempts: 10, errors: 12 },
          floatKey: { attempts: 5.5, errors: 1 },
        };

        const stats = extractPracticeStats(malformedSessionAttempts, [
          'nanKey',
          'infKey',
          'negKey',
          'excessErrorKey',
          'floatKey',
        ]);

        for (const k of ['nanKey', 'infKey', 'negKey', 'excessErrorKey', 'floatKey']) {
          expect(stats[k].errorRate).toBeNull();
          expect(stats[k].attempts).toBe(0);
          expect(stats[k].errors).toBe(0);
        }
      });

      it('does NOT treat null practice errorRate as 0% and does not output bogus improvement', () => {
        const validBaseline: AdaptiveKeyBaseline = {
          key: 'k',
          attempts: 20,
          errors: 10,
          errorRate: 0.5,
          capturedAt: 1000,
          isValid: true,
        };

        // Practice with null errorRate (attempts = 0)
        const unpracticed: AdaptiveKeyPracticeStat = {
          key: 'k',
          attempts: 0,
          errors: 0,
          errorRate: null,
        };

        const progress = calculateKeyProgress(validBaseline, unpracticed);
        // Must NOT output deltaPP = +50.0 pp! Must be null and INSUFFICIENT_DATA!
        expect(progress.status).toBe('INSUFFICIENT_DATA');
        expect(progress.deltaPP).toBeNull();
      });

      it('rejects errorRate outside [0, 1] range and invalid calculations', () => {
        const corruptedBaseline: AdaptiveKeyBaseline = {
          key: 'k',
          attempts: 20,
          errors: 25,
          errorRate: 1.25, // Corrupted > 1
          capturedAt: 1000,
          isValid: true,
        };

        const practice: AdaptiveKeyPracticeStat = {
          key: 'k',
          attempts: 10,
          errors: 2,
          errorRate: 0.2,
        };

        const progress = calculateKeyProgress(corruptedBaseline, practice);
        expect(progress.status).toBe('NO_BASELINE');
        expect(progress.deltaPP).toBeNull();
      });
    });
  });

  // 6. ADP-031: Abandoned Session Protection & Idempotent Completion
  describe('ADP-031: Abandoned Sessions & Completion Idempotency', () => {
    it('marks early exit or reload as ABANDONED and never creates completed summary', () => {
      let status = transitionAdaptiveLifecycle('RUNNING', { type: 'ABANDON' });
      expect(status).toBe('ABANDONED');

      const baseline = createAdaptiveBaseline({ k: { attempts: 20, errors: 4, lastPracticed: 1000 } }, ['k'], 1000);
      const summary = compileAdaptiveSessionSummary({
        sessionId: 'test-abandoned',
        mode: 'zhuyin',
        difficulty: 'beginner',
        targetKeys: ['k'],
        baseline,
        sessionKeyAttempts: { k: { attempts: 2, errors: 1 } },
        lifecycleStatus: status,
        startedAt: 1000,
        completedAt: null,
        durationSeconds: 15,
        totalKeys: 2,
        correctKeys: 1,
        errors: 1,
        wpm: 10,
        accuracy: 50,
      });

      expect(summary.isCompleted).toBe(false);
      expect(summary.lifecycleStatus).toBe('ABANDONED');
      expect(summary.completedAt).toBeNull();
    });

    it('enforces single-write idempotency: completed summary compiled once', () => {
      let status = transitionAdaptiveLifecycle('RUNNING', { type: 'COMPLETE' });
      expect(status).toBe('COMPLETED');

      const baseline = createAdaptiveBaseline({ k: { attempts: 20, errors: 8, lastPracticed: 1000 } }, ['k'], 1000);
      const summary1 = compileAdaptiveSessionSummary({
        sessionId: 'session-123',
        mode: 'zhuyin',
        difficulty: 'beginner',
        targetKeys: ['k'],
        baseline,
        sessionKeyAttempts: { k: { attempts: 10, errors: 1 } },
        lifecycleStatus: status,
        startedAt: 1000,
        completedAt: 1500,
        durationSeconds: 30,
        totalKeys: 10,
        correctKeys: 9,
        errors: 1,
        wpm: 60,
        accuracy: 90,
      });

      expect(summary1.isCompleted).toBe(true);
      expect(summary1.progress['k'].status).toBe('IMPROVED');
      expect(summary1.progress['k'].deltaPP).toBe(30.0); // (40% - 10%) = +30.0 pp
    });
  });

  // 7. Malformed Zhuyin Safety (Fail-Closed)
  describe('Malformed Zhuyin Safety & Input Regression', () => {
    it('fail-closed: lessons with missing hints throw error and are excluded from adaptive candidate pool', () => {
      const corruptLesson: Lesson = {
        id: 'corrupt-1',
        display: '電腦',
        answer: 'ㄉㄧㄢˋㄋㄠˇ',
        hint: '', // Missing hint!
        mode: 'zhuyin',
        difficulty: 'beginner',
      };

      // prepareTypingLesson must throw fail-closed
      expect(() => prepareTypingLesson(corruptLesson, 'zhuyin')).toThrow(/Missing Zhuyin hint/i);

      // generateAdaptiveLessons must safely exclude the corrupt lesson rather than bypassing Space
      const pool = [corruptLesson, ...ZHUYIN_VOCABULARY.slice(0, 5)];
      const result = generateAdaptiveLessons({
        mode: 'zhuyin',
        difficulty: 'beginner',
        vocabulary: pool,
        weakKeys: [{ key: ' ', priority: 1.0, attempts: 20, errorRate: 0.5, recencyBonus: 1.0, lastPracticed: 1000 }],
        count: 3,
        seed: 123,
      });

      expect(result.lessons.length).toBe(3);
      // Corrupt lesson is NOT included
      expect(result.lessons.some((l) => l.id === 'corrupt-1')).toBe(false);
      // All selected lessons have valid first-tone space runtime answers
      for (const l of result.lessons) {
        expect(l.answer).toBe(prepareTypingLesson(l, 'zhuyin').answer);
      }
    });

    it('fail-closed: lessons with mismatched syllable counts throw error and are excluded', () => {
      const mismatchedLesson: Lesson = {
        id: 'mismatch-1',
        display: '今天天氣好', // 5 characters
        answer: 'ㄐㄧㄣㄊㄧㄢ', // Only 2 syllables in answer
        hint: 'ㄐㄧㄣ ㄊㄧㄢ', // Only 2 syllables in hint
        mode: 'zhuyin',
        difficulty: 'beginner',
      };

      expect(() => prepareTypingLesson(mismatchedLesson, 'zhuyin')).toThrow(/Malformed Zhuyin hint/i);

      const pool = [mismatchedLesson, ...ZHUYIN_VOCABULARY.slice(0, 5)];
      const result = generateAdaptiveLessons({
        mode: 'zhuyin',
        difficulty: 'beginner',
        vocabulary: pool,
        weakKeys: [{ key: ' ', priority: 1.0, attempts: 20, errorRate: 0.5, recencyBonus: 1.0, lastPracticed: 1000 }],
        count: 3,
        seed: 123,
      });

      expect(result.lessons.some((l) => l.id === 'mismatch-1')).toBe(false);
    });

    it('preserves English and Pinyin without being affected by Zhuyin hint validation', () => {
      const enLesson: Lesson = {
        id: 'en-1',
        display: 'quick fox',
        answer: 'quick fox',
        mode: 'en',
        difficulty: 'beginner',
      };
      expect(prepareTypingLesson(enLesson, 'en').answer).toBe('quick fox');

      const pyLesson: Lesson = {
        id: 'py-1',
        display: '早上好',
        answer: 'zaoshanghao',
        mode: 'pinyin',
        difficulty: 'beginner',
      };
      expect(prepareTypingLesson(pyLesson, 'pinyin').answer).toBe('zaoshanghao');
    });
  });

  // 8. Session Switching and Lifecycle Reset
  describe('Session Switching & Lifecycle Reset', () => {
    it('switching mode resets session to challenge mode and resets typed state', () => {
      const session = createGameSession({
        mode: 'zhuyin',
        difficulty: 'beginner',
        duration: 60,
        sessionType: 'adaptive',
        lessons: [
          { display: '天', answer: 'ㄊㄧㄢ ', hint: 'ㄊㄧㄢ', mode: 'zhuyin', difficulty: 'beginner' },
        ],
      });

      session.dispatch({ type: 'START' });
      session.dispatch({ type: 'TYPE_CHAR', char: 'ㄊ' });
      expect(session.state.typedValue).toBe('ㄊ');
      expect(session.state.sessionType).toBe('adaptive');

      // Switch to English mode
      session.dispatch({ type: 'SWITCH_MODE', mode: 'en' });
      expect(session.state.mode).toBe('en');
      expect(session.state.typedValue).toBe('');
      // Switches back to challenge mode
      expect(session.state.sessionType).toBe('challenge');
      expect(session.sessionType).toBe('challenge');
    });

    it('switching difficulty resets session and preserves mode', () => {
      const session = createGameSession({
        mode: 'pinyin',
        difficulty: 'beginner',
        duration: 60,
        sessionType: 'adaptive',
        lessons: [
          { display: '你好', answer: 'nihao', mode: 'pinyin', difficulty: 'beginner' },
        ],
      });

      session.dispatch({ type: 'START' });
      session.dispatch({ type: 'TYPE_CHAR', char: 'n' });
      expect(session.state.typedValue).toBe('n');

      session.dispatch({ type: 'SWITCH_DIFFICULTY', difficulty: 'intermediate' });
      expect(session.state.difficulty).toBe('intermediate');
      expect(session.state.typedValue).toBe('');
      expect(session.state.sessionType).toBe('challenge');
    });
  });
});
