import { Difficulty, IClock, Lesson, Mode, SessionEvent, SessionState, SessionType, TypoRecord } from './types';
import { LESSONS } from './lessons';
import { normalizeInput } from './zhuyin-map';
import { createSystemClock } from './clock';
import { createRng } from './prng';
import { calculateMetrics } from './metrics';
import { ShuffleBag } from './shuffle-bag';
import { getVocabularyPool } from './vocabulary';
import { prepareTypingLesson } from './typing-answer';

export interface GameSessionOptions {
  mode?: Mode;
  difficulty?: Difficulty;
  sessionType?: SessionType;
  duration?: number;
  clock?: IClock;
  seed?: string | number | null;
  lessons?: Lesson[] | null;
  shuffle?: boolean;
  idGenerator?: () => string;
}

export function isTestInjectionAllowed(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }
  if (typeof window !== 'undefined') {
    return Boolean((window as any).__TRI_TYPE_TEST_MODE__);
  }
  return false;
}

export function getTestInjectedLessons(mode: Mode): Lesson[] | null {
  if (!import.meta.env.DEV) {
    return null;
  }
  if (!isTestInjectionAllowed()) {
    return null;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const win = window as any;
    const raw = win.__TRI_TYPE_TEST_LESSONS__;
    if (Array.isArray(raw) && raw.length > 0) {
      const filtered = raw.filter((l: Lesson) => l.mode === mode);
      return filtered.length > 0 ? filtered : null;
    }
  } catch {
    // Fail-safe
  }
  return null;
}

function resolveLessons(mode: Mode, difficulty: Difficulty, injected?: readonly Lesson[] | null): readonly Lesson[] {
  if (injected && injected.length > 0) return injected;
  const pool = getVocabularyPool(mode, difficulty);
  if (pool.length > 0) return pool;
  const fallback = LESSONS[mode];
  if (fallback && fallback.length > 0) return fallback;
  return LESSONS.en;
}

export class GameSession {
  public clock: IClock;
  public seed: string | number | null;
  public mode: Mode;
  public difficulty: Difficulty;
  public sessionType: SessionType;
  public duration: number;
  public lessons: Lesson[];

  private state: SessionState;
  private shuffleBag: ShuffleBag<Lesson>;
  private shuffle: boolean;

  constructor({
    mode = 'en',
    difficulty = 'beginner',
    sessionType = 'challenge',
    duration = 60,
    clock = createSystemClock(),
    seed = null,
    lessons = null,
    shuffle,
  }: GameSessionOptions = {}) {
    this.clock = clock;
    this.seed = seed;
    this.mode = mode;
    this.difficulty = difficulty;
    this.sessionType = sessionType;
    this.duration = duration;

    const injected = lessons?.length ? lessons : getTestInjectedLessons(mode);
    // Use ShuffleBag by default when normal gameplay or seeded; preserve array order for custom injected lessons in unit tests
    this.shuffle = shuffle !== undefined ? shuffle : (injected ? false : (lessons === null || seed !== null));

    const baseLessons = resolveLessons(mode, difficulty, injected);
    this.lessons = baseLessons.map((l) => prepareTypingLesson(l, mode));

    const rng = seed !== null ? createRng(seed) : Math.random;
    this.shuffleBag = new ShuffleBag(this.lessons, rng);

    const initialLesson = this.shuffle ? this.shuffleBag.next() : this.lessons[0];

    this.state = {
      status: 'idle',
      mode,
      difficulty,
      sessionType,
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
      maxStreak: 0,
      errors: 0,
      typos: [],
      wpm: 0,
      accuracy: 100,
      score: 0,
      currentLesson: initialLesson,
      keyAttempts: {},
    };
  }

  getState(): SessionState {
    return {
      ...this.state,
    };
  }

  dispatch(event: SessionEvent): { accepted: boolean; reason?: string; finished?: boolean } {
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
        return { accepted: false, reason: 'PASTE_PROHIBITED' };

      case 'TICK':
        return this._handleTick();

      case 'SWITCH_MODE':
        return this._handleSwitchMode(event.mode);

      case 'SWITCH_DIFFICULTY':
        return this._handleSwitchDifficulty(event.difficulty);

      case 'SWITCH_DURATION':
        return this._handleSwitchDuration(event.duration);

      default:
        return { accepted: false, reason: 'UNKNOWN_EVENT' };
    }
  }

  private _handleStart() {
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
    this.state.maxStreak = 0;
    this.state.errors = 0;
    this.state.typos = [];
    this.state.keyAttempts = {};
    this.state.wpm = 0;
    this.state.accuracy = 100;
    this.state.score = 0;
    if (!this.state.currentLesson) {
      this.state.currentLesson = this.shuffle ? this.shuffleBag.next() : this.lessons[0];
    }
    return { accepted: true };
  }

  private _handlePause() {
    if (this.state.status !== 'running') return { accepted: false };
    this.state.status = 'paused';
    this.state.pausedAt = this.clock.now();
    return { accepted: true };
  }

  private _handleResume() {
    if (this.state.status !== 'paused') return { accepted: false };
    const now = this.clock.now();
    if (this.state.pausedAt) {
      this.state.totalPausedMs += now - this.state.pausedAt;
      this.state.pausedAt = null;
    }
    this.state.status = 'running';
    return { accepted: true };
  }

  private _handleRestart() {
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
    this.state.maxStreak = 0;
    this.state.errors = 0;
    this.state.typos = [];
    this.state.keyAttempts = {};
    this.state.wpm = 0;
    this.state.accuracy = 100;
    this.state.score = 0;
    if (this.shuffle) {
      this.shuffleBag.reset();
      this.state.currentLesson = this.shuffleBag.next();
    } else {
      this.state.currentLesson = this.lessons[0];
    }
    return { accepted: true };
  }

  private _handleTypeChar(rawChar: string) {
    if (this.state.status !== 'running') {
      return { accepted: false, reason: 'NOT_RUNNING' };
    }

    const currentLesson = this.state.currentLesson || this.lessons[this.state.currentIndex];
    const expectedAnswer = currentLesson.answer;
    const normalizedChar = normalizeInput(rawChar, this.state.mode);

    this.state.totalKeys++;

    const targetPos = this.state.typedValue.length;
    const expectedChar = expectedAnswer[targetPos];

    // Track per-key attempt and error
    if (expectedChar) {
      if (!this.state.keyAttempts[expectedChar]) {
        this.state.keyAttempts[expectedChar] = {
          attempts: 0,
          errors: 0,
          lastPracticed: this.clock.now(),
        };
      }
      this.state.keyAttempts[expectedChar].attempts++;
      this.state.keyAttempts[expectedChar].lastPracticed = this.clock.now();
      if (normalizedChar !== expectedChar) {
        this.state.keyAttempts[expectedChar].errors++;
      }
    }

    if (normalizedChar === expectedChar) {
      this.state.correctKeys++;
      this.state.typedValue += normalizedChar;

      // Word complete?
      if (this.state.typedValue === expectedAnswer) {
        this.state.words++;
        this.state.streak++;
        this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
        this.state.currentIndex = (this.state.currentIndex + 1) % this.lessons.length;
        if (this.shuffle) {
          this.state.currentLesson = this.shuffleBag.next();
        } else {
          this.state.currentLesson = this.lessons[this.state.currentIndex];
        }
        this.state.typedValue = '';
      }
    } else {
      this.state.errors++;
      this.state.streak = 0;
      this.state.typedValue += normalizedChar;
      const typo: TypoRecord = {
        expected: expectedChar || '',
        typed: normalizedChar,
        word: currentLesson.display,
        timestamp: this.clock.now(),
      };
      this.state.typos.push(typo);
    }

    this._updateMetrics();
    return { accepted: true };
  }

  private _handleBackspace() {
    if (this.state.status !== 'running') return { accepted: false };
    if (this.state.typedValue.length > 0) {
      this.state.typedValue = this.state.typedValue.slice(0, -1);
      return { accepted: true };
    }
    return { accepted: false };
  }

  private _handleTick() {
    if (this.state.status !== 'running') return { accepted: false };

    const now = this.clock.now();
    const elapsedMs = Math.max(0, now - (this.state.startedAt ?? now) - this.state.totalPausedMs);
    const elapsedSec = elapsedMs / 1000;
    this.state.remaining = Math.max(0, Math.ceil(this.state.duration - elapsedSec));

    this._updateMetrics(elapsedSec);

    if (this.state.remaining <= 0) {
      this.state.status = 'finished';
      return { accepted: true, finished: true };
    }

    return { accepted: true };
  }

  private _updateMetrics(elapsedSec: number | null = null) {
    if (elapsedSec === null && this.state.startedAt) {
      const now = this.clock.now();
      const elapsedMs = Math.max(0, now - this.state.startedAt - this.state.totalPausedMs);
      elapsedSec = elapsedMs / 1000;
    }
    const metrics = calculateMetrics({
      correctKeys: this.state.correctKeys,
      totalKeys: this.state.totalKeys,
      elapsedSeconds: elapsedSec ?? 0,
      words: this.state.words,
      streak: this.state.streak,
    });
    this.state.wpm = metrics.wpm;
    this.state.accuracy = metrics.accuracy;
    this.state.score = metrics.score;
  }

  private _handleSwitchMode(newMode: Mode) {
    this.mode = newMode;
    this.state.mode = newMode;
    this.sessionType = 'challenge';
    this.state.sessionType = 'challenge';
    const injected = getTestInjectedLessons(newMode);
    if (injected && injected.length > 0) {
      this.shuffle = false;
    }
    const baseLessons = resolveLessons(newMode, this.difficulty, injected);
    this.lessons = baseLessons.map((l) => prepareTypingLesson(l, newMode));
    const rng = this.seed !== null ? createRng(this.seed) : Math.random;
    this.shuffleBag = new ShuffleBag(this.lessons, rng);
    return this._handleRestart();
  }

  private _handleSwitchDifficulty(newDifficulty: Difficulty) {
    this.difficulty = newDifficulty;
    this.state.difficulty = newDifficulty;
    this.sessionType = 'challenge';
    this.state.sessionType = 'challenge';
    const injected = getTestInjectedLessons(this.mode);
    if (injected && injected.length > 0) {
      this.shuffle = false;
    }
    const baseLessons = resolveLessons(this.mode, newDifficulty, injected);
    this.lessons = baseLessons.map((l) => prepareTypingLesson(l, this.mode));
    const rng = this.seed !== null ? createRng(this.seed) : Math.random;
    this.shuffleBag = new ShuffleBag(this.lessons, rng);
    return this._handleRestart();
  }

  private _handleSwitchDuration(newDuration: number) {
    this.duration = Number(newDuration);
    this.state.duration = Number(newDuration);
    return this._handleRestart();
  }
}

export function createGameSession(options?: GameSessionOptions): GameSession {
  return new GameSession(options);
}
