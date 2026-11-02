import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadDifficulty,
  saveDifficulty,
  loadLearningHistory,
  saveCompletedSession,
  clearLearningHistory,
  LearningSessionRecord,
} from '../../src/shared/storage';

describe('HISTORY & STORAGE: Learning History and Difficulty Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleRecord: LearningSessionRecord = {
    id: 'session-1',
    mode: 'en',
    difficulty: 'beginner',
    startedAt: '2026-10-26T12:00:00.000Z',
    completedAt: '2026-10-26T12:01:00.000Z',
    durationSeconds: 60,
    completedWords: 25,
    totalKeys: 120,
    correctKeys: 115,
    errors: 5,
    wpm: 25,
    accuracy: 95.8,
    score: 250,
  };

  it('LEVEL-005: Difficulty defaults to beginner and persists correctly', () => {
    expect(loadDifficulty()).toBe('beginner');
    saveDifficulty('advanced');
    expect(loadDifficulty()).toBe('advanced');
  });

  it('HISTORY-001: Completed session saved exactly once and restored', () => {
    expect(loadLearningHistory()).toEqual([]);
    const updated = saveCompletedSession(sampleRecord);
    expect(updated).toHaveLength(1);
    expect(loadLearningHistory()).toHaveLength(1);
    expect(loadLearningHistory()[0].id).toBe('session-1');
  });

  it('HISTORY-002: Duplicate writes with same ID are prevented', () => {
    saveCompletedSession(sampleRecord);
    saveCompletedSession(sampleRecord);
    expect(loadLearningHistory()).toHaveLength(1);
  });

  it('HISTORY-003: Reload restores valid history', () => {
    saveCompletedSession(sampleRecord);
    const reloaded = loadLearningHistory();
    expect(reloaded).toEqual([sampleRecord]);
  });

  it('HISTORY-004: Invalid or corrupt JSON is handled safely without crashing', () => {
    localStorage.setItem('tritype.learning.v1', '{corrupt json invalid');
    expect(loadLearningHistory()).toEqual([]);
  });

  it('HISTORY-005: Legacy best scores remain intact when learning history is modified', () => {
    localStorage.setItem('tritype.best.v2', JSON.stringify({ en: 999 }));
    saveCompletedSession(sampleRecord);
    expect(localStorage.getItem('tritype.best.v2')).toBe(JSON.stringify({ en: 999 }));
  });

  it('HISTORY-007: Records stay within 200 retention limit (FIFO)', () => {
    for (let i = 0; i < 210; i++) {
      saveCompletedSession({
        ...sampleRecord,
        id: `sess-${i}`,
      });
    }
    const history = loadLearningHistory();
    expect(history.length).toBe(200);
    // Oldest 10 should have been dropped; first item should be sess-10
    expect(history[0].id).toBe('sess-10');
    expect(history[199].id).toBe('sess-209');
  });

  it('HISTORY-008: Clearing history empties records without erasing difficulty or UI locale', () => {
    saveDifficulty('intermediate');
    localStorage.setItem('tritype.ui.locale', 'zh-TW');
    saveCompletedSession(sampleRecord);

    clearLearningHistory();

    expect(loadLearningHistory()).toEqual([]);
    expect(loadDifficulty()).toBe('intermediate');
    expect(localStorage.getItem('tritype.ui.locale')).toBe('zh-TW');
  });
});
