export type Mode = 'en' | 'pinyin' | 'zhuyin';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SessionType = 'challenge' | 'review' | 'adaptive';

export interface Lesson {
  display: string;
  answer: string;
  hint?: string;
  id?: string;
  mode?: Mode;
  difficulty?: Difficulty;
  category?: string;
}

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TypoRecord {
  expected: string;
  typed: string;
  word: string;
  timestamp: number;
}

export interface SessionState {
  status: SessionStatus;
  mode: Mode;
  difficulty: Difficulty;
  sessionType: SessionType;
  duration: number;
  remaining: number;
  startedAt: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
  currentIndex: number;
  typedValue: string;
  totalKeys: number;
  correctKeys: number;
  words: number;
  streak: number;
  errors: number;
  typos: TypoRecord[];
  wpm: number;
  accuracy: number;
  score: number;
  currentLesson: Lesson;
  keyAttempts: Record<string, { attempts: number; errors: number; lastPracticed: number }>;
}

export type SessionEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'TYPE_CHAR'; char: string }
  | { type: 'BACKSPACE' }
  | { type: 'PASTE'; text: string }
  | { type: 'TICK' }
  | { type: 'SWITCH_MODE'; mode: Mode }
  | { type: 'SWITCH_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SWITCH_DURATION'; duration: number };

export interface IClock {
  now(): number;
}
