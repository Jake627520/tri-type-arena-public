export * from './types';
export * from './validator';
export * from './en';
export * from './pinyin';
export * from './zhuyin';

import { VocabularyEntry, Difficulty } from './types';
import { ENGLISH_VOCABULARY } from './en';
import { PINYIN_VOCABULARY } from './pinyin';
import { ZHUYIN_VOCABULARY } from './zhuyin';
import { Mode } from '../types';

export const ALL_VOCABULARY: readonly VocabularyEntry[] = Object.freeze([
  ...ENGLISH_VOCABULARY,
  ...PINYIN_VOCABULARY,
  ...ZHUYIN_VOCABULARY,
]);

export const VOCABULARY_BY_MODE: Record<Mode, readonly VocabularyEntry[]> = Object.freeze({
  en: ENGLISH_VOCABULARY,
  pinyin: PINYIN_VOCABULARY,
  zhuyin: ZHUYIN_VOCABULARY,
});

export function getVocabularyPool(mode: Mode, difficulty?: Difficulty): readonly VocabularyEntry[] {
  const pool = VOCABULARY_BY_MODE[mode] || VOCABULARY_BY_MODE.en;
  if (!difficulty) return pool;
  return pool.filter((entry) => entry.difficulty === difficulty);
}
