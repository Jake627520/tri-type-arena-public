import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession, GameSessionOptions } from '../../domain/session';
import { Difficulty, Lesson, Mode, SessionState } from '../../domain/types';
import {
  loadBestRecords,
  saveBestRecord,
  loadDifficulty,
  saveDifficulty,
  saveCompletedSession,
} from '../../shared/storage';
import { loadWeakKeyStats, saveWeakKeyStats, KeyAttempt } from '../../domain/learning/weak-keys';
import {
  AdaptiveBaseline,
  AdaptiveLifecycleStatus,
  AdaptiveSessionSummary,
  createAdaptiveBaseline,
  compileAdaptiveSessionSummary,
  transitionAdaptiveLifecycle,
} from '../../domain/learning/adaptive-progress';
import {
  adaptSummaryToRecord,
  generateAdaptiveSessionId,
  saveAdaptiveSession,
  loadAdaptiveSessions,
  SaveAdaptiveResult,
  AdaptiveSessionRecord,
} from '../../domain/learning/adaptive-storage';

export function useTypingSession(initialOptions: GameSessionOptions = {}) {
  const defaultDifficulty = initialOptions.difficulty || loadDifficulty();
  const sessionRef = useRef<GameSession>(
    new GameSession({
      ...initialOptions,
      difficulty: defaultDifficulty,
    })
  );
  const [state, setState] = useState<SessionState>(() => sessionRef.current.getState());
  const [bestRecords, setBestRecords] = useState(loadBestRecords());
  const [showHints, setShowHints] = useState(true);
  const lastRecordedIdRef = useRef<string | null>(null);

  // Adaptive practice lifecycle and telemetry refs (FIX-01, FIX-02, Phase 5)
  const idGen = initialOptions.idGenerator || generateAdaptiveSessionId;
  const adaptiveSessionIdRef = useRef<string | null>(
    initialOptions.sessionType === 'adaptive' ? idGen() : null
  );
  const [adaptiveLifecycle, setAdaptiveLifecycle] = useState<AdaptiveLifecycleStatus>(
    initialOptions.sessionType === 'adaptive' ? 'READY' : 'IDLE'
  );
  const [adaptiveSummary, setAdaptiveSummary] = useState<AdaptiveSessionSummary | null>(null);
  const adaptiveBaselineRef = useRef<AdaptiveBaseline | null>(null);
  const adaptiveTargetKeysRef = useRef<string[]>([]);

  // FIX-02, FIX-05, FIX-06: Independent write states
  const [adaptivePersistStatus, setAdaptivePersistStatus] = useState<'idle' | 'persisted' | 'failed'>('idle');
  const [weakKeysPersistStatus, setWeakKeysPersistStatus] = useState<'idle' | 'persisted' | 'failed'>('idle');

  const adaptiveSummarySessionIdRef = useRef<string | null>(null);
  const adaptivePersistedSessionIdRef = useRef<string | null>(null);
  const adaptiveAutoAttemptedSessionIdRef = useRef<string | null>(null);
  const pendingAdaptiveRecordRef = useRef<AdaptiveSessionRecord | null>(null);

  const weakKeysPersistedSessionIdRef = useRef<string | null>(null);
  const weakKeysAutoAttemptedSessionIdRef = useRef<string | null>(null);
  const pendingWeakKeysRef = useRef<{ mode: Mode; attempts: Record<string, KeyAttempt> } | null>(null);

  const syncState = useCallback(() => {
    const s = sessionRef.current.getState();
    setState(s);
    if (s.status === 'finished') {
      // Isolate review and adaptive modes: only normal challenge sessions update Best Score (ADP-030)
      if (s.sessionType === 'challenge') {
        const updated = saveBestRecord(s.mode, s.score);
        setBestRecords(updated);
      }

      const recordId =
        s.sessionType === 'adaptive'
          ? (adaptiveSessionIdRef.current || `${s.sessionType}-${s.mode}-${s.difficulty}-${s.startedAt || Date.now()}`)
          : `${s.sessionType}-${s.mode}-${s.difficulty}-${s.startedAt || Date.now()}`;

      if (s.sessionType === 'challenge' || s.sessionType === 'review') {
        if (lastRecordedIdRef.current !== recordId) {
          lastRecordedIdRef.current = recordId;
          saveCompletedSession({
            id: recordId,
            mode: s.mode,
            difficulty: s.difficulty,
            sessionType: s.sessionType,
            startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationSeconds: s.duration,
            completedWords: s.words,
            totalKeys: s.totalKeys,
            correctKeys: s.correctKeys,
            errors: s.errors,
            wpm: s.wpm,
            accuracy: s.accuracy,
            score: s.score,
          });

          if (Object.keys(s.keyAttempts).length > 0) {
            saveWeakKeyStats(s.mode, s.keyAttempts);
          }
        }
      } else if (s.sessionType === 'adaptive') {
        setAdaptiveLifecycle('COMPLETED');

        // 1. Compile summary ONLY ONCE for this session ID (FIX-02)
        let summary = adaptiveSummary;
        if (adaptiveBaselineRef.current && adaptiveSummarySessionIdRef.current !== recordId) {
          summary = compileAdaptiveSessionSummary({
            sessionId: recordId,
            mode: s.mode,
            difficulty: s.difficulty,
            targetKeys: adaptiveTargetKeysRef.current,
            baseline: adaptiveBaselineRef.current,
            sessionKeyAttempts: s.keyAttempts,
            lifecycleStatus: 'COMPLETED',
            startedAt: s.startedAt,
            completedAt: Date.now(),
            durationSeconds: s.duration,
            totalKeys: s.totalKeys,
            correctKeys: s.correctKeys,
            errors: s.errors,
            wpm: s.wpm,
            accuracy: s.accuracy,
          });
          adaptiveSummarySessionIdRef.current = recordId;
          setAdaptiveSummary(summary);
        }

        // 2. Accumulate weak key statistics ONLY ONCE automatically upon completion (FIX-05)
        if (
          weakKeysPersistedSessionIdRef.current !== recordId &&
          weakKeysAutoAttemptedSessionIdRef.current !== recordId
        ) {
          weakKeysAutoAttemptedSessionIdRef.current = recordId;
          if (Object.keys(s.keyAttempts).length > 0) {
            pendingWeakKeysRef.current = { mode: s.mode, attempts: { ...s.keyAttempts } };
            const ok = saveWeakKeyStats(s.mode, s.keyAttempts);
            if (ok) {
              weakKeysPersistedSessionIdRef.current = recordId;
              pendingWeakKeysRef.current = null;
              setWeakKeysPersistStatus('persisted');
            } else {
              setWeakKeysPersistStatus('failed');
            }
          } else {
            weakKeysPersistedSessionIdRef.current = recordId;
            setWeakKeysPersistStatus('idle');
          }
        }

        // 3. Attempt adaptive history persistence ONLY ONCE automatically upon completion (FIX-06)
        if (
          adaptivePersistedSessionIdRef.current !== recordId &&
          adaptiveAutoAttemptedSessionIdRef.current !== recordId &&
          summary
        ) {
          adaptiveAutoAttemptedSessionIdRef.current = recordId;
          let record = pendingAdaptiveRecordRef.current;
          if (!record || record.id !== recordId) {
            const seedNum = typeof sessionRef.current.seed === 'number' ? sessionRef.current.seed : null;
            record = adaptSummaryToRecord(summary, seedNum);
            pendingAdaptiveRecordRef.current = record;
          }

          const saveRes = saveAdaptiveSession(record);
          if (saveRes.ok) {
            adaptivePersistedSessionIdRef.current = recordId;
            pendingAdaptiveRecordRef.current = null;
            setAdaptivePersistStatus('persisted');
          } else {
            setAdaptivePersistStatus('failed');
          }
        }
      }
    } else if (s.status === 'running') {
      lastRecordedIdRef.current = null;
    }
  }, [adaptiveSummary]);

  // Timer loop when running
  useEffect(() => {
    if (state.status !== 'running') return;
    const interval = setInterval(() => {
      sessionRef.current.dispatch({ type: 'TICK' });
      syncState();
    }, 100);
    return () => clearInterval(interval);
  }, [state.status, syncState]);

  const tick = useCallback(() => {
    sessionRef.current.dispatch({ type: 'TICK' });
    syncState();
  }, [syncState]);

  const start = useCallback(() => {
    sessionRef.current.dispatch({ type: 'START' });
    if (sessionRef.current.sessionType === 'adaptive') {
      if (!adaptiveBaselineRef.current) {
        const mode = sessionRef.current.mode;
        const history = loadWeakKeyStats(mode);
        adaptiveBaselineRef.current = createAdaptiveBaseline(history, adaptiveTargetKeysRef.current, Date.now());
      }
      setAdaptiveLifecycle((cur) => transitionAdaptiveLifecycle(cur, { type: 'START' }));
    }
    syncState();
  }, [syncState]);

  const pause = useCallback(() => {
    sessionRef.current.dispatch({ type: 'PAUSE' });
    if (sessionRef.current.sessionType === 'adaptive') {
      setAdaptiveLifecycle((cur) => transitionAdaptiveLifecycle(cur, { type: 'PAUSE' }));
    }
    syncState();
  }, [syncState]);

  const resume = useCallback(() => {
    sessionRef.current.dispatch({ type: 'RESUME' });
    if (sessionRef.current.sessionType === 'adaptive') {
      setAdaptiveLifecycle((cur) => transitionAdaptiveLifecycle(cur, { type: 'RESUME' }));
    }
    syncState();
  }, [syncState]);

  const restart = useCallback(() => {
    sessionRef.current.dispatch({ type: 'RESTART' });
    if (sessionRef.current.sessionType === 'adaptive') {
      // Re-capture fresh baseline snapshot for new session identity upon restart (FIX-01, FIX-02, Phase 5)
      const mode = sessionRef.current.mode;
      const history = loadWeakKeyStats(mode);
      adaptiveBaselineRef.current = createAdaptiveBaseline(
        history,
        adaptiveTargetKeysRef.current,
        Date.now()
      );
      adaptiveSessionIdRef.current = idGen();
      setAdaptiveSummary(null);
      lastRecordedIdRef.current = null;
      setAdaptiveLifecycle('READY');
      setAdaptivePersistStatus('idle');
      setWeakKeysPersistStatus('idle');
      pendingAdaptiveRecordRef.current = null;
      pendingWeakKeysRef.current = null;
      adaptivePersistedSessionIdRef.current = null;
      adaptiveAutoAttemptedSessionIdRef.current = null;
      weakKeysPersistedSessionIdRef.current = null;
      weakKeysAutoAttemptedSessionIdRef.current = null;
      adaptiveSummarySessionIdRef.current = null;
    }
    syncState();
  }, [idGen, syncState]);

  const typeChar = useCallback(
    (char: string) => {
      const res = sessionRef.current.dispatch({ type: 'TYPE_CHAR', char });
      syncState();
      return res;
    },
    [syncState]
  );

  const backspace = useCallback(() => {
    const res = sessionRef.current.dispatch({ type: 'BACKSPACE' });
    syncState();
    return res;
  }, [syncState]);

  const paste = useCallback(
    (text: string) => {
      const res = sessionRef.current.dispatch({ type: 'PASTE', text });
      syncState();
      return res;
    },
    [syncState]
  );

  const switchMode = useCallback(
    (mode: Mode) => {
      sessionRef.current.dispatch({ type: 'SWITCH_MODE', mode });
      // Reset adaptive session state when switching mode (FIX-01, Phase 5)
      setAdaptiveLifecycle('IDLE');
      setAdaptiveSummary(null);
      adaptiveBaselineRef.current = null;
      adaptiveTargetKeysRef.current = [];
      adaptiveSessionIdRef.current = null;
      setAdaptivePersistStatus('idle');
      setWeakKeysPersistStatus('idle');
      pendingAdaptiveRecordRef.current = null;
      pendingWeakKeysRef.current = null;
      adaptivePersistedSessionIdRef.current = null;
      adaptiveAutoAttemptedSessionIdRef.current = null;
      weakKeysPersistedSessionIdRef.current = null;
      weakKeysAutoAttemptedSessionIdRef.current = null;
      adaptiveSummarySessionIdRef.current = null;
      syncState();
    },
    [syncState]
  );

  const switchDifficulty = useCallback(
    (difficulty: Difficulty) => {
      sessionRef.current.dispatch({ type: 'SWITCH_DIFFICULTY', difficulty });
      // Reset adaptive session state when switching difficulty (FIX-01, Phase 5)
      setAdaptiveLifecycle('IDLE');
      setAdaptiveSummary(null);
      adaptiveBaselineRef.current = null;
      adaptiveTargetKeysRef.current = [];
      adaptiveSessionIdRef.current = null;
      setAdaptivePersistStatus('idle');
      setWeakKeysPersistStatus('idle');
      pendingAdaptiveRecordRef.current = null;
      pendingWeakKeysRef.current = null;
      adaptivePersistedSessionIdRef.current = null;
      adaptiveAutoAttemptedSessionIdRef.current = null;
      weakKeysPersistedSessionIdRef.current = null;
      weakKeysAutoAttemptedSessionIdRef.current = null;
      adaptiveSummarySessionIdRef.current = null;
      saveDifficulty(difficulty);
      syncState();
    },
    [syncState]
  );

  const switchDuration = useCallback(
    (duration: number) => {
      sessionRef.current.dispatch({ type: 'SWITCH_DURATION', duration });
      syncState();
    },
    [syncState]
  );

  const setSeed = useCallback(
    (seed: string | number | null) => {
      sessionRef.current = new GameSession({
        mode: sessionRef.current.mode,
        difficulty: sessionRef.current.difficulty,
        duration: sessionRef.current.duration,
        seed,
      });
      syncState();
    },
    [syncState]
  );

  const startReviewMode = useCallback(
    (reviewLessons: Lesson[]) => {
      sessionRef.current = new GameSession({
        mode: sessionRef.current.mode,
        difficulty: sessionRef.current.difficulty,
        duration: sessionRef.current.duration,
        lessons: reviewLessons,
        shuffle: true,
        sessionType: 'review',
      });
      syncState();
    },
    [syncState]
  );

  const exitReviewMode = useCallback(() => {
    sessionRef.current = new GameSession({
      mode: sessionRef.current.mode,
      difficulty: sessionRef.current.difficulty,
      duration: sessionRef.current.duration,
      sessionType: 'challenge',
    });
    syncState();
  }, [syncState]);

  // Real Adaptive Mode Controller (FIX-01, FIX-02, Phase 5)
  const startAdaptiveMode = useCallback(
    (adaptiveLessons: Lesson[], targetKeys: string[], duration?: number) => {
      const mode = sessionRef.current.mode;
      // 1. Capture and freeze baseline snapshot BEFORE practice starts using mode's history (ADP-024, FIX-02)
      const history = loadWeakKeyStats(mode);
      adaptiveBaselineRef.current = createAdaptiveBaseline(history, targetKeys, Date.now());
      adaptiveTargetKeysRef.current = [...targetKeys];
      adaptiveSessionIdRef.current = idGen();
      setAdaptiveSummary(null);
      lastRecordedIdRef.current = null;
      setAdaptivePersistStatus('idle');
      setWeakKeysPersistStatus('idle');
      pendingAdaptiveRecordRef.current = null;
      pendingWeakKeysRef.current = null;
      adaptivePersistedSessionIdRef.current = null;
      adaptiveAutoAttemptedSessionIdRef.current = null;
      weakKeysPersistedSessionIdRef.current = null;
      weakKeysAutoAttemptedSessionIdRef.current = null;
      adaptiveSummarySessionIdRef.current = null;

      // 2. Instantiate GameSession with sessionType: 'adaptive'
      sessionRef.current = new GameSession({
        mode,
        difficulty: sessionRef.current.difficulty,
        duration: duration ?? sessionRef.current.duration,
        lessons: adaptiveLessons,
        shuffle: false,
        sessionType: 'adaptive',
        clock: initialOptions.clock,
      });

      // 3. Transition lifecycle to READY (ADP-029)
      setAdaptiveLifecycle('READY');
      syncState();
    },
    [idGen, initialOptions.clock, syncState]
  );

  const abandonAdaptiveMode = useCallback(() => {
    if (sessionRef.current.sessionType === 'adaptive') {
      // Transition lifecycle to ABANDONED (ADP-029, FIX-01, Phase 5)
      setAdaptiveLifecycle('ABANDONED');
      setAdaptiveSummary(null);
      adaptiveBaselineRef.current = null;
      adaptiveTargetKeysRef.current = [];
      adaptiveSessionIdRef.current = null;
      setAdaptivePersistStatus('idle');
      setWeakKeysPersistStatus('idle');
      pendingAdaptiveRecordRef.current = null;
      pendingWeakKeysRef.current = null;
      adaptivePersistedSessionIdRef.current = null;
      adaptiveAutoAttemptedSessionIdRef.current = null;
      weakKeysPersistedSessionIdRef.current = null;
      weakKeysAutoAttemptedSessionIdRef.current = null;
      adaptiveSummarySessionIdRef.current = null;

      // Revert GameSession to default challenge mode
      sessionRef.current = new GameSession({
        mode: sessionRef.current.mode,
        difficulty: sessionRef.current.difficulty,
        duration: sessionRef.current.duration,
        sessionType: 'challenge',
        clock: initialOptions.clock,
      });
      syncState();
    }
  }, [initialOptions.clock, syncState]);

  // FIX-02, FIX-06: Retry persistence of pending adaptive record without duplicating weak keys or baseline
  const retryPersistAdaptiveSession = useCallback((): SaveAdaptiveResult => {
    if (!pendingAdaptiveRecordRef.current) {
      if (adaptivePersistedSessionIdRef.current) {
        return { ok: true, records: loadAdaptiveSessions(), duplicate: true };
      }
      return { ok: false, reason: 'INVALID' };
    }

    const res = saveAdaptiveSession(pendingAdaptiveRecordRef.current);
    if (res.ok) {
      adaptivePersistedSessionIdRef.current = pendingAdaptiveRecordRef.current.id;
      pendingAdaptiveRecordRef.current = null;
      setAdaptivePersistStatus('persisted');
    } else {
      setAdaptivePersistStatus('failed');
    }
    return res;
  }, []);

  // FIX-05: Explicit retry for failed weak-key accumulation
  const retryPersistWeakKeys = useCallback((): boolean => {
    if (weakKeysPersistedSessionIdRef.current) {
      return true; // Idempotent: already accumulated
    }
    if (!pendingWeakKeysRef.current) {
      return false;
    }
    const ok = saveWeakKeyStats(pendingWeakKeysRef.current.mode, pendingWeakKeysRef.current.attempts);
    if (ok) {
      weakKeysPersistedSessionIdRef.current = adaptiveSessionIdRef.current || 'unknown';
      pendingWeakKeysRef.current = null;
      setWeakKeysPersistStatus('persisted');
      return true;
    } else {
      setWeakKeysPersistStatus('failed');
      return false;
    }
  }, []);

  return {
    state,
    bestScore: bestRecords[state.mode] ?? 0,
    showHints,
    setShowHints,
    start,
    pause,
    resume,
    restart,
    tick,
    typeChar,
    backspace,
    paste,
    switchMode,
    switchDifficulty,
    switchDuration,
    setSeed,
    startReviewMode,
    exitReviewMode,
    startAdaptiveMode,
    abandonAdaptiveMode,
    adaptiveLifecycle,
    adaptiveSummary,
    adaptiveSessionId: adaptiveSessionIdRef.current,
    adaptivePersistStatus,
    retryPersistAdaptiveSession,
    weakKeysPersistStatus,
    retryPersistWeakKeys,
  };
}
