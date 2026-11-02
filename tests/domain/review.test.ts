import { describe, it, expect } from 'vitest';
import { generateReviewLessons } from '../../src/domain/learning/review-generator';
import { KeyStat } from '../../src/domain/learning/weak-keys';
import { Lesson } from '../../src/domain/types';

describe('REVIEW: Personalized Review Mode (FR-006)', () => {
  const sampleVocabulary: Lesson[] = [
    { id: 'v1', display: 'apple', answer: 'apple' },
    { id: 'v2', display: 'banana', answer: 'banana' },
    { id: 'v3', display: 'zebra', answer: 'zebra' },
    { id: 'v4', display: 'jazz', answer: 'jazz' },
    { id: 'v5', display: 'quiz', answer: 'quiz' },
  ];

  const sampleWeakKeys: KeyStat[] = [
    {
      key: 'z',
      attempts: 20,
      errors: 10,
      errorRate: 0.5,
      lastPracticed: '2026-10-26T12:00:00Z',
      isWeak: true,
      insufficientData: false,
    },
  ];

  it('REVIEW-001: Weak keys produce exercises targeting those specific keys', () => {
    const lessons = generateReviewLessons('en', sampleWeakKeys, sampleVocabulary, 3);
    expect(lessons.length).toBeGreaterThan(0);
    // Every selected lesson must contain the target weak key 'z'
    for (const l of lessons) {
      expect(l.answer).toContain('z');
    }
  });

  it('REVIEW-002: Handles empty weak-key set safely by returning empty list', () => {
    const lessons = generateReviewLessons('en', [], sampleVocabulary, 3);
    expect(lessons).toEqual([]);
  });

  it('REVIEW-003: Review lessons remain valid lessons with display and answer', () => {
    const lessons = generateReviewLessons('en', sampleWeakKeys, sampleVocabulary, 2);
    for (const l of lessons) {
      expect(l.display).toBeTruthy();
      expect(l.answer).toBeTruthy();
    }
  });

  it('REVIEW-005: Review generation is deterministic with a seed', () => {
    const resA = generateReviewLessons('en', sampleWeakKeys, sampleVocabulary, 3, 'review-seed-1');
    const resB = generateReviewLessons('en', sampleWeakKeys, sampleVocabulary, 3, 'review-seed-1');
    expect(resA.map((l) => l.answer)).toEqual(resB.map((l) => l.answer));
  });

  it('REVIEW-006: Review recommendations prioritize highest error rate keys first', () => {
    const multiWeak: KeyStat[] = [
      {
        key: 'j',
        attempts: 20,
        errors: 12, // 60%
        errorRate: 0.6,
        lastPracticed: '2026-10-26T12:00:00Z',
        isWeak: true,
        insufficientData: false,
      },
      {
        key: 'z',
        attempts: 20,
        errors: 6, // 30%
        errorRate: 0.3,
        lastPracticed: '2026-10-26T12:00:00Z',
        isWeak: true,
        insufficientData: false,
      },
    ];

    const lessons = generateReviewLessons('en', multiWeak, sampleVocabulary, 2, 'seed-priority');
    expect(lessons.length).toBeGreaterThan(0);
    // Highest error rate 'j' should be included first
    expect(lessons[0].answer).toContain('j');
  });
});
