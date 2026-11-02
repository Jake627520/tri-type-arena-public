import { Difficulty, Mode, SessionType } from '../domain/types';
import { ADAPTIVE_STORAGE_KEY } from '../domain/learning/adaptive-storage';

const BEST_STORAGE_KEY = 'tritype.best.v2';
const DIFFICULTY_STORAGE_KEY = 'tritype.difficulty.v1';
const LEARNING_HISTORY_KEY = 'tritype.learning.v1';
const MAX_HISTORY_ITEMS = 200;

export interface BestRecords {
  en?: number;
  pinyin?: number;
  zhuyin?: number;
}

export interface LearningSessionRecord {
  id: string;
  mode: Mode;
  difficulty: Difficulty;
  sessionType?: SessionType;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  completedWords: number;
  totalKeys: number;
  correctKeys: number;
  errors: number;
  wpm: number;
  accuracy: number;
  score: number;
}

export function loadBestRecords(): BestRecords {
  try {
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const values = parsed as Record<string, unknown>;
    const records: BestRecords = {};
    for (const mode of ['en', 'pinyin', 'zhuyin'] as const) {
      const value = values[mode];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        records[mode] = value;
      }
    }
    return records;
  } catch {
    return {};
  }
}

export function saveBestRecord(mode: Mode, score: number): BestRecords {
  const current = loadBestRecords();
  if (score > (current[mode] ?? 0)) {
    current[mode] = score;
    try {
      localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage quota or private mode protection
    }
  }
  return current;
}

export function loadDifficulty(): Difficulty {
  try {
    const raw = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (raw === 'beginner' || raw === 'intermediate' || raw === 'advanced') {
      return raw;
    }
    return 'beginner';
  } catch {
    return 'beginner';
  }
}

export function saveDifficulty(difficulty: Difficulty): void {
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficulty);
  } catch {
    // Storage quota or private mode protection
  }
}

function isValidRecord(item: unknown): item is LearningSessionRecord {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    (r.mode === 'en' || r.mode === 'pinyin' || r.mode === 'zhuyin') &&
    (r.difficulty === 'beginner' || r.difficulty === 'intermediate' || r.difficulty === 'advanced') &&
    (r.sessionType === undefined || r.sessionType === 'challenge' || r.sessionType === 'review') &&
    typeof r.startedAt === 'string' &&
    typeof r.completedAt === 'string' &&
    typeof r.durationSeconds === 'number' &&
    typeof r.completedWords === 'number' &&
    typeof r.totalKeys === 'number' &&
    typeof r.correctKeys === 'number' &&
    typeof r.errors === 'number' &&
    typeof r.wpm === 'number' &&
    typeof r.accuracy === 'number' &&
    typeof r.score === 'number'
  );
}

export function loadLearningHistory(): LearningSessionRecord[] {
  try {
    const raw = localStorage.getItem(LEARNING_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecord);
  } catch {
    return [];
  }
}

export function saveCompletedSession(record: LearningSessionRecord): LearningSessionRecord[] {
  if (!isValidRecord(record)) return loadLearningHistory();

  const current = loadLearningHistory();
  // Prevent duplicate writes on repeated finished-state renders
  if (current.some((item) => item.id === record.id)) {
    return current;
  }

  const updated = [...current, record];
  // Apply FIFO retention policy (keep last 200 sessions)
  const trimmed = updated.length > MAX_HISTORY_ITEMS ? updated.slice(updated.length - MAX_HISTORY_ITEMS) : updated;

  try {
    localStorage.setItem(LEARNING_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Graceful handling of storage quota or private browsing mode
  }
  return trimmed;
}

export function clearLearningHistory(): void {
  try {
    localStorage.removeItem(LEARNING_HISTORY_KEY);
    localStorage.removeItem(ADAPTIVE_STORAGE_KEY);
  } catch {
    // Storage quota or private mode protection
  }
}
