import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMockClock,
  createGameSession,
  calculateMetrics,
  LESSONS,
} from '../src/domain/index.mjs';

test('game features: switching mode resets session and updates target lessons', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'en', duration: 60, clock, lessons: [{ display: 'test', answer: 'test' }] });

  session.dispatch({ type: 'START' });
  session.dispatch({ type: 'TYPE_CHAR', char: 'k' });
  assert.equal(session.getState().totalKeys, 1);

  // Switch to zhuyin
  session.dispatch({ type: 'SWITCH_MODE', mode: 'zhuyin' });
  const state = session.getState();
  assert.equal(state.status, 'idle');
  assert.equal(state.mode, 'zhuyin');
  assert.equal(state.totalKeys, 0);
  assert.equal(state.currentLesson.answer, LESSONS.zhuyin[0].answer);
});

test('game features: Daqian keystrokes correctly advance Zhuyin lesson', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'zhuyin', duration: 60, clock, lessons: [{ display: '你好', answer: 'ㄋㄧˇㄏㄠˇ' }] });
  session.dispatch({ type: 'START' });

  // First lesson is 你好 -> ㄋㄧˇㄏㄠˇ -> mapped from s, u, 3, c, l, 3
  const daqianKeys = ['s', 'u', '3', 'c', 'l', '3'];
  for (const k of daqianKeys) {
    const res = session.dispatch({ type: 'TYPE_CHAR', char: k });
    assert.equal(res.accepted, true);
  }

  const state = session.getState();
  assert.equal(state.words, 1, 'Should complete 1 word');
  assert.equal(state.streak, 1, 'Combo streak should increment');
  assert.equal(state.errors, 0, 'Should have 0 errors');
});

test('game features: pause freezes elapsed time and prevents timer leakage', () => {
  const clock = createMockClock(1000);
  const session = createGameSession({ mode: 'en', duration: 30, clock });
  session.dispatch({ type: 'START' });

  // Type for 5 seconds
  clock.advance(5000);
  session.dispatch({ type: 'TICK' });
  assert.equal(session.getState().remaining, 25);

  // Pause for 10 seconds
  session.dispatch({ type: 'PAUSE' });
  clock.advance(10000);
  session.dispatch({ type: 'TICK' });
  assert.equal(session.getState().status, 'paused');

  // Resume
  session.dispatch({ type: 'RESUME' });
  session.dispatch({ type: 'TICK' });
  assert.equal(session.getState().remaining, 25, 'Remaining time should not decrease while paused');

  // Advance 1 second while running
  clock.advance(1000);
  session.dispatch({ type: 'TICK' });
  assert.equal(session.getState().remaining, 24);
});

test('game features: backspace correction allows fixing mistyped character', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'en', duration: 60, clock, lessons: [{ display: 'test', answer: 'test' }] });
  session.dispatch({ type: 'START' });

  // Explicit fixture: 'test'
  // Type correct 't'
  session.dispatch({ type: 'TYPE_CHAR', char: 't' });
  assert.equal(session.getState().typedValue, 't');

  // Type wrong 'x'
  session.dispatch({ type: 'TYPE_CHAR', char: 'x' });
  assert.equal(session.getState().typedValue, 'tx');
  assert.equal(session.getState().errors, 1);
  assert.equal(session.getState().streak, 0);

  // Backspace wrong 'x'
  const bsResult = session.dispatch({ type: 'BACKSPACE' });
  assert.equal(bsResult.accepted, true);
  assert.equal(session.getState().typedValue, 't');

  // Type correct 'e'
  session.dispatch({ type: 'TYPE_CHAR', char: 'e' });
  assert.equal(session.getState().typedValue, 'te');
});

test('game features: paste attempts are rejected without altering state', () => {
  const clock = createMockClock(0);
  const session = createGameSession({ mode: 'en', duration: 60, clock, lessons: [{ display: 'test', answer: 'test' }] });
  session.dispatch({ type: 'START' });

  const pasteResult = session.dispatch({ type: 'PASTE', text: 'keyboard practice' });
  assert.equal(pasteResult.accepted, false);
  assert.equal(pasteResult.reason, 'PASTE_PROHIBITED');
  assert.equal(session.getState().typedValue, '');
  assert.equal(session.getState().totalKeys, 0);
});

test('game features: typo log captures multiple mistakes with timing and words', () => {
  const clock = createMockClock(500);
  const session = createGameSession({ mode: 'en', duration: 60, clock, lessons: [{ display: 'test', answer: 'test' }] });
  session.dispatch({ type: 'START' });

  // Explicit fixture: 'test'
  clock.advance(200);
  session.dispatch({ type: 'TYPE_CHAR', char: 'z' }); // typo 1

  clock.advance(300);
  session.dispatch({ type: 'BACKSPACE' });
  session.dispatch({ type: 'TYPE_CHAR', char: 't' }); // correct

  clock.advance(100);
  session.dispatch({ type: 'TYPE_CHAR', char: 'q' }); // typo 2

  const typos = session.getState().typos;
  assert.equal(typos.length, 2);
  assert.equal(typos[0].expected, 't');
  assert.equal(typos[0].typed, 'z');
  assert.equal(typos[1].expected, 'e');
  assert.equal(typos[1].typed, 'q');
});
