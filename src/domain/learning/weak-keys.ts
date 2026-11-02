import { Mode } from '../types';
import { ZHUYIN_KEYS } from '../zhuyin-map';

export interface KeyAttempt {
  attempts: number;
  errors: number;
  lastPracticed: number;
}

export interface KeyStat {
  key: string;
  physicalKey?: string;
  attempts: number;
  errors: number;
  errorRate: number;
  lastPracticed: string;
  isWeak: boolean;
  insufficientData: boolean;
}

export interface WeakKeyConfig {
  minAttempts: number;
  minErrorRate: number;
}

export const DEFAULT_WEAK_KEY_CONFIG: WeakKeyConfig = {
  minAttempts: 10,
  minErrorRate: 0.2, // 20%
};

// Reverse map for Daqian phonetic symbols to physical keyboard characters
const REVERSE_ZHUYIN_MAP: Record<string, string> = { ' ': ' ' };
for (const [physical, symbol] of Object.entries(ZHUYIN_KEYS)) {
  REVERSE_ZHUYIN_MAP[symbol] = physical;
}

export function mapZhuyinSymbolToKey(symbol: string): string | undefined {
  return REVERSE_ZHUYIN_MAP[symbol];
}

export function analyzeWeakKeys(
  attemptsMap: Record<string, KeyAttempt>,
  mode: Mode,
  config: Partial<WeakKeyConfig> = {}
): KeyStat[] {
  const cfg = { ...DEFAULT_WEAK_KEY_CONFIG, ...config };
  const result: KeyStat[] = [];

  for (const [key, data] of Object.entries(attemptsMap)) {
    const attempts = data.attempts || 0;
    const errors = data.errors || 0;
    const errorRate = attempts > 0 ? errors / attempts : 0;
    const insufficientData = attempts < cfg.minAttempts;
    const isWeak = !insufficientData && errorRate >= cfg.minErrorRate;
    const physicalKey = mode === 'zhuyin' ? mapZhuyinSymbolToKey(key) : undefined;

    result.push({
      key,
      physicalKey,
      attempts,
      errors,
      errorRate,
      lastPracticed: new Date(data.lastPracticed || Date.now()).toISOString(),
      isWeak,
      insufficientData,
    });
  }

  // Deterministic sorting: primary errorRate descending, secondary errors descending, tertiary key alphabetical
  result.sort((a, b) => {
    if (b.errorRate !== a.errorRate) {
      return b.errorRate - a.errorRate;
    }
    if (b.errors !== a.errors) {
      return b.errors - a.errors;
    }
    return a.key.localeCompare(b.key);
  });

  return result;
}

const WEAK_KEYS_STORAGE_PREFIX = 'tritype.weakkeys.v1';

export function isValidKeyAttempt(obj: unknown): obj is KeyAttempt {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }
  const candidate = obj as Record<string, unknown>;
  if (
    typeof candidate.attempts !== 'number' ||
    !Number.isFinite(candidate.attempts) ||
    candidate.attempts < 0
  ) {
    return false;
  }
  if (
    typeof candidate.errors !== 'number' ||
    !Number.isFinite(candidate.errors) ||
    candidate.errors < 0 ||
    candidate.errors > candidate.attempts
  ) {
    return false;
  }
  if (candidate.lastPracticed !== undefined) {
    if (
      typeof candidate.lastPracticed !== 'number' ||
      !Number.isFinite(candidate.lastPracticed) ||
      candidate.lastPracticed < 0
    ) {
      return false;
    }
  }
  return true;
}

export function loadWeakKeyStats(mode: Mode): Record<string, KeyAttempt> {
  try {
    const raw = localStorage.getItem(`${WEAK_KEYS_STORAGE_PREFIX}.${mode}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const valid: Record<string, KeyAttempt> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isValidKeyAttempt(v)) {
        valid[k] = v;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

export function saveWeakKeyStats(mode: Mode, newAttempts: Record<string, KeyAttempt>): boolean {
  try {
    if (typeof newAttempts !== 'object' || newAttempts === null || Array.isArray(newAttempts)) {
      return false;
    }
    for (const attempt of Object.values(newAttempts)) {
      if (!isValidKeyAttempt(attempt)) {
        return false;
      }
    }

    const raw = localStorage.getItem(`${WEAK_KEYS_STORAGE_PREFIX}.${mode}`);
    let existing: Record<string, KeyAttempt> = {};
    if (raw && raw.trim() !== '') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Fail-closed on corrupted JSON to prevent destructive overwrite (FIX-05)
        return false;
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        // Fail-closed on non-object root (FIX-05)
        return false;
      }
      const parsedRecord = parsed as Record<string, unknown>;
      for (const entry of Object.values(parsedRecord)) {
        if (!isValidKeyAttempt(entry)) {
          // Fail-closed on corrupted entries in existing storage to prevent further corruption (FIX-05)
          return false;
        }
      }
      existing = parsed as Record<string, KeyAttempt>;
    }

    for (const [key, attempt] of Object.entries(newAttempts)) {
      if (!existing[key]) {
        existing[key] = { attempts: 0, errors: 0, lastPracticed: 0 };
      }
      existing[key].attempts += attempt.attempts;
      existing[key].errors += attempt.errors;
      existing[key].lastPracticed = Math.max(existing[key].lastPracticed || 0, attempt.lastPracticed || 0);
    }
    localStorage.setItem(`${WEAK_KEYS_STORAGE_PREFIX}.${mode}`, JSON.stringify(existing));
    return true;
  } catch {
    // Storage quota protection or access exception
    return false;
  }
}

export function clearWeakKeyStats(): void {
  try {
    localStorage.removeItem(`${WEAK_KEYS_STORAGE_PREFIX}.en`);
    localStorage.removeItem(`${WEAK_KEYS_STORAGE_PREFIX}.pinyin`);
    localStorage.removeItem(`${WEAK_KEYS_STORAGE_PREFIX}.zhuyin`);
  } catch {
    // Storage protection
  }
}
