import test from 'node:test';
import assert from 'node:assert/strict';

// Phase 1 Domain Requirements under TDD (RED phase)
// This file tests the target domain contract defined in openspec/changes/react-ts-migration/specs/react-ts-migration/spec.md
import {
  createMockClock,
  createRng,
  shuffleLessons,
  createGameSession,
  calculateMetrics,
} from '../src/domain/index.mjs';

test('RED: mock clock advances time deterministically', () => {
  const clock = createMockClock(1000);
  assert.equal(clock.now(), 1000);
  clock.advance(500);
  assert.equal(clock.now(), 1500);
});

test('RED: seedable PRNG reproduces identical sequence for same seed', () => {
  const rng1 = createRng('test-seed-42');
  const rng2 = createRng('test-seed-42');
  const samples1 = [rng1(), rng1(), rng1()];
  const samples2 = [rng2(), rng2(), rng2()];
  assert.deepEqual(samples1, samples2);

  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
  const shuffled1 = shuffleLessons(items, createRng('match-alpha'));
  const shuffled2 = shuffleLessons(items, createRng('match-alpha'));
  assert.deepEqual(shuffled1, shuffled2);
});

test('RED: game session finite state machine supports start, pause, resume, and restart', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'en', duration: 30, clock, seed: 'fixed-1' });

  assert.equal(session.getState().status, 'idle');

  session.dispatch({ type: 'START' });
  assert.equal(session.getState().status, 'running');

  session.dispatch({ type: 'PAUSE' });
  assert.equal(session.getState().status, 'paused');

  // Input should be rejected while paused
  const typedWhilePaused = session.dispatch({ type: 'TYPE_CHAR', char: 'a' });
  assert.equal(typedWhilePaused.accepted, false);

  session.dispatch({ type: 'RESUME' });
  assert.equal(session.getState().status, 'running');

  // Fast forward clock beyond duration
  clock.advance(31000);
  session.dispatch({ type: 'TICK' });
  assert.equal(session.getState().status, 'finished');
});

test('RED: anti-paste protection rejects multi-character paste events', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'en', duration: 30, clock, seed: 'fixed-1' });
  session.dispatch({ type: 'START' });

  const pasteResult = session.dispatch({ type: 'PASTE', text: 'keyboard' });
  assert.equal(pasteResult.accepted, false);
  assert.equal(session.getState().totalKeys, 0, 'Pasted text must not increment key counter');
});

test('RED: initial WPM dampening prevents extreme spikes for elapsed < 2s', () => {
  const resultEarly = calculateMetrics({
    correctKeys: 15,
    totalKeys: 15,
    elapsedSeconds: 0.5,
    words: 1,
    streak: 1,
  });
  // Raw formula would yield (15/5)/(0.5/60) = 360 WPM. Dampener must clamp or zero early spike.
  assert.ok(resultEarly.wpm <= 50, `Early WPM must be dampened, got: ${resultEarly.wpm}`);

  const resultNormal = calculateMetrics({
    correctKeys: 25,
    totalKeys: 25,
    elapsedSeconds: 15,
    words: 2,
    streak: 2,
  });
  assert.equal(resultNormal.wpm, 20); // (25/5) / (15/60) = 20
});

test('GREEN: typo recorder records exact expected vs typed mistyped characters', () => {
  const clock = createMockClock(100);
  const session = createGameSession({ mode: 'en', duration: 60, clock });
  session.dispatch({ type: 'START' });

  const currentLesson = session.getState().currentLesson;
  const expectedFirstChar = currentLesson.answer[0];

  session.dispatch({ type: 'TYPE_CHAR', char: 'x' });
  const typos = session.getState().typos;
  assert.equal(typos.length, 1);
  assert.equal(typos[0].expected, expectedFirstChar);
  assert.equal(typos[0].typed, 'x');
  assert.equal(typos[0].word, currentLesson.display);
});
