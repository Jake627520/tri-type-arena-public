import { VocabularyEntry } from './types';

const EN_ANSWER_REGEX = /^[a-z]+$/;
const PINYIN_ANSWER_REGEX = /^[a-z]+$/;
const ZHUYIN_ANSWER_REGEX = /^[ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ˙ˊˇˋ]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateVocabularyEntry(entry: VocabularyEntry): ValidationResult {
  if (!entry) {
    return { valid: false, error: 'Entry is null or undefined' };
  }

  if (!entry.id || typeof entry.id !== 'string' || entry.id.trim().length === 0) {
    return { valid: false, error: 'Invalid or missing ID' };
  }

  if (!entry.display || typeof entry.display !== 'string' || entry.display.trim().length === 0) {
    return { valid: false, error: 'Invalid or missing display text' };
  }

  if (!entry.answer || typeof entry.answer !== 'string' || entry.answer.trim().length === 0) {
    return { valid: false, error: 'Invalid or missing answer string' };
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(entry.difficulty)) {
    return { valid: false, error: `Invalid difficulty tier: ${entry.difficulty}` };
  }

  if (!['en', 'pinyin', 'zhuyin'].includes(entry.mode)) {
    return { valid: false, error: `Invalid mode: ${entry.mode}` };
  }

  if (entry.mode === 'en') {
    if (!EN_ANSWER_REGEX.test(entry.answer)) {
      return { valid: false, error: `English answer contains invalid characters: ${entry.answer}` };
    }
  } else if (entry.mode === 'pinyin') {
    if (!PINYIN_ANSWER_REGEX.test(entry.answer)) {
      return { valid: false, error: `Pinyin answer contains invalid characters: ${entry.answer}` };
    }
  } else if (entry.mode === 'zhuyin') {
    if (!ZHUYIN_ANSWER_REGEX.test(entry.answer)) {
      return { valid: false, error: `Zhuyin answer contains invalid characters: ${entry.answer}` };
    }
  }

  return { valid: true };
}
