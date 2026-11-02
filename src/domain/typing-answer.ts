import type { Lesson, Mode } from './types';

// Taiwan standard Daqian layout tone marks:
// 2nd tone: ˊ (Digit6), 3rd tone: ˇ (Digit3), 4th tone: ˋ (Digit4), Light tone: ˙ (Digit7)
// 1st tone (陰平): physical Space key.
const TONE_MARKS = /[ˊˇˋ˙]$/;

/**
 * Pure function deriving runtime typing answer for a lesson based on mode and syllable hints.
 *
 * Rules:
 * - Zhuyin mode: Each 1st tone (陰平) syllable requires an ASCII Space (' ').
 * - 2nd, 3rd, 4th, and light tones do NOT add a space.
 * - Same syllable never has duplicate spaces.
 * - Missing or malformed hint for Zhuyin throws an Error (fail-closed, never silently returns wrong answers).
 * - Non-Zhuyin modes (English, Pinyin) return original answer unchanged.
 */
export function getTypingAnswer(
  lesson: Pick<Lesson, 'answer' | 'hint' | 'display'> & { mode?: Mode },
  fallbackMode?: Mode
): string {
  const mode = lesson.mode ?? fallbackMode;
  if (mode !== 'zhuyin') {
    return lesson.answer;
  }

  if (!lesson.hint || typeof lesson.hint !== 'string' || !lesson.hint.trim()) {
    throw new Error(`[ZH-SPACE] Missing Zhuyin hint for lesson: "${lesson.display}" (${lesson.answer})`);
  }

  const syllables = lesson.hint.trim().split(/\s+/);
  const displayChars = [...lesson.display];

  if (syllables.length !== displayChars.length) {
    throw new Error(
      `[ZH-SPACE] Malformed Zhuyin hint for lesson: "${lesson.display}". Expected ${displayChars.length} syllables, got ${syllables.length} ("${lesson.hint}")`
    );
  }

  return syllables
    .map((syllable) => {
      const trimmed = syllable.trim();
      const hasToneMark = TONE_MARKS.test(trimmed);
      return hasToneMark ? trimmed : `${trimmed} `;
    })
    .join('');
}

export function prepareTypingLesson<T extends Lesson>(lesson: T, fallbackMode?: Mode): T {
  const answer = getTypingAnswer(lesson, fallbackMode);
  return answer === lesson.answer ? lesson : { ...lesson, answer };
}
