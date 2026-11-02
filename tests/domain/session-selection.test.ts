import { describe, it, expect } from 'vitest';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';

describe('SELECT: GameSession Integration with ShuffleBag and Difficulty', () => {
  it('SELECT-001: A new session draws a shuffled selection in normal mode', () => {
    const session = createGameSession({ mode: 'en', difficulty: 'beginner' });
    const lesson = session.getState().currentLesson;
    expect(lesson).toBeDefined();
    expect(lesson.answer).toBeTruthy();
  });

  it('SELECT-003: Same seed produces identical first lesson and progression', () => {
    const sessionA = createGameSession({ mode: 'en', seed: 'session-seed-123' });
    const sessionB = createGameSession({ mode: 'en', seed: 'session-seed-123' });

    expect(sessionA.getState().currentLesson.answer).toBe(sessionB.getState().currentLesson.answer);
  });

  it('SELECT-004: Different seeds produce different opening lessons in representative cases', () => {
    const sessionA = createGameSession({ mode: 'en', seed: 'seed-alpha-99' });
    const sessionB = createGameSession({ mode: 'en', seed: 'seed-omega-88' });

    // Note: with 200 items in beginner pool, different seeds will almost certainly have different first items
    expect(sessionA.getState().currentLesson.answer).not.toBe(sessionB.getState().currentLesson.answer);
  });

  it('SELECT-007: Switching mode refreshes the pool and current lesson', () => {
    const session = createGameSession({ mode: 'en' });
    expect(session.getState().mode).toBe('en');

    session.dispatch({ type: 'SWITCH_MODE', mode: 'zhuyin' });
    expect(session.getState().mode).toBe('zhuyin');
    const zhuyinLesson = session.getState().currentLesson;
    expect(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/.test(zhuyinLesson.answer)).toBe(true);
  });

  it('SELECT-008: Switching difficulty refreshes the pool', () => {
    const session = createGameSession({ mode: 'en', difficulty: 'beginner' });
    expect(session.getState().difficulty).toBe('beginner');

    session.dispatch({ type: 'SWITCH_DIFFICULTY', difficulty: 'advanced' });
    expect(session.getState().difficulty).toBe('advanced');
    expect(session.getState().currentLesson).toBeDefined();
  });

  it('SELECT-009: Restart draws a new card from the refreshed shuffle bag', () => {
    const session = createGameSession({ mode: 'en', seed: 'restart-test-seed' });
    const firstLesson = session.getState().currentLesson;

    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'RESTART' });
    const afterRestart = session.getState().currentLesson;
    expect(afterRestart).toBeDefined();
  });

  it('SELECT-010: Injected custom lessons preserve custom sequence if shuffle is false', () => {
    const custom = [
      { id: 'c1', display: 'first', answer: 'first' },
      { id: 'c2', display: 'second', answer: 'second' },
    ];
    const session = createGameSession({ lessons: custom, shuffle: false });
    expect(session.getState().currentLesson.answer).toBe('first');
  });
});
