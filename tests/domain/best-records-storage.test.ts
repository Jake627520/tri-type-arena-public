import { beforeEach, describe, expect, it } from 'vitest';
import { loadBestRecords, saveBestRecord } from '../../src/shared/storage';

const key = 'tritype.best.v2';

describe('best record storage', () => {
  beforeEach(() => localStorage.clear());

  it.each(['null', '[]', '42', '"invalid"', '{'])('recovers from invalid data: %s', (raw) => {
    localStorage.setItem(key, raw);
    expect(loadBestRecords()).toEqual({});
    expect(saveBestRecord('en', 100)).toEqual({ en: 100 });
    expect(loadBestRecords()).toEqual({ en: 100 });
  });

  it('keeps valid scores and discards invalid values and unknown fields', () => {
    localStorage.setItem(key, JSON.stringify({ en: 120, pinyin: '500', zhuyin: -1, other: 10 }));
    expect(loadBestRecords()).toEqual({ en: 120 });
    expect(saveBestRecord('pinyin', 50)).toEqual({ en: 120, pinyin: 50 });
    expect(saveBestRecord('en', 80)).toEqual({ en: 120, pinyin: 50 });
  });
});
