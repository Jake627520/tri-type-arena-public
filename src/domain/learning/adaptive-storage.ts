import { Difficulty, Mode } from '../types';
import { AdaptiveSessionSummary } from './adaptive-progress';

export const ADAPTIVE_STORAGE_KEY = 'tritype.adaptive.v1';
export const MAX_ADAPTIVE_SESSIONS = 50;

export interface AdaptiveKeyBaselineRecord {
  totalAttempts: number;
  errorCount: number;
  errorRate: number | null;
}

export interface AdaptiveKeyPracticeRecord {
  attempts: number;
  errors: number;
  errorRate: number | null;
}

export interface AdaptiveSessionRecord {
  id: string;
  schemaVersion: 1;
  mode: Mode;
  difficulty: Difficulty;
  targetWeakKeys: string[];
  seed: number | null;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wpm: number;
  accuracy: number;
  baselineStats: Record<string, AdaptiveKeyBaselineRecord>;
  practiceStats: Record<string, AdaptiveKeyPracticeRecord>;
  status: 'COMPLETED' | 'ABANDONED';
}

export type AdaptiveStorageReadResult =
  | { ok: true; records: AdaptiveSessionRecord[] }
  | {
      ok: false;
      reason: 'CORRUPTED' | 'UNAVAILABLE';
    };

export type SaveAdaptiveResult =
  | { ok: true; records: AdaptiveSessionRecord[]; duplicate?: boolean }
  | { ok: false; reason: 'INVALID' | 'QUOTA' | 'UNAVAILABLE' | 'CORRUPTED' };

/**
 * Pure helper: Generates an immutable, prefix-stable adaptive session identifier.
 * Format: `adp_${timestamp}_${uuidOrHex}`
 */
export function generateAdaptiveSessionId(now = Date.now(), randomHex?: string): string {
  if (randomHex) {
    return `adp_${now}_${randomHex}`;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `adp_${now}_${crypto.randomUUID()}`;
  }
  const fallback = Math.random().toString(36).substring(2, 10);
  return `adp_${now}_${fallback}`;
}

/**
 * Strict schema validator for AdaptiveSessionRecord (ADP-032).
 * Rejects corruptions, missing schema versions, illegal statistics, and out-of-bounds metrics.
 */
export function isValidAdaptiveSessionRecord(value: unknown): value is AdaptiveSessionRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;

  if (r.schemaVersion !== 1) return false;
  if (typeof r.id !== 'string' || r.id.trim().length === 0) return false;
  if (r.mode !== 'en' && r.mode !== 'pinyin' && r.mode !== 'zhuyin') return false;
  if (r.difficulty !== 'beginner' && r.difficulty !== 'intermediate' && r.difficulty !== 'advanced') return false;
  if (r.status !== 'COMPLETED' && r.status !== 'ABANDONED') return false;

  if (!Array.isArray(r.targetWeakKeys) || !r.targetWeakKeys.every((k) => typeof k === 'string')) {
    return false;
  }

  if (r.seed !== null && (typeof r.seed !== 'number' || !Number.isInteger(r.seed) || !Number.isFinite(r.seed))) {
    return false;
  }

  if (typeof r.startedAt !== 'number' || !Number.isFinite(r.startedAt) || r.startedAt <= 0) return false;
  if (typeof r.completedAt !== 'number' || !Number.isFinite(r.completedAt) || r.completedAt < r.startedAt) return false;
  if (typeof r.durationMs !== 'number' || !Number.isFinite(r.durationMs) || r.durationMs < 0) return false;

  if (typeof r.totalKeystrokes !== 'number' || !Number.isInteger(r.totalKeystrokes) || r.totalKeystrokes < 0) return false;
  if (
    typeof r.correctKeystrokes !== 'number' ||
    !Number.isInteger(r.correctKeystrokes) ||
    r.correctKeystrokes < 0 ||
    r.correctKeystrokes > r.totalKeystrokes
  ) {
    return false;
  }

  if (typeof r.wpm !== 'number' || !Number.isFinite(r.wpm) || r.wpm < 0) return false;
  if (typeof r.accuracy !== 'number' || !Number.isFinite(r.accuracy) || r.accuracy < 0 || r.accuracy > 100) return false;

  // Validate baselineStats
  if (!r.baselineStats || typeof r.baselineStats !== 'object' || Array.isArray(r.baselineStats)) return false;
  for (const [key, b] of Object.entries(r.baselineStats as Record<string, unknown>)) {
    if (typeof key !== 'string') return false;
    if (!b || typeof b !== 'object') return false;
    const bs = b as Record<string, unknown>;
    if (typeof bs.totalAttempts !== 'number' || !Number.isInteger(bs.totalAttempts) || bs.totalAttempts < 0) return false;
    if (
      typeof bs.errorCount !== 'number' ||
      !Number.isInteger(bs.errorCount) ||
      bs.errorCount < 0 ||
      bs.errorCount > bs.totalAttempts
    ) {
      return false;
    }
    if (bs.errorRate !== null) {
      if (typeof bs.errorRate !== 'number' || !Number.isFinite(bs.errorRate) || bs.errorRate < 0 || bs.errorRate > 1) {
        return false;
      }
    }
  }

  // Validate practiceStats
  if (!r.practiceStats || typeof r.practiceStats !== 'object' || Array.isArray(r.practiceStats)) return false;
  for (const [key, p] of Object.entries(r.practiceStats as Record<string, unknown>)) {
    if (typeof key !== 'string') return false;
    if (!p || typeof p !== 'object') return false;
    const ps = p as Record<string, unknown>;
    if (typeof ps.attempts !== 'number' || !Number.isInteger(ps.attempts) || ps.attempts < 0) return false;
    if (
      typeof ps.errors !== 'number' ||
      !Number.isInteger(ps.errors) ||
      ps.errors < 0 ||
      ps.errors > ps.attempts
    ) {
      return false;
    }
    if (ps.errorRate !== null) {
      if (typeof ps.errorRate !== 'number' || !Number.isFinite(ps.errorRate) || ps.errorRate < 0 || ps.errorRate > 1) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Strict, discriminating reader for Adaptive Storage (FIX-01).
 * Distinguishes legal empty storage from corrupted or inaccessible payloads.
 * Fails closed if the storage contains invalid, corrupted, or non-array records.
 */
export function readAdaptiveSessionsStrict(storage?: Storage): AdaptiveStorageReadResult {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return { ok: false, reason: 'UNAVAILABLE' };

  let raw: string | null;
  try {
    raw = store.getItem(ADAPTIVE_STORAGE_KEY);
  } catch (err) {
    console.warn(`[AdaptiveStorage] Failed to read ${ADAPTIVE_STORAGE_KEY}:`, err);
    return { ok: false, reason: 'UNAVAILABLE' };
  }

  // Key missing or empty: legal empty history
  if (raw === null || raw.trim() === '') {
    return { ok: true, records: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (parseErr) {
    console.warn(`[AdaptiveStorage] Corrupted JSON detected in ${ADAPTIVE_STORAGE_KEY}:`, parseErr);
    return { ok: false, reason: 'CORRUPTED' };
  }

  // Root must be an array
  if (!Array.isArray(parsed)) {
    console.warn(`[AdaptiveStorage] Non-array root in ${ADAPTIVE_STORAGE_KEY}`);
    return { ok: false, reason: 'CORRUPTED' };
  }

  // Empty array: legal empty history
  if (parsed.length === 0) {
    return { ok: true, records: [] };
  }

  // All records must strictly pass schema validation.
  // If corrupted records are mixed in, fail-closed to prevent destructive overwrite of raw data.
  const allValid = parsed.every(isValidAdaptiveSessionRecord);
  if (!allValid) {
    console.warn(
      `[AdaptiveStorage] Mixed or corrupted records detected in ${ADAPTIVE_STORAGE_KEY}. Failing closed to prevent data loss.`
    );
    return { ok: false, reason: 'CORRUPTED' };
  }

  return { ok: true, records: parsed as AdaptiveSessionRecord[] };
}

/**
 * Loads and validates adaptive session records from browser LocalStorage.
 * UI-friendly reader: filters out invalid records gracefully without throwing (ADP-035).
 */
export function loadAdaptiveSessions(storage?: Storage): AdaptiveSessionRecord[] {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return [];

  try {
    const raw = store.getItem(ADAPTIVE_STORAGE_KEY);
    if (!raw || raw.trim() === '') return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.warn(`[AdaptiveStorage] Corrupted JSON detected in ${ADAPTIVE_STORAGE_KEY}:`, parseErr);
      return [];
    }
    if (!Array.isArray(parsed)) {
      console.warn(`[AdaptiveStorage] Non-array root in ${ADAPTIVE_STORAGE_KEY}`);
      return [];
    }
    return parsed.filter(isValidAdaptiveSessionRecord);
  } catch (err) {
    console.warn(`[AdaptiveStorage] Failed to access storage for ${ADAPTIVE_STORAGE_KEY}:`, err);
    return [];
  }
}

/**
 * Persists an adaptive session record with single-write idempotency (ADP-033),
 * 50-record FIFO retention (ADP-034), QuotaExceededError graceful degradation (ADP-035, FIX-03),
 * and fail-closed protection against destructive overwrite upon read failure (FIX-01).
 */
export function saveAdaptiveSession(
  record: AdaptiveSessionRecord,
  options?: { maxRecords?: number; storage?: Storage }
): SaveAdaptiveResult {
  const maxRecords = options?.maxRecords ?? MAX_ADAPTIVE_SESSIONS;
  const store = options?.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return { ok: false, reason: 'UNAVAILABLE' };

  if (!isValidAdaptiveSessionRecord(record)) {
    return { ok: false, reason: 'INVALID' };
  }

  // Only COMPLETED sessions can be persisted to the completed log (ADP-033)
  if (record.status !== 'COMPLETED') {
    return { ok: false, reason: 'INVALID' };
  }

  // FIX-01: Must use strict reader. If read fails or data is corrupted, fail-closed to protect raw data.
  const readRes = readAdaptiveSessionsStrict(store);
  if (!readRes.ok) {
    return { ok: false, reason: readRes.reason };
  }
  const current = readRes.records;

  // Single-write idempotency: if record with same ID exists, return immediately without duplicate write
  if (current.some((r) => r.id === record.id)) {
    return { ok: true, records: current, duplicate: true };
  }

  // FIX-03 & FIFO:
  // To ensure the new record is NEVER lost even if its timestamp is older than existing history,
  // we prune the oldest records among the *existing* items when needed.
  const others = current.filter((r) => r.id !== record.id);
  const maxOthers = Math.max(0, maxRecords - 1);
  const keptOthers = others.length > maxOthers ? others.slice(others.length - maxOthers) : others;

  const updated = [...keptOthers, record].sort((a, b) => {
    if (a.completedAt !== b.completedAt) {
      return a.completedAt - b.completedAt;
    }
    return a.id.localeCompare(b.id);
  });

  try {
    store.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify(updated));
    return { ok: true, records: updated };
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : '';
    const isQuota =
      errorName === 'QuotaExceededError' ||
      errorName === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 22);

    if (isQuota) {
      // Graceful degradation: attempt to prune oldest 10 existing records to make space for `record` (ADP-035, FIX-03)
      try {
        const pruneCount = Math.min(10, keptOthers.length);
        const prunedOthers = keptOthers.slice(pruneCount);
        const pruned = [...prunedOthers, record].sort((a, b) => {
          if (a.completedAt !== b.completedAt) {
            return a.completedAt - b.completedAt;
          }
          return a.id.localeCompare(b.id);
        });

        store.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify(pruned));
        return { ok: true, records: pruned };
      } catch {
        return { ok: false, reason: 'QUOTA' };
      }
    }

    return { ok: false, reason: 'UNAVAILABLE' };
  }
}

/**
 * Removes all adaptive training data from LocalStorage (ADP-036).
 */
export function clearAdaptiveSessions(storage?: Storage): void {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  try {
    store.removeItem(ADAPTIVE_STORAGE_KEY);
  } catch {
    // Storage access protection
  }
}

/**
 * Pure adapter: Converts Phase 4 AdaptiveSessionSummary into compliant Phase 5 AdaptiveSessionRecord.
 */
export function adaptSummaryToRecord(
  summary: AdaptiveSessionSummary,
  seed: number | null = null
): AdaptiveSessionRecord {
  const startedAt = summary.startedAt ?? Date.now();
  const completedAt = summary.completedAt ?? Date.now();
  const durationMs = Math.max(0, completedAt - startedAt);

  const baselineStats: Record<string, AdaptiveKeyBaselineRecord> = {};
  for (const [key, b] of Object.entries(summary.baseline.keys)) {
    baselineStats[key] = {
      totalAttempts: b.attempts,
      errorCount: b.errors,
      errorRate: b.errorRate,
    };
  }

  const practiceStats: Record<string, AdaptiveKeyPracticeRecord> = {};
  for (const [key, p] of Object.entries(summary.practiceStats)) {
    practiceStats[key] = {
      attempts: p.attempts,
      errors: p.errors,
      errorRate: p.errorRate,
    };
  }

  return {
    id: summary.sessionId,
    schemaVersion: 1,
    mode: summary.mode,
    difficulty: summary.difficulty,
    targetWeakKeys: [...summary.targetKeys],
    seed: typeof seed === 'number' && Number.isInteger(seed) ? seed : null,
    startedAt,
    completedAt,
    durationMs,
    totalKeystrokes: summary.totalKeys,
    correctKeystrokes: summary.correctKeys,
    wpm: summary.wpm,
    accuracy: summary.accuracy,
    baselineStats,
    practiceStats,
    status: summary.isCompleted ? 'COMPLETED' : 'ABANDONED',
  };
}
