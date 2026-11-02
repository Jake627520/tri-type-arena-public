import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/domain/vocabulary', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/domain/vocabulary')>(),
  getVocabularyPool: () => [],
}));

import { createGameSession } from '../../src/domain/session';
import { LESSONS } from '../../src/domain/lessons';

describe('empty vocabulary fallback', () => {
  it('starts with fallback lessons when an injected array and the pool are empty', () => {
    const session = createGameSession({ mode: 'en', lessons: [], shuffle: false });
    expect(session.getState().currentLesson.display).toBe(LESSONS.en[0].display);
  });

  it('keeps a usable mode-specific fallback when mode or difficulty changes', () => {
    const session = createGameSession({ mode: 'en', shuffle: false });
    session.dispatch({ type: 'SWITCH_MODE', mode: 'zhuyin' });
    expect(session.getState().currentLesson.display).toBe(LESSONS.zhuyin[0].display);
    session.dispatch({ type: 'SWITCH_DIFFICULTY', difficulty: 'advanced' });
    expect(session.getState().currentLesson.display).toBe(LESSONS.zhuyin[0].display);
  });
});
