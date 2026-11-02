import { Lesson, Mode } from './types';
import { normalizeInput } from './zhuyin-map';
import { VOCABULARY_BY_MODE } from './vocabulary';

// Keep the legacy export backed by the same traceable candidate data as gameplay.
export const LESSONS: Record<Mode, Lesson[]> = {
  en: [...VOCABULARY_BY_MODE.en.slice(0, 16)],
  pinyin: [...VOCABULARY_BY_MODE.pinyin.slice(0, 16)],
  zhuyin: [...VOCABULARY_BY_MODE.zhuyin.slice(0, 16)],
};

export function validateLesson(lesson: Lesson, mode: Mode): boolean {
  return !!(
    lesson?.display &&
    lesson?.answer &&
    normalizeInput(lesson.answer, mode) === lesson.answer
  );
}
