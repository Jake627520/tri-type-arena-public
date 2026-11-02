import { describe, it, expect } from 'vitest';
import { ShuffleBag } from '../../src/domain/shuffle-bag';
import { createRng } from '../../src/domain/prng';

describe('SELECT: Seeded ShuffleBag Lesson Selection Engine', () => {
  const sampleLessons = [
    { display: 'apple', answer: 'apple' },
    { display: 'banana', answer: 'banana' },
    { display: 'cherry', answer: 'cherry' },
    { display: 'date', answer: 'date' },
    { display: 'elderberry', answer: 'elderberry' },
  ];

  it('SELECT-001: A new session draws a shuffled selection rather than sequential order', () => {
    const bag = new ShuffleBag(sampleLessons, createRng('seed-101'));
    const drawn = [bag.next(), bag.next(), bag.next(), bag.next(), bag.next()];
    const drawnAnswers = drawn.map((d) => d.answer);
    const rawAnswers = sampleLessons.map((l) => l.answer);

    expect(drawnAnswers).not.toEqual(rawAnswers);
    expect(new Set(drawnAnswers).size).toBe(sampleLessons.length);
  });

  it('SELECT-002: Zero duplicates occur before the current pool is fully exhausted', () => {
    const bag = new ShuffleBag(sampleLessons, createRng('seed-102'));
    const seen = new Set<string>();

    for (let i = 0; i < sampleLessons.length; i++) {
      const item = bag.next();
      expect(seen.has(item.answer), `Premature duplicate: ${item.answer}`).toBe(false);
      seen.add(item.answer);
    }
    expect(seen.size).toBe(sampleLessons.length);
  });

  it('SELECT-003: Same seed and same pool produce strictly identical draw sequence', () => {
    const bagA = new ShuffleBag(sampleLessons, createRng('consistent-seed-42'));
    const bagB = new ShuffleBag(sampleLessons, createRng('consistent-seed-42'));

    const sequenceA = Array.from({ length: 20 }, () => bagA.next().answer);
    const sequenceB = Array.from({ length: 20 }, () => bagB.next().answer);

    expect(sequenceA).toEqual(sequenceB);
  });

  it('SELECT-004: Different seeds produce distinct sequences in representative tests', () => {
    const bagA = new ShuffleBag(sampleLessons, createRng('seed-alpha'));
    const bagB = new ShuffleBag(sampleLessons, createRng('seed-beta'));

    const seqA = Array.from({ length: 10 }, () => bagA.next().answer);
    const seqB = Array.from({ length: 10 }, () => bagB.next().answer);

    expect(seqA).not.toEqual(seqB);
  });

  it('SELECT-005: No immediate duplicate across bag boundaries when pool size > 1', () => {
    // Test across 50 cycle refills
    const bag = new ShuffleBag(sampleLessons, createRng('boundary-seed'));
    let previous = bag.next();

    for (let i = 1; i < sampleLessons.length * 50; i++) {
      const current = bag.next();
      if (i % sampleLessons.length === 0) {
        // Boundary item
        expect(current.answer).not.toBe(previous.answer);
      }
      previous = current;
    }
  });

  it('SELECT-006: Single-item pool behaves safely without hanging', () => {
    const singlePool = [{ display: 'solo', answer: 'solo' }];
    const bag = new ShuffleBag(singlePool, createRng('solo-seed'));

    for (let i = 0; i < 5; i++) {
      expect(bag.next().answer).toBe('solo');
    }
  });

  it('SELECT-007: Resetting pool updates available items immediately', () => {
    const bag = new ShuffleBag(sampleLessons, createRng('switch-seed'));
    expect(bag.next()).toBeTruthy();

    const newLessons = [
      { display: 'one', answer: 'one' },
      { display: 'two', answer: 'two' },
    ];
    bag.resetPool(newLessons);

    const firstFromNew = bag.next();
    expect(['one', 'two']).toContain(firstFromNew.answer);
  });
});
