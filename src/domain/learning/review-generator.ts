import { Lesson, Mode } from '../types';
import { KeyStat } from './weak-keys';
import { createRng } from '../prng';

export function generateReviewLessons(
  mode: Mode,
  weakKeys: readonly KeyStat[],
  vocabulary: readonly Lesson[],
  count = 10,
  seed?: string | number
): Lesson[] {
  // Only target confirmed weak keys
  const targetKeys = weakKeys.filter((k) => k.isWeak);
  if (targetKeys.length === 0 || vocabulary.length === 0) {
    return [];
  }

  const rng = seed !== undefined ? createRng(seed) : Math.random;
  const selected: Lesson[] = [];
  const selectedIds = new Set<string>();

  // Iterate over weak keys in descending priority order
  for (const weak of targetKeys) {
    if (selected.length >= count) break;

    // Find all vocabulary matches containing this target key
    const matches = vocabulary.filter((lesson) => {
      if (selectedIds.has(lesson.id || lesson.answer)) return false;

      if (mode === 'zhuyin') {
        // Match either the phonetic symbol (e.g. 'ㄜ') or physical key (e.g. 'k')
        if (lesson.answer.includes(weak.key)) return true;
        if (weak.physicalKey && lesson.answer.includes(weak.physicalKey)) return true;
        return false;
      }

      return lesson.answer.toLowerCase().includes(weak.key.toLowerCase());
    });

    if (matches.length > 0) {
      // Pick one match using PRNG or deterministically
      const index = Math.floor(rng() * matches.length);
      const chosen = matches[index];
      selected.push(chosen);
      selectedIds.add(chosen.id || chosen.answer);
    }
  }

  // If we still need more lessons to reach `count` and have matches across any weak key, fill remaining
  if (selected.length < count) {
    const allCandidates = vocabulary.filter((lesson) => {
      if (selectedIds.has(lesson.id || lesson.answer)) return false;
      return targetKeys.some((wk) => {
        if (mode === 'zhuyin') {
          return lesson.answer.includes(wk.key) || (wk.physicalKey && lesson.answer.includes(wk.physicalKey));
        }
        return lesson.answer.toLowerCase().includes(wk.key.toLowerCase());
      });
    });

    while (selected.length < count && allCandidates.length > 0) {
      const idx = Math.floor(rng() * allCandidates.length);
      const [chosen] = allCandidates.splice(idx, 1);
      selected.push(chosen);
      selectedIds.add(chosen.id || chosen.answer);
    }
  }

  return selected;
}
