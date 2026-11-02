import { LESSONS, normalizeInput, nextIndex } from '../engine.mjs';
import { createSystemClock } from './clock.mjs';
import { createRng, shuffleLessons } from './prng.mjs';
import { calculateMetrics } from './metrics.mjs';

/**
 * GameSession Finite State Machine
 * States: 'idle' | 'running' | 'paused' | 'finished'
 */
export class GameSession {
  constructor({
    mode = 'en',
    duration = 60,
    clock = createSystemClock(),
    seed = null,
    lessons = null,
  } = {}) {
    this.clock = clock;
    this.seed = seed;
    this.mode = mode;
    this.duration = duration;

    const baseLessons = lessons || LESSONS[mode] || LESSONS.en;
    this.lessons = seed ? shuffleLessons(baseLessons, createRng(seed)) : [...baseLessons];

    this.state = {
      status: 'idle',
      mode,
      duration,
      remaining: duration,
      startedAt: null,
      pausedAt: null,
      totalPausedMs: 0,
      currentIndex: 0,
      typedValue: '',
      totalKeys: 0,
      correctKeys: 0,
      words: 0,
      streak: 0,
      errors: 0,
      typos: [],
      wpm: 0,
      accuracy: 100,
      score: 0,
    };
  }

  getState() {
    return {
      ...this.state,
      currentLesson: this.lessons[this.state.currentIndex],
    };
  }

  dispatch(event) {
    switch (event.type) {
      case 'START':
        return this._handleStart();

      case 'PAUSE':
        return this._handlePause();

      case 'RESUME':
        return this._handleResume();

      case 'RESTART':
        return this._handleRestart();

      case 'TYPE_CHAR':
        return this._handleTypeChar(event.char);

      case 'BACKSPACE':
        return this._handleBackspace();

      case 'PASTE':
        // Explicitly reject paste cheat
        return { accepted: false, reason: 'PASTE_PROHIBITED' };

      case 'TICK':
        return this._handleTick();

      case 'SWITCH_MODE':
        return this._handleSwitchMode(event.mode);

      case 'SWITCH_DURATION':
        return this._handleSwitchDuration(event.duration);

      default:
        return { accepted: false, reason: 'UNKNOWN_EVENT' };
    }
  }

  _handleStart() {
    if (this.state.status === 'running') return { accepted: false };
    const now = this.clock.now();
    this.state.status = 'running';
    this.state.startedAt = now;
    this.state.pausedAt = null;
    this.state.totalPausedMs = 0;
    this.state.remaining = this.state.duration;
    this.state.currentIndex = 0;
    this.state.typedValue = '';
    this.state.totalKeys = 0;
    this.state.correctKeys = 0;
    this.state.words = 0;
    this.state.streak = 0;
    this.state.errors = 0;
    this.state.typos = [];
    this.state.wpm = 0;
    this.state.accuracy = 100;
    this.state.score = 0;
    return { accepted: true };
  }

  _handlePause() {
    if (this.state.status !== 'running') return { accepted: false };
    this.state.status = 'paused';
    this.state.pausedAt = this.clock.now();
    return { accepted: true };
  }

  _handleResume() {
    if (this.state.status !== 'paused') return { accepted: false };
    const now = this.clock.now();
    if (this.state.pausedAt) {
      this.state.totalPausedMs += (now - this.state.pausedAt);
      this.state.pausedAt = null;
    }
    this.state.status = 'running';
    return { accepted: true };
  }

  _handleRestart() {
    this.state.status = 'idle';
    this.state.startedAt = null;
    this.state.pausedAt = null;
    this.state.totalPausedMs = 0;
    this.state.remaining = this.state.duration;
    this.state.currentIndex = 0;
    this.state.typedValue = '';
    this.state.totalKeys = 0;
    this.state.correctKeys = 0;
    this.state.words = 0;
    this.state.streak = 0;
    this.state.errors = 0;
    this.state.typos = [];
    this.state.wpm = 0;
    this.state.accuracy = 100;
    this.state.score = 0;
    return { accepted: true };
  }

  _handleTypeChar(rawChar) {
    if (this.state.status !== 'running') {
      return { accepted: false, reason: 'NOT_RUNNING' };
    }

    const currentLesson = this.lessons[this.state.currentIndex];
    const expectedAnswer = currentLesson.answer;
    const normalizedChar = normalizeInput(rawChar, this.state.mode);

    // Increment keys
    this.state.totalKeys++;

    const targetPos = this.state.typedValue.length;
    const expectedChar = expectedAnswer[targetPos];

    if (normalizedChar === expectedChar) {
      this.state.correctKeys++;
      this.state.typedValue += normalizedChar;

      // Word complete?
      if (this.state.typedValue === expectedAnswer) {
        this.state.words++;
        this.state.streak++;
        this.state.currentIndex = nextIndex(this.state.currentIndex, this.lessons.length);
        this.state.typedValue = '';
      }
    } else {
      this.state.errors++;
      this.state.streak = 0;
      this.state.typedValue += normalizedChar;
      this.state.typos.push({
        expected: expectedChar || '',
        typed: normalizedChar,
        word: currentLesson.display,
        timestamp: this.clock.now(),
      });
    }

    this._updateMetrics();
    return { accepted: true };
  }

  _handleBackspace() {
    if (this.state.status !== 'running') return { accepted: false };
    if (this.state.typedValue.length > 0) {
      this.state.typedValue = this.state.typedValue.slice(0, -1);
      return { accepted: true };
    }
    return { accepted: false };
  }

  _handleTick() {
    if (this.state.status !== 'running') return { accepted: false };

    const now = this.clock.now();
    const elapsedMs = Math.max(0, now - this.state.startedAt - this.state.totalPausedMs);
    const elapsedSec = elapsedMs / 1000;
    this.state.remaining = Math.max(0, Math.ceil(this.state.duration - elapsedSec));

    this._updateMetrics(elapsedSec);

    if (this.state.remaining <= 0) {
      this.state.status = 'finished';
      return { accepted: true, finished: true };
    }

    return { accepted: true };
  }

  _updateMetrics(elapsedSec = null) {
    if (elapsedSec === null && this.state.startedAt) {
      const now = this.clock.now();
      const elapsedMs = Math.max(0, now - this.state.startedAt - this.state.totalPausedMs);
      elapsedSec = elapsedMs / 1000;
    }
    const metrics = calculateMetrics({
      correctKeys: this.state.correctKeys,
      totalKeys: this.state.totalKeys,
      elapsedSeconds: elapsedSec || 0,
      words: this.state.words,
      streak: this.state.streak,
    });
    this.state.wpm = metrics.wpm;
    this.state.accuracy = metrics.accuracy;
    this.state.score = metrics.score;
  }

  _handleSwitchMode(newMode) {
    this.mode = newMode;
    this.state.mode = newMode;
    const baseLessons = LESSONS[newMode] || LESSONS.en;
    this.lessons = this.seed ? shuffleLessons(baseLessons, createRng(this.seed)) : [...baseLessons];
    return this._handleRestart();
  }

  _handleSwitchDuration(newDuration) {
    this.duration = Number(newDuration);
    this.state.duration = Number(newDuration);
    return this._handleRestart();
  }
}

export function createGameSession(options) {
  return new GameSession(options);
}
