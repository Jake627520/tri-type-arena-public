import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  createGameSession,
  getTestInjectedLessons,
  isTestInjectionAllowed,
} from '../../src/domain/session';
import { ENGLISH_VOCABULARY } from '../../src/domain/vocabulary/en';
import { PINYIN_VOCABULARY } from '../../src/domain/vocabulary/pinyin';
import { Lesson } from '../../src/domain/types';

describe('TEST-INJECTION-ISOLATION: Test Lesson Injection Environment & Mode Guard', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {
      __TRI_TYPE_TEST_MODE__: true,
      __TRI_TYPE_TEST_LESSONS__: [
        {
          id: 'test-zh-noon',
          mode: 'zhuyin',
          display: '中午',
          answer: 'ㄓㄨㄥㄨˇ',
          hint: 'ㄓㄨㄥ ㄨˇ',
          difficulty: 'beginner',
        },
        {
          id: 'test-zh-phone',
          mode: 'zhuyin',
          display: '手機',
          answer: 'ㄕㄡˇㄐㄧ',
          hint: 'ㄕㄡˇ ㄐㄧ',
          difficulty: 'beginner',
        },
      ] as Lesson[],
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('1. Zhuyin test lessons do NOT pollute English mode (returns normal English vocabulary)', () => {
    // English mode must return null from getTestInjectedLessons
    const injectedEn = getTestInjectedLessons('en');
    expect(injectedEn).toBeNull();

    // Session initialized in English mode must use standard English vocabulary
    const session = createGameSession({ mode: 'en' });
    expect(session.lessons.length).toBeGreaterThan(0);
    expect(session.lessons[0].display).toBe(ENGLISH_VOCABULARY[0].display);
    expect(session.lessons.some((l) => l.display === '中午' || l.display === '手機')).toBe(false);
  });

  it('2. Zhuyin test lessons do NOT pollute Pinyin mode (returns normal Pinyin vocabulary)', () => {
    // Pinyin mode must return null from getTestInjectedLessons
    const injectedPi = getTestInjectedLessons('pinyin');
    expect(injectedPi).toBeNull();

    // Session initialized in Pinyin mode must use standard Pinyin vocabulary
    const session = createGameSession({ mode: 'pinyin' });
    expect(session.lessons.length).toBeGreaterThan(0);
    expect(session.lessons[0].display).toBe(PINYIN_VOCABULARY[0].display);
    expect(session.lessons.some((l) => l.display === '中午' || l.display === '手機')).toBe(false);
  });

  it('3. Mismatched mode or normal development mode (without __TRI_TYPE_TEST_MODE__) returns normal vocabulary', () => {
    // If __TRI_TYPE_TEST_MODE__ is false or undefined (standard dev environment)
    delete (globalThis as any).window.__TRI_TYPE_TEST_MODE__;
    expect(isTestInjectionAllowed()).toBe(false);
    expect(getTestInjectedLessons('zhuyin')).toBeNull();

    // When test mode is re-enabled, only matching mode returns injected lessons
    (globalThis as any).window.__TRI_TYPE_TEST_MODE__ = true;
    const zhuyinInjected = getTestInjectedLessons('zhuyin');
    expect(zhuyinInjected).not.toBeNull();
    expect(zhuyinInjected?.length).toBe(2);
    expect(zhuyinInjected?.[0].display).toBe('中午');

    // Switching to English in session safely uses normal vocabulary
    const session = createGameSession({ mode: 'zhuyin' });
    expect(session.lessons[0].display).toBe('中午');
    session.dispatch({ type: 'SWITCH_MODE', mode: 'en' });
    expect(session.lessons.some((l) => l.display === '中午')).toBe(false);
    expect(session.lessons[0].display).toBe(ENGLISH_VOCABULARY[0].display);
  });

  it('4. Production build artifact isolation verification', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const distDir = path.resolve(rootDir, 'dist/assets');
    // Produced by tests/global-setup.ts when dist/assets is missing.
    expect(fs.existsSync(distDir)).toBe(true);

    const files = fs.readdirSync(distDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    const mainBundle = fs.readFileSync(path.join(distDir, jsFiles[0]), 'utf-8');

    // In production build, test injection strings must be completely stripped and dead-code eliminated
    expect(mainBundle.includes('__TRI_TYPE_TEST_LESSONS__')).toBe(false);
    expect(mainBundle.includes('__TRI_TYPE_TEST_MODE__')).toBe(false);
  });
});
