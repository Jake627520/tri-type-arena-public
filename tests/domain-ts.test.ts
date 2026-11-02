import { describe, it, expect } from 'vitest';
import {
  createMockClock,
  createRng,
  shuffleLessons,
  calculateMetrics,
  createGameSession,
  normalizeInput,
  LESSONS,
} from '../src/domain/index.ts';

describe('Authoritative TypeScript Domain Engine', () => {
  it('normalizes Pinyin stripping tones, diacritics, spaces, and converting ü to v', () => {
    expect(normalizeInput('Nǐ Hǎo', 'pinyin')).toBe('nihao');
    expect(normalizeInput('Lǚ xíng', 'pinyin')).toBe('lvxing');
    expect(normalizeInput("Xī'ān", 'pinyin')).toBe('xian');
  });

  it('normalizes Zhuyin via standard Daqian layout', () => {
    // 你好 -> s u 3 c l 3 -> ㄋㄧˇㄏㄠˇ
    expect(normalizeInput('su3cl3', 'zhuyin')).toBe('ㄋㄧˇㄏㄠˇ');
    // 學習 -> ㄒㄩㄝˊㄒㄧˊ -> v m , 6 v u 6
    expect(normalizeInput('vm,6vu6', 'zhuyin')).toBe('ㄒㄩㄝˊㄒㄧˊ');
  });

  it('Mulberry32 PRNG provides deterministic shuffle matching same seed', () => {
    const list = LESSONS.en;
    const shuffled1 = shuffleLessons(list, createRng('test-seed-100'));
    const shuffled2 = shuffleLessons(list, createRng('test-seed-100'));
    const shuffled3 = shuffleLessons(list, createRng('different-seed'));

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).not.toEqual(shuffled3);
  });

  it('calculates metrics with early WPM dampening for elapsed < 2s', () => {
    const early = calculateMetrics({
      correctKeys: 20,
      totalKeys: 20,
      elapsedSeconds: 0.5,
      words: 1,
      streak: 1,
    });
    // Raw WPM would be (20/5)/(0.5/60) = 480 WPM. Dampener must clamp/ramp it.
    expect(early.wpm).toBeLessThanOrEqual(50);

    const normal = calculateMetrics({
      correctKeys: 50,
      totalKeys: 50,
      elapsedSeconds: 30,
      words: 5,
      streak: 5,
    });
    expect(normal.wpm).toBe(20);
    expect(normal.accuracy).toBe(100);
    expect(normal.score).toBe(550);
  });

  it('FSM handles full game loop: idle -> running -> paused -> running -> finished', () => {
    const clock = createMockClock(0);
    const session = createGameSession({ mode: 'en', duration: 10, clock });

    expect(session.getState().status).toBe('idle');

    session.dispatch({ type: 'START' });
    expect(session.getState().status).toBe('running');

    // Type 2 keys
    session.dispatch({ type: 'TYPE_CHAR', char: 'k' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'e' });
    expect(session.getState().typedValue).toBe('ke');

    // Pause
    session.dispatch({ type: 'PAUSE' });
    expect(session.getState().status).toBe('paused');
    expect(session.dispatch({ type: 'TYPE_CHAR', char: 'y' }).accepted).toBe(false);

    // Resume
    session.dispatch({ type: 'RESUME' });
    expect(session.getState().status).toBe('running');
    session.dispatch({ type: 'TYPE_CHAR', char: 'y' });
    expect(session.getState().typedValue).toBe('key');

    // Advance past duration
    clock.advance(11000);
    const tickResult = session.dispatch({ type: 'TICK' });
    expect(tickResult.finished).toBe(true);
    expect(session.getState().status).toBe('finished');

    // Typing blocked in finished state
    expect(session.dispatch({ type: 'TYPE_CHAR', char: 'b' }).accepted).toBe(false);
  });
});
