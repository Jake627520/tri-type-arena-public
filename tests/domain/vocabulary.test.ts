import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_VOCABULARY,
  ENGLISH_VOCABULARY,
  PINYIN_VOCABULARY,
  ZHUYIN_VOCABULARY,
  validateVocabularyEntry,
} from '../../src/domain/vocabulary';
import { VocabularyEntry } from '../../src/domain/vocabulary/types';

describe('VOCAB: Vocabulary Expansion & Contract Integrity', () => {
  it('VOCAB-001: English vocabulary count is at least 500', () => {
    expect(ENGLISH_VOCABULARY.length).toBeGreaterThanOrEqual(500);
  });

  it('VOCAB-002: Pinyin vocabulary count is at least 300', () => {
    expect(PINYIN_VOCABULARY.length).toBeGreaterThanOrEqual(300);
  });

  it('VOCAB-003: Zhuyin vocabulary count is at least 300', () => {
    expect(ZHUYIN_VOCABULARY.length).toBeGreaterThanOrEqual(300);
  });

  it('VOCAB-004: All vocabulary IDs are strictly unique across all modes', () => {
    const idSet = new Set<string>();
    for (const entry of ALL_VOCABULARY) {
      expect(entry.id).toBeTruthy();
      expect(idSet.has(entry.id), `Duplicate ID detected: ${entry.id}`).toBe(false);
      idSet.add(entry.id);
    }
    expect(idSet.size).toBe(ALL_VOCABULARY.length);
  });

  it('VOCAB-005: No duplicate (display, answer) entries within any mode', () => {
    for (const [mode, entries] of [
      ['en', ENGLISH_VOCABULARY],
      ['pinyin', PINYIN_VOCABULARY],
      ['zhuyin', ZHUYIN_VOCABULARY],
    ] as const) {
      const contentSet = new Set<string>();
      for (const entry of entries) {
        const key = `${entry.display}::${entry.answer}`;
        expect(contentSet.has(key), `Duplicate content in mode ${mode}: ${key}`).toBe(false);
        contentSet.add(key);
      }
    }
  });

  it('VOCAB-006: All vocabulary entries pass strict validation and normalization', () => {
    for (const entry of ALL_VOCABULARY) {
      const result = validateVocabularyEntry(entry);
      expect(result.valid, `Entry ${entry.id} (${entry.display}) failed validation: ${result.error}`).toBe(true);
    }
  });

  it('VOCAB-007: Every category and difficulty tier is valid', () => {
    const validDifficulties = new Set(['beginner', 'intermediate', 'advanced']);
    for (const entry of ALL_VOCABULARY) {
      expect(validDifficulties.has(entry.difficulty)).toBe(true);
      expect(typeof entry.category).toBe('string');
      expect(entry.category.trim().length).toBeGreaterThan(0);
    }
  });

  it('VOCAB-008: Difficulty distributions satisfy target minimums for all modes', () => {
    const countByTier = (entries: VocabularyEntry[]) => ({
      beginner: entries.filter((e) => e.difficulty === 'beginner').length,
      intermediate: entries.filter((e) => e.difficulty === 'intermediate').length,
      advanced: entries.filter((e) => e.difficulty === 'advanced').length,
    });

    const enCounts = countByTier(ENGLISH_VOCABULARY);
    expect(enCounts.beginner, 'English beginner tier >= 200').toBeGreaterThanOrEqual(200);
    expect(enCounts.intermediate, 'English intermediate tier >= 200').toBeGreaterThanOrEqual(200);
    expect(enCounts.advanced, 'English advanced tier >= 100').toBeGreaterThanOrEqual(100);

    const pinyinCounts = countByTier(PINYIN_VOCABULARY);
    expect(pinyinCounts.beginner, 'Pinyin beginner tier >= 120').toBeGreaterThanOrEqual(120);
    expect(pinyinCounts.intermediate, 'Pinyin intermediate tier >= 120').toBeGreaterThanOrEqual(120);
    expect(pinyinCounts.advanced, 'Pinyin advanced tier >= 60').toBeGreaterThanOrEqual(60);

    const zhuyinCounts = countByTier(ZHUYIN_VOCABULARY);
    expect(zhuyinCounts.beginner, 'Zhuyin beginner tier >= 120').toBeGreaterThanOrEqual(120);
    expect(zhuyinCounts.intermediate, 'Zhuyin intermediate tier >= 120').toBeGreaterThanOrEqual(120);
    expect(zhuyinCounts.advanced, 'Zhuyin advanced tier >= 60').toBeGreaterThanOrEqual(60);
  });

  it('VOCAB-009: Invalid vocabulary entries fail validation as expected', () => {
    // Malformed English entry (capital letters in answer)
    expect(
      validateVocabularyEntry({
        id: 'bad-1',
        mode: 'en',
        display: 'Bad',
        answer: 'BadAnswer',
        difficulty: 'beginner',
        category: 'test',
      }).valid
    ).toBe(false);

    // Malformed Pinyin entry (illegal symbols)
    expect(
      validateVocabularyEntry({
        id: 'bad-2',
        mode: 'pinyin',
        display: '测试',
        answer: 'ce shi!',
        difficulty: 'beginner',
        category: 'test',
      }).valid
    ).toBe(false);

    // Malformed Zhuyin entry (invalid Latin letters in Zhuyin answer)
    expect(
      validateVocabularyEntry({
        id: 'bad-3',
        mode: 'zhuyin',
        display: '測試',
        answer: 'ceshi',
        difficulty: 'beginner',
        category: 'test',
      }).valid
    ).toBe(false);
  });

  it('VOCAB-010: Provenance documentation file exists and contains source attributions', () => {
    const docPath = path.resolve(__dirname, '../../docs/VOCABULARY_PROVENANCE.md');
    expect(fs.existsSync(docPath), 'docs/VOCABULARY_PROVENANCE.md must exist').toBe(true);
    const content = fs.readFileSync(docPath, 'utf8');
    expect(content).toContain('English Vocabulary');
    expect(content).toContain('Simplified Chinese Pinyin');
    expect(content).toContain('Traditional Chinese Zhuyin');
    expect(content).toContain('License');
  });

  it('Chinese source candidates retain expected common readings', () => {
    expect(PINYIN_VOCABULARY.find((e) => e.display === '早餐')?.answer).toBe('zaocan');
    expect(ZHUYIN_VOCABULARY.find((e) => e.display === '早餐')?.hint).toBe('ㄗㄠˇ ㄘㄢ');
  });

  it('VOCAB-013: All Chinese entries have exact 1-to-1 character to syllable alignment', () => {
    for (const e of PINYIN_VOCABULARY) {
      if (e.hint) {
        const syllables = e.hint.split(' ');
        expect(syllables.length, `Pinyin ${e.id} (${e.display}) syllable count mismatch`).toBe(e.display.length);
      }
    }

    for (const e of ZHUYIN_VOCABULARY) {
      if (e.hint) {
        const syllables = e.hint.split(' ');
        expect(syllables.length, `Zhuyin ${e.id} (${e.display}) syllable count mismatch`).toBe(e.display.length);
        expect(e.answer, `Zhuyin ${e.id} answer must match concatenated hint`).toBe(e.hint.replace(/ /g, ''));
      }
    }
  });
});
