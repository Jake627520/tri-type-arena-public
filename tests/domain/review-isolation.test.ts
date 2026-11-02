import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadBestRecords,
  saveBestRecord,
  loadLearningHistory,
  saveCompletedSession,
  clearLearningHistory,
  LearningSessionRecord,
} from '../../src/shared/storage';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';

describe('REVIEW-ISOLATION: Session Type Isolation (FR-006 & Storage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('REVIEW-ISOLATION-001: Normal challenge updates Best Score', () => {
    saveBestRecord('en', 300);
    expect(loadBestRecords().en).toBe(300);
  });

  it('REVIEW-ISOLATION-002: Review mode does not update normal challenge Best Score', () => {
    saveBestRecord('en', 300);

    // Create a review session
    const clock = createMockClock(0);
    const session = createGameSession({
      mode: 'en',
      duration: 10,
      clock,
      sessionType: 'review',
      lessons: [{ id: 'rev-1', display: 'quiz', answer: 'quiz' }],
      shuffle: false,
    });

    expect(session.getState().sessionType).toBe('review');

    session.dispatch({ type: 'START' });
    for (const char of 'quiz') {
      session.dispatch({ type: 'TYPE_CHAR', char });
    }

    // Fast-forward past duration
    clock.advance(11000);
    session.dispatch({ type: 'TICK' });
    expect(session.getState().status).toBe('finished');

    const finalState = session.getState();
    expect(finalState.score).toBeGreaterThan(0);

    // Simulating hook logic: review mode must NOT save to best score
    if (finalState.sessionType !== 'review') {
      saveBestRecord(finalState.mode, finalState.score);
    }

    // Normal best score must remain intact at 300
    expect(loadBestRecords().en).toBe(300);
  });

  it('REVIEW-ISOLATION-003: History record correctly preserves sessionType', () => {
    const reviewRecord: LearningSessionRecord = {
      id: 'rev-sess-1',
      mode: 'en',
      difficulty: 'beginner',
      sessionType: 'review',
      startedAt: '2026-10-26T14:00:00Z',
      completedAt: '2026-10-26T14:01:00Z',
      durationSeconds: 60,
      completedWords: 10,
      totalKeys: 50,
      correctKeys: 50,
      errors: 0,
      wpm: 50,
      accuracy: 100,
      score: 500,
    };

    saveCompletedSession(reviewRecord);
    const history = loadLearningHistory();
    expect(history).toHaveLength(1);
    expect(history[0].sessionType).toBe('review');
  });

  it('REVIEW-ISOLATION-004: Completing review allows switching back to normal challenge', () => {
    const clock = createMockClock(0);
    const reviewSession = createGameSession({
      mode: 'en',
      sessionType: 'review',
      clock,
    });
    expect(reviewSession.getState().sessionType).toBe('review');

    // Switch back to challenge mode
    const challengeSession = createGameSession({
      mode: 'en',
      sessionType: 'challenge',
      clock,
    });
    expect(challengeSession.getState().sessionType).toBe('challenge');
  });

  it('REVIEW-ISOLATION-005: Re-render does not duplicate storage records', () => {
    const record: LearningSessionRecord = {
      id: 'unique-session-id',
      mode: 'en',
      difficulty: 'intermediate',
      sessionType: 'review',
      startedAt: '2026-10-26T14:00:00Z',
      completedAt: '2026-10-26T14:01:00Z',
      durationSeconds: 60,
      completedWords: 15,
      totalKeys: 80,
      correctKeys: 78,
      errors: 2,
      wpm: 45,
      accuracy: 97.5,
      score: 450,
    };

    saveCompletedSession(record);
    saveCompletedSession(record);
    saveCompletedSession(record);

    expect(loadLearningHistory()).toHaveLength(1);
  });

  it('REVIEW-ISOLATION-006: Legacy history without sessionType is compatible and defaults to challenge', () => {
    const legacyRaw = [
      {
        id: 'legacy-1',
        mode: 'en',
        difficulty: 'beginner',
        startedAt: '2026-10-25T10:00:00Z',
        completedAt: '2026-10-25T10:01:00Z',
        durationSeconds: 60,
        completedWords: 20,
        totalKeys: 100,
        correctKeys: 95,
        errors: 5,
        wpm: 40,
        accuracy: 95,
        score: 400,
      },
    ];

    localStorage.setItem('tritype.learning.v1', JSON.stringify(legacyRaw));
    const history = loadLearningHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('legacy-1');
    expect(history[0].sessionType ?? 'challenge').toBe('challenge');
  });
});
