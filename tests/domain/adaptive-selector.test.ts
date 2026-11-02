import { describe, it, expect } from 'vitest';
import {
  generateAdaptiveLessons,
  calculateLessonWeight,
  AdaptiveSelectorOptions,
} from '../../src/domain/learning/adaptive-selector';
import type { Lesson, Mode, Difficulty } from '../../src/domain/types';
import type { RankedWeakKey } from '../../src/domain/learning/adaptive-priority';

describe('Weighted Adaptive Lesson Selection Engine (Phase 2)', () => {
  const BASE_TIME = 1700000000000;

  // Helper to build test weak key
  function createWeakKey(key: string, priority: number): RankedWeakKey {
    return {
      key,
      priority,
      attempts: 20,
      errors: Math.round(priority * 20),
      errorRate: priority,
      lastPracticed: BASE_TIME,
    };
  }

  // Helper to build test lesson
  function createLesson(
    id: string,
    display: string,
    answer: string,
    mode: Mode = 'en',
    difficulty: Difficulty = 'beginner',
    hint?: string
  ): Lesson {
    return { id, display, answer, mode, difficulty, hint };
  }

  describe('ADP-009: Lesson Weight Calculation', () => {
    it('calculates base weight 1.0 for a lesson with no target weak keys', () => {
      const lesson = createLesson('l1', 'cat', 'cat');
      const weakKeys = [createWeakKey('z', 0.5)];

      const result = calculateLessonWeight(lesson, weakKeys, 'en');
      expect(result.weight).toBeCloseTo(1.0, 6);
      expect(result.matchedCount).toBe(0);
    });

    it('calculates weight with frequency formula: 1 + Sum(priority * frequency)', () => {
      // Lesson: 'banana' has 'a' 3 times, 'b' 1 time, 'n' 2 times
      const lesson = createLesson('l2', 'banana', 'banana');
      const weakKeys = [
        createWeakKey('a', 0.4), // freq 3 -> 0.4 * 3 = 1.2
        createWeakKey('b', 0.5), // freq 1 -> 0.5 * 1 = 0.5
      ];

      // Expected weight = 1.0 + 1.2 + 0.5 = 2.7
      const result = calculateLessonWeight(lesson, weakKeys, 'en');
      expect(result.weight).toBeCloseTo(2.7, 6);
      expect(result.matchedCount).toBe(2);
      expect(result.keyFrequencies).toEqual({ a: 3, b: 1 });
    });

    it('matches English case-insensitively', () => {
      const lesson = createLesson('l3', 'Hello', 'Hello');
      const weakKeys = [createWeakKey('h', 0.6), createWeakKey('l', 0.2)];

      // 'h' freq 1 (0.6), 'l' freq 2 (0.4) -> weight = 1.0 + 0.6 + 0.4 = 2.0
      const result = calculateLessonWeight(lesson, weakKeys, 'en');
      expect(result.weight).toBeCloseTo(2.0, 6);
      expect(result.keyFrequencies).toEqual({ h: 1, l: 2 });
    });
  });

  describe('ADP-010: Sampling Without Replacement (No Duplicates in Round)', () => {
    it('ensures every lesson in the selected round has a distinct ID with zero duplicates', () => {
      const vocabulary: Lesson[] = [];
      for (let i = 0; i < 20; i++) {
        vocabulary.push(createLesson(`lesson-${i}`, `word${i}`, `word${i}`, 'en', 'beginner'));
      }

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('w', 0.5)],
        count: 10,
        seed: 'fixed-seed-123',
      });

      expect(result.lessons).toHaveLength(10);
      const uniqueIds = new Set(result.lessons.map((l) => l.id));
      expect(uniqueIds.size).toBe(10);
    });

    it('FIX-01: Deduplicates candidate pool by lesson identity so duplicate IDs in vocabulary cannot both be selected', () => {
      const vocabulary = [
        createLesson('dup-id', 'alpha', 'alpha', 'en', 'beginner'),
        createLesson('dup-id', 'alpha-clone', 'alpha-clone', 'en', 'beginner'),
        createLesson('other-1', 'beta', 'beta', 'en', 'beginner'),
        createLesson('other-2', 'gamma', 'gamma', 'en', 'beginner'),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('a', 0.5)],
        count: 3,
        seed: 'dup-id-seed',
      });

      const selectedIds = result.lessons.map((l) => l.id);
      const dupCount = selectedIds.filter((id) => id === 'dup-id').length;
      expect(dupCount).toBe(1);
    });

    it('FIX-01: Preserves lessons sharing the same answer when they have distinct displays or IDs', () => {
      // In homophone cases (e.g. "猫" and "毛" in Pinyin/Zhuyin, or "lead" noun/verb in English)
      const vocabulary = [
        createLesson('lead-verb', 'lead (verb)', 'lead', 'en', 'beginner'),
        createLesson('lead-noun', 'lead (noun)', 'lead', 'en', 'beginner'),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('l', 0.5)],
        count: 2,
        seed: 'homophone-seed',
      });

      expect(result.lessons).toHaveLength(2);
      expect(result.lessons.map((l) => l.id)).toEqual(expect.arrayContaining(['lead-verb', 'lead-noun']));
    });
  });

  describe('ADP-011: Multi-Key Coverage Optimization', () => {
    it('prioritizes selecting lessons covering distinct target weak keys across candidates', () => {
      // 3 weak keys: 'x', 'y', 'z'
      // Pool has specific words containing x, y, and z separately, plus neutral words
      const vocabulary = [
        createLesson('lx', 'box', 'box', 'en', 'beginner'),
        createLesson('ly', 'toy', 'toy', 'en', 'beginner'),
        createLesson('lz', 'zoo', 'zoo', 'en', 'beginner'),
        createLesson('l-neutral-1', 'cat', 'cat', 'en', 'beginner'),
        createLesson('l-neutral-2', 'dog', 'dog', 'en', 'beginner'),
      ];

      const weakKeys = [
        createWeakKey('x', 0.8),
        createWeakKey('y', 0.7),
        createWeakKey('z', 0.6),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys,
        count: 3,
        seed: 'multi-key-seed',
      });

      expect(result.lessons).toHaveLength(3);
      const selectedIds = result.lessons.map((l) => l.id);
      // All 3 target keys should be covered in the 3 selected lessons
      expect(selectedIds).toContain('lx');
      expect(selectedIds).toContain('ly');
      expect(selectedIds).toContain('lz');
    });
  });

  describe('ADP-012: Backfill Fallback from Active Catalog', () => {
    it('backfills from general pool when matching weak-key lessons are fewer than requested count', () => {
      // Only 2 lessons match weak key 'q', but requested count is 5
      const vocabulary = [
        createLesson('q1', 'quick', 'quick', 'en', 'beginner'),
        createLesson('q2', 'quiet', 'quiet', 'en', 'beginner'),
        createLesson('n1', 'apple', 'apple', 'en', 'beginner'),
        createLesson('n2', 'bread', 'bread', 'en', 'beginner'),
        createLesson('n3', 'chair', 'chair', 'en', 'beginner'),
        createLesson('n4', 'dance', 'dance', 'en', 'beginner'),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('q', 0.9)],
        count: 5,
        seed: 'backfill-seed',
      });

      expect(result.lessons).toHaveLength(5);
      expect(result.matchedCount).toBe(2);
      expect(result.usedBackfill).toBe(true);
      expect(result.requestedCount).toBe(5);
      expect(result.selectedCount).toBe(5);

      const ids = result.lessons.map((l) => l.id);
      expect(ids).toContain('q1');
      expect(ids).toContain('q2');
    });
  });

  describe('ADP-013: Cycle Boundary Deduplication (FIX-02)', () => {
    it('prevents the first lesson of a new cycle from matching previousLessonId when pool size > 1', () => {
      const vocabulary = [
        createLesson('repeat-id', 'test1', 'test1', 'en', 'beginner'),
        createLesson('other-id-1', 'test2', 'test2', 'en', 'beginner'),
        createLesson('other-id-2', 'test3', 'test3', 'en', 'beginner'),
      ];

      for (let s = 0; s < 5; s++) {
        const result = generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary,
          weakKeys: [createWeakKey('t', 0.5)],
          count: 2,
          seed: `cycle-seed-${s}`,
          previousLessonId: 'repeat-id',
        });

        expect(result.lessons[0].id).not.toBe('repeat-id');
      }
    });

    it('FIX-02: Strictly prevents previousLessonId from becoming the first lesson even when it matches the highest-priority weak key in Stage 1', () => {
      // Specified scenario:
      // previousLessonId = "A"
      // A -> covers highest-priority weak key ('x')
      // B -> covers lower-priority weak key ('y')
      // C -> neutral lesson
      const lessonA = createLesson('A', 'axe', 'axe', 'en', 'beginner'); // has 'x'
      const lessonB = createLesson('B', 'boy', 'boy', 'en', 'beginner'); // has 'y'
      const lessonC = createLesson('C', 'cat', 'cat', 'en', 'beginner'); // neutral

      const vocabulary = [lessonA, lessonB, lessonC];
      const weakKeys = [
        createWeakKey('x', 0.9), // highest priority
        createWeakKey('y', 0.4), // lower priority
      ];

      // Test across multiple seeds to ensure deterministic guarantee
      for (const seed of ['seed-1', 'seed-2', 'seed-3', 'seed-42', 'test-seed']) {
        const result = generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary,
          weakKeys,
          count: 3,
          seed,
          previousLessonId: 'A',
        });

        expect(result.lessons).toHaveLength(3);
        // First lesson must NEVER be 'A'
        expect(result.lessons[0].id).not.toBe('A');
        expect(result.lessons[0].id).toBe('B');

        // But 'A' is NOT permanently excluded; it appears at index 1
        expect(result.lessons[1].id).toBe('A');
      }
    });

    it('FIX-02: Enforces boundary deduplication in Stage 2 when no matching weak keys exist', () => {
      // With 2 items [A, B] and count 2: B must be slot 0, and A must be slot 1 (never permanently excluded)
      const twoLessons = [
        createLesson('A', 'apple', 'apple', 'en', 'beginner'),
        createLesson('B', 'bread', 'bread', 'en', 'beginner'),
      ];

      const twoResult = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: twoLessons,
        weakKeys: [],
        count: 2,
        seed: 'two-stage2-seed',
        previousLessonId: 'A',
      });

      expect(twoResult.lessons).toHaveLength(2);
      expect(twoResult.lessons[0].id).toBe('B');
      expect(twoResult.lessons[1].id).toBe('A');

      // With 3 items [A, B, C] and count 3 across multiple seeds: first is never A, but A is always included
      const threeLessons = [
        ...twoLessons,
        createLesson('C', 'chair', 'chair', 'en', 'beginner'),
      ];

      for (let s = 0; s < 5; s++) {
        const result = generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary: threeLessons,
          weakKeys: [],
          count: 3,
          seed: `stage2-seed-${s}`,
          previousLessonId: 'A',
        });

        expect(result.lessons[0].id).not.toBe('A');
        expect(result.lessons.map((l) => l.id)).toContain('A');
      }
    });

    it('FIX-02: Permits previousLessonId as sole exception when candidate pool contains exactly one lesson', () => {
      const singleLesson = createLesson('A', 'alone', 'alone', 'en', 'beginner');

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [singleLesson],
        weakKeys: [createWeakKey('a', 0.9)],
        count: 1,
        previousLessonId: 'A',
      });

      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].id).toBe('A');
    });
  });

  describe('ADP-014: Mode and Difficulty Isolation', () => {
    it('strictly filters lessons by requested mode and difficulty tier', () => {
      const vocabulary = [
        createLesson('en-beg', 'cat', 'cat', 'en', 'beginner'),
        createLesson('en-adv', 'complex', 'complex', 'en', 'advanced'),
        createLesson('zh-beg', '中', 'ㄓㄨㄥ', 'zhuyin', 'beginner', 'ㄓㄨㄥ'),
        createLesson('py-beg', 'zhong', 'zhong', 'pinyin', 'beginner'),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('c', 0.8)],
        count: 5,
        seed: 'iso-seed',
      });

      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].id).toBe('en-beg');
      expect(result.lessons[0].mode).toBe('en');
      expect(result.lessons[0].difficulty).toBe('beginner');
    });

    it('FIX-03: Rejects lessons missing mode metadata when fallbackMetadata is not provided', () => {
      const untaggedModeLesson: Lesson = {
        id: 'no-mode',
        display: 'test',
        answer: 'test',
        difficulty: 'beginner',
        // mode is undefined
      };

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [untaggedModeLesson],
        weakKeys: [createWeakKey('t', 0.5)],
        count: 1,
      });

      expect(result.lessons).toHaveLength(0);
    });

    it('FIX-03: Rejects lessons missing difficulty metadata when fallbackMetadata is not provided', () => {
      const untaggedDiffLesson: Lesson = {
        id: 'no-diff',
        display: 'test',
        answer: 'test',
        mode: 'en',
        // difficulty is undefined
      };

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [untaggedDiffLesson],
        weakKeys: [createWeakKey('t', 0.5)],
        count: 1,
      });

      expect(result.lessons).toHaveLength(0);
    });

    it('FIX-03: Rejects lessons missing both mode and difficulty when fallbackMetadata is not provided', () => {
      const rawLesson: Lesson = {
        id: 'raw',
        display: 'test',
        answer: 'test',
      };

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [rawLesson],
        weakKeys: [createWeakKey('t', 0.5)],
        count: 1,
      });

      expect(result.lessons).toHaveLength(0);
    });

    it('FIX-03: Accepts untagged lessons when caller explicitly supplies matching fallbackMetadata', () => {
      const rawLesson: Lesson = {
        id: 'raw-trusted',
        display: 'test',
        answer: 'test',
      };

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [rawLesson],
        weakKeys: [createWeakKey('t', 0.5)],
        count: 1,
        fallbackMetadata: {
          mode: 'en',
          difficulty: 'beginner',
        },
      });

      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].id).toBe('raw-trusted');
    });

    it('FIX-03: Rejects lessons with explicit metadata mismatch even if fallbackMetadata matches options', () => {
      const zhuyinLesson: Lesson = {
        id: 'zh-explicit',
        display: '中',
        answer: 'ㄓㄨㄥ',
        mode: 'zhuyin', // explicitly zhuyin
        difficulty: 'beginner',
      };

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [zhuyinLesson],
        weakKeys: [],
        count: 1,
        fallbackMetadata: {
          mode: 'en',
          difficulty: 'beginner',
        },
      });

      expect(result.lessons).toHaveLength(0);
    });
  });

  describe('ADP-015: Seeded Deterministic Reproducibility', () => {
    it('produces identical lesson sequence when provided identical seed and inputs', () => {
      const vocabulary: Lesson[] = [];
      for (let i = 0; i < 30; i++) {
        vocabulary.push(createLesson(`l-${i}`, `item${i}`, `item${i}`, 'en', 'beginner'));
      }

      const options: AdaptiveSelectorOptions = {
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('i', 0.6), createWeakKey('t', 0.4)],
        count: 10,
        seed: 'deterministic-42',
      };

      const run1 = generateAdaptiveLessons(options);
      const run2 = generateAdaptiveLessons(options);

      expect(run1.lessons.map((l) => l.id)).toEqual(run2.lessons.map((l) => l.id));
    });
  });

  describe('ADP-016: Divergence with Distinct Seeds', () => {
    it('produces varying lesson sequences with different seeds on a diverse pool', () => {
      const vocabulary: Lesson[] = [];
      for (let i = 0; i < 50; i++) {
        vocabulary.push(createLesson(`l-${i}`, `word${i}`, `word${i}`, 'en', 'beginner'));
      }

      const runA = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('w', 0.5)],
        count: 10,
        seed: 'seed-alpha',
      });

      const runB = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('w', 0.5)],
        count: 10,
        seed: 'seed-beta-99999',
      });

      const idsA = runA.lessons.map((l) => l.id);
      const idsB = runB.lessons.map((l) => l.id);
      expect(idsA).not.toEqual(idsB);
    });
  });

  describe('ADP-017: Single-Lesson Pool Safety', () => {
    it('terminates safely without infinite loop when pool contains exactly one lesson', () => {
      const singleLesson = createLesson('only-one', 'solo', 'solo', 'en', 'beginner');

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [singleLesson],
        weakKeys: [createWeakKey('s', 0.5)],
        count: 10,
        previousLessonId: 'only-one', // Exception: pool size = 1 allows matching previousLessonId
      });

      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].id).toBe('only-one');
      expect(result.selectedCount).toBe(1);
    });
  });

  describe('Zhuyin First-Tone Space Key Runtime Matching', () => {
    it('matches Space key (" ") via runtime tone-derived answer (e.g. 中午 -> ㄓㄨㄥ ㄨˇ)', () => {
      // 中午 (中: 1st tone requires Space, 午: 3rd tone has ˇ)
      // Raw answer in catalog: ㄓㄨㄥㄨˇ
      // Runtime answer: ㄓㄨㄥ ㄨˇ (contains Space ' ')
      const lesson = createLesson('zh-noon', '中午', 'ㄓㄨㄥㄨˇ', 'zhuyin', 'beginner', 'ㄓㄨㄥ ㄨˇ');
      const weakKeys = [createWeakKey(' ', 0.8)];

      const weightResult = calculateLessonWeight(lesson, weakKeys, 'zhuyin');
      // ' ' appears once -> weight = 1.0 + 0.8 * 1 = 1.8
      expect(weightResult.weight).toBeCloseTo(1.8, 6);
      expect(weightResult.matchedCount).toBe(1);
      expect(weightResult.keyFrequencies).toEqual({ ' ': 1 });

      // In selection, noon should be matched and chosen
      const selection = generateAdaptiveLessons({
        mode: 'zhuyin',
        difficulty: 'beginner',
        vocabulary: [
          lesson,
          createLesson('zh-watch', '手錶', 'ㄕㄡˇㄅㄧㄠˇ', 'zhuyin', 'beginner', 'ㄕㄡˇ ㄅㄧㄠˇ'), // No first tone, no Space
        ],
        weakKeys,
        count: 1,
        seed: 'zh-seed',
      });

      expect(selection.lessons).toHaveLength(1);
      expect(selection.lessons[0].id).toBe('zh-noon');
      expect(selection.matchedCount).toBe(1);
    });

    it('accurately distinguishes tone positions (middle vs trailing Space) without double spacing', () => {
      // 空中 (空: ㄎㄨㄥ 1st tone, 中: ㄓㄨㄥ 1st tone) -> Runtime answer: "ㄎㄨㄥ ㄓㄨㄥ " (2 spaces)
      const lessonDoubleFirst = createLesson('zh-air', '空中', 'ㄎㄨㄥㄓㄨㄥ', 'zhuyin', 'beginner', 'ㄎㄨㄥ ㄓㄨㄥ');
      const weakKeys = [createWeakKey(' ', 0.5)];

      const weightResult = calculateLessonWeight(lessonDoubleFirst, weakKeys, 'zhuyin');
      // 2 spaces -> 1.0 + 0.5 * 2 = 2.0
      expect(weightResult.weight).toBeCloseTo(2.0, 6);
      expect(weightResult.keyFrequencies).toEqual({ ' ': 2 });
    });
  });

  describe('Boundary & Edge Cases', () => {
    it('returns empty result when vocabulary is empty', () => {
      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary: [],
        weakKeys: [createWeakKey('a', 0.5)],
        count: 10,
      });

      expect(result.lessons).toEqual([]);
      expect(result.selectedCount).toBe(0);
      expect(result.matchedCount).toBe(0);
      expect(result.usedBackfill).toBe(false);
    });

    it('returns empty result when no vocabulary matches requested mode and difficulty', () => {
      const vocabulary = [createLesson('en-adv', 'dog', 'dog', 'en', 'advanced')];
      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('d', 0.5)],
        count: 5,
      });

      expect(result.lessons).toEqual([]);
      expect(result.selectedCount).toBe(0);
    });

    it('safely handles empty weakKeys by drawing standard lessons without backfill flag', () => {
      const vocabulary = [
        createLesson('l1', 'one', 'one', 'en', 'beginner'),
        createLesson('l2', 'two', 'two', 'en', 'beginner'),
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [],
        count: 2,
        seed: 'no-weak-keys',
      });

      expect(result.lessons).toHaveLength(2);
      expect(result.matchedCount).toBe(0);
      expect(result.usedBackfill).toBe(false);
    });

    it('preserves immutability of vocabulary and weakKeys inputs', () => {
      const vocabulary = Object.freeze([
        Object.freeze(createLesson('l1', 'one', 'one', 'en', 'beginner')),
      ]);
      const weakKeys = Object.freeze([
        Object.freeze(createWeakKey('o', 0.5)),
      ]);

      expect(() =>
        generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary,
          weakKeys,
          count: 1,
        })
      ).not.toThrow();
    });

    it('safely handles invalid count values (0, negative, NaN, Infinity)', () => {
      const vocabulary = [createLesson('l1', 'one', 'one', 'en', 'beginner')];

      expect(
        generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary,
          weakKeys: [],
          count: 0,
        }).lessons
      ).toEqual([]);

      expect(
        generateAdaptiveLessons({
          mode: 'en',
          difficulty: 'beginner',
          vocabulary,
          weakKeys: [],
          count: -5,
        }).lessons
      ).toEqual([]);

      const nanResult = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [],
        count: NaN,
      });
      // Fallback to default 10 (or capped by pool size 1)
      expect(nanResult.lessons).toHaveLength(1);
    });

    it('handles lessons with missing id by generating a stable identity fallback', () => {
      const vocabulary: Lesson[] = [
        { display: 'apple', answer: 'apple', mode: 'en', difficulty: 'beginner' },
        { display: 'banana', answer: 'banana', mode: 'en', difficulty: 'beginner' },
      ];

      const result = generateAdaptiveLessons({
        mode: 'en',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey('a', 0.5)],
        count: 2,
        seed: 'fallback-id-seed',
      });

      expect(result.lessons).toHaveLength(2);
      expect(result.lessons[0].display).not.toEqual(result.lessons[1].display);
    });

    it('FIX-04: candidates are validated before deduplication so valid lesson with duplicate ID is not blocked by earlier malformed entry', () => {
      const vocabulary: Lesson[] = [
        // Duplicate ID: first entry is malformed Zhuyin (missing hint)
        { id: 'dup-zh-1', display: '山', answer: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner', hint: '' },
        // Second entry with identical ID is valid Zhuyin
        { id: 'dup-zh-1', display: '山', answer: 'ㄕㄢ', mode: 'zhuyin', difficulty: 'beginner', hint: 'ㄕㄢ' },
        // A second distinct valid lesson
        { id: 'dup-zh-2', display: '水', answer: 'ㄕㄨㄟˇ', mode: 'zhuyin', difficulty: 'beginner', hint: 'ㄕㄨㄟˇ' },
      ];

      const result = generateAdaptiveLessons({
        mode: 'zhuyin',
        difficulty: 'beginner',
        vocabulary,
        weakKeys: [createWeakKey(' ', 0.8)],
        count: 2,
        seed: 42,
      });

      // The valid lesson with ID 'dup-zh-1' must be selected, NOT blocked by the malformed first entry!
      expect(result.lessons.some((l) => l.id === 'dup-zh-1')).toBe(true);
      // Deduplication holds: only one lesson with 'dup-zh-1' is in the selected round
      const ids = result.lessons.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
