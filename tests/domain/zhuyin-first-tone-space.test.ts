import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { getTypingAnswer, prepareTypingLesson } from '../../src/domain/typing-answer';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';
import { ZHUYIN_VOCABULARY } from '../../src/domain/vocabulary/zhuyin';
import { ENGLISH_VOCABULARY } from '../../src/domain/vocabulary/en';
import { PINYIN_VOCABULARY } from '../../src/domain/vocabulary/pinyin';
import { DaqianKeyboard } from '../../src/features/keyboard/DaqianKeyboard';
import { ShuffleBag } from '../../src/domain/shuffle-bag';
import { analyzeWeakKeys, mapZhuyinSymbolToKey } from '../../src/domain/learning/weak-keys';
import { generateReviewLessons } from '../../src/domain/learning/review-generator';
import type { Lesson } from '../../src/domain/types';

describe('Zhuyin First-Tone Space Hotfix (ZH-SPACE-001..013)', () => {
  it('ZH-SPACE-001: 第一聲音節自動加入 Space', () => {
    // 中午: ㄓㄨㄥ (1st tone) ㄨˇ (3rd tone) -> ㄓㄨㄥ ㄨˇ
    const zhongwu = getTypingAnswer({
      mode: 'zhuyin',
      display: '中午',
      answer: 'ㄓㄨㄥㄨˇ',
      hint: 'ㄓㄨㄥ ㄨˇ',
    });
    expect(zhongwu).toBe('ㄓㄨㄥ ㄨˇ');

    // 工作: ㄍㄨㄥ (1st tone) ㄗㄨㄛˋ (4th tone) -> ㄍㄨㄥ ㄗㄨㄛˋ
    const gongzuo = getTypingAnswer({
      mode: 'zhuyin',
      display: '工作',
      answer: 'ㄍㄨㄥㄗㄨㄛˋ',
      hint: 'ㄍㄨㄥ ㄗㄨㄛˋ',
    });
    expect(gongzuo).toBe('ㄍㄨㄥ ㄗㄨㄛˋ');

    // 手機: ㄕㄡˇ (3rd tone) ㄐㄧ (1st tone) -> ㄕㄡˇㄐㄧ 
    const shouji = getTypingAnswer({
      mode: 'zhuyin',
      display: '手機',
      answer: 'ㄕㄡˇㄐㄧ',
      hint: 'ㄕㄡˇ ㄐㄧ',
    });
    expect(shouji).toBe('ㄕㄡˇㄐㄧ ');

    // 媽媽: ㄇㄚ (1st tone) ㄇㄚ˙ (light tone) -> ㄇㄚ ㄇㄚ˙
    const mama = getTypingAnswer({
      mode: 'zhuyin',
      display: '媽媽',
      answer: 'ㄇㄚㄇㄚ˙',
      hint: 'ㄇㄚ ㄇㄚ˙',
    });
    expect(mama).toBe('ㄇㄚ ㄇㄚ˙');
  });

  it('ZH-SPACE-002: 第二、三、四聲及輕聲不加入 Space', () => {
    // 你好: ㄋㄧˇ ㄏㄠˇ (3rd, 3rd) -> no space
    const nihao = getTypingAnswer({
      mode: 'zhuyin',
      display: '你好',
      answer: 'ㄋㄧˇㄏㄠˇ',
      hint: 'ㄋㄧˇ ㄏㄠˇ',
    });
    expect(nihao).toBe('ㄋㄧˇㄏㄠˇ');

    // 朋友: ㄆㄥˊ ㄧㄡˇ (2nd, 3rd) -> no space
    const pengyou = getTypingAnswer({
      mode: 'zhuyin',
      display: '朋友',
      answer: 'ㄆㄥˊㄧㄡˇ',
      hint: 'ㄆㄥˊ ㄧㄡˇ',
    });
    expect(pengyou).toBe('ㄆㄥˊㄧㄡˇ');

    // 學習: ㄒㄩㄝˊ ㄒㄧˊ (2nd, 2nd) -> no space
    const xuexi = getTypingAnswer({
      mode: 'zhuyin',
      display: '學習',
      answer: 'ㄒㄩㄝˊㄒㄧˊ',
      hint: 'ㄒㄩㄝˊ ㄒㄧˊ',
    });
    expect(xuexi).toBe('ㄒㄩㄝˊㄒㄧˊ');

    // 快樂: ㄎㄨㄞˋ ㄌㄜˋ (4th, 4th) -> no space
    const kuaile = getTypingAnswer({
      mode: 'zhuyin',
      display: '快樂',
      answer: 'ㄎㄨㄞˋㄌㄜˋ',
      hint: 'ㄎㄨㄞˋ ㄌㄜˋ',
    });
    expect(kuaile).toBe('ㄎㄨㄞˋㄌㄜˋ');

    // 月亮: ㄩㄝˋ ㄌㄧㄤ˙ (4th, light) -> no space
    const yueliang = getTypingAnswer({
      mode: 'zhuyin',
      display: '月亮',
      answer: 'ㄩㄝˋㄌㄧㄤ˙',
      hint: 'ㄩㄝˋ ㄌㄧㄤ˙',
    });
    expect(yueliang).toBe('ㄩㄝˋㄌㄧㄤ˙');
  });

  it('ZH-SPACE-003: 詞語中間第一聲必須輸入 Space', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '中午',
      answer: 'ㄓㄨㄥㄨˇ',
      hint: 'ㄓㄨㄥ ㄨˇ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    // Type first syllable: ㄓ, ㄨ, ㄥ
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄓ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });

    expect(session.getState().typedValue).toBe('ㄓㄨㄥ');

    // Skipping space and directly typing ㄨ is an error
    const wrong = session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    expect(wrong.accepted).toBe(true);
    expect(session.getState().errors).toBe(1);
    expect(session.getState().typedValue).toBe('ㄓㄨㄥㄨ'); // typo recorded

    // User must Backspace the wrong char
    session.dispatch({ type: 'BACKSPACE' });
    expect(session.getState().typedValue).toBe('ㄓㄨㄥ');

    // Now type the required Space
    const spaceRes = session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(spaceRes.accepted).toBe(true);
    expect(session.getState().typedValue).toBe('ㄓㄨㄥ ');
  });

  it('ZH-SPACE-004: 詞語最後第一聲必須輸入 Space 才完成', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '手機',
      answer: 'ㄕㄡˇㄐㄧ',
      hint: 'ㄕㄡˇ ㄐㄧ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    // Type ㄕ ㄡ ˇ ㄐ ㄧ
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄕ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄡ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ˇ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄐ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄧ' });

    // Not finished yet! Word requires the final Space
    expect(session.getState().words).toBe(0);
    expect(session.getState().typedValue).toBe('ㄕㄡˇㄐㄧ');

    // Type final Space
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.getState().words).toBe(1);
  });

  it('ZH-SPACE-005: 正確 Space 計入 totalKeys / correctKeys', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '工作',
      answer: 'ㄍㄨㄥㄗㄨㄛˋ',
      hint: 'ㄍㄨㄥ ㄗㄨㄛˋ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    // ㄍ ㄨ ㄥ
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄍ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });
    expect(session.getState().totalKeys).toBe(3);
    expect(session.getState().correctKeys).toBe(3);

    // Space
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.getState().totalKeys).toBe(4);
    expect(session.getState().correctKeys).toBe(4);
    expect(session.getState().accuracy).toBe(100);
    expect(session.getState().errors).toBe(0);
  });

  it('ZH-SPACE-006: 遺漏或錯誤 Space 正確計入錯誤及弱鍵紀錄', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '中文',
      answer: 'ㄓㄨㄥㄨㄣˊ',
      hint: 'ㄓㄨㄥ ㄨㄣˊ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄓ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });

    // Target is ' ', user mistakenly presses 'b'
    session.dispatch({ type: 'TYPE_CHAR', char: 'b' });
    const s = session.getState();
    expect(s.totalKeys).toBe(4);
    expect(s.correctKeys).toBe(3);
    expect(s.errors).toBe(1);
    expect(s.typos.length).toBe(1);
    expect(s.typos[0].expected).toBe(' ');
    expect(s.typos[0].typed).toBe('ㄖ'); // 'b' maps to 'ㄖ' in Daqian
    expect(s.keyAttempts[' ']).toBeDefined();
    expect(s.keyAttempts[' '].attempts).toBe(1);
    expect(s.keyAttempts[' '].errors).toBe(1);
  });

  it('ZH-SPACE-007: Backspace 可回退 Space', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '中午',
      answer: 'ㄓㄨㄥㄨˇ',
      hint: 'ㄓㄨㄥ ㄨˇ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄓ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.getState().typedValue).toBe('ㄓㄨㄥ ');

    // Backspace removes the Space
    session.dispatch({ type: 'BACKSPACE' });
    expect(session.getState().typedValue).toBe('ㄓㄨㄥ');

    // Next expected char is Space again
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.getState().typedValue).toBe('ㄓㄨㄥ ');
  });

  it('ZH-SPACE-008: English / Pinyin 行為完全不變', () => {
    const enLesson = prepareTypingLesson(ENGLISH_VOCABULARY[0]);
    expect(enLesson.answer).toBe(ENGLISH_VOCABULARY[0].answer);
    expect(enLesson.answer).not.toContain(' ');

    const piLesson = prepareTypingLesson(PINYIN_VOCABULARY[0]);
    expect(piLesson.answer).toBe(PINYIN_VOCABULARY[0].answer);
    expect(piLesson.answer).not.toContain(' ');

    // English session does not modify answers
    const clock = createMockClock(0);
    const enSession = createGameSession({ mode: 'en', duration: 30, clock });
    expect(enSession.getState().currentLesson.answer).not.toContain(' ');

    // Pinyin session does not modify answers
    const piSession = createGameSession({ mode: 'pinyin', duration: 30, clock });
    expect(piSession.getState().currentLesson.answer).not.toContain(' ');
  });

  it('ZH-SPACE-009: Daqian Space 鍵可以高亮', () => {
    // When activeChar is ' ', space key is highlighted
    const { container: activeContainer } = render(React.createElement(DaqianKeyboard, { activeChar: ' ' }));
    const spaceKey = activeContainer.querySelector('#daqian-space-key');
    expect(spaceKey).not.toBeNull();
    expect(spaceKey?.classList.contains('key-active')).toBe(true);

    // When activeChar is a regular Zhuyin symbol, space key is not highlighted
    const { container: normalContainer } = render(React.createElement(DaqianKeyboard, { activeChar: 'ㄓ' }));
    const normalSpaceKey = normalContainer.querySelector('#daqian-space-key');
    expect(normalSpaceKey?.classList.contains('key-active')).toBe(false);
  });

  it('ZH-SPACE-011: IME 及實體鍵碼 Space 單次分發與去重', () => {
    const clock = createMockClock(0);
    const lesson: Lesson = {
      mode: 'zhuyin',
      display: '手機',
      answer: 'ㄕㄡˇㄐㄧ',
      hint: 'ㄕㄡˇ ㄐㄧ',
    };
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [lesson],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄕ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄡ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ˇ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄐ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄧ' });

    const totalBefore = session.getState().totalKeys;
    // Dispatch exactly one Space
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.getState().totalKeys).toBe(totalBefore + 1);
    expect(session.getState().correctKeys).toBe(totalBefore + 1);
  });

  it('ZH-SPACE-012: Review Mode 與 ShuffleBag 可正常使用衍生答案', () => {
    const lessons: Lesson[] = [
      { mode: 'zhuyin', display: '中午', answer: 'ㄓㄨㄥㄨˇ', hint: 'ㄓㄨㄥ ㄨˇ' },
      { mode: 'zhuyin', display: '工作', answer: 'ㄍㄨㄥㄗㄨㄛˋ', hint: 'ㄍㄨㄥ ㄗㄨㄛˋ' },
    ];
    const prepared = lessons.map((l) => prepareTypingLesson(l, 'zhuyin'));
    expect(prepared[0].answer).toBe('ㄓㄨㄥ ㄨˇ');
    expect(prepared[1].answer).toBe('ㄍㄨㄥ ㄗㄨㄛˋ');

    const bag = new ShuffleBag(prepared);
    const nextItem = bag.next();
    expect(nextItem.answer).toContain(' ');

    // Weak key analysis for Space
    const weakStats = analyzeWeakKeys(
      {
        ' ': { attempts: 15, errors: 5, lastPracticed: Date.now() },
      },
      'zhuyin'
    );
    expect(weakStats[0].isWeak).toBe(true);
    expect(weakStats[0].key).toBe(' ');
    expect(mapZhuyinSymbolToKey(' ')).toBe(' ');

    // Generate review lessons targeting Space
    const reviewLessons = generateReviewLessons('zhuyin', weakStats, prepared, 2);
    expect(reviewLessons.length).toBeGreaterThan(0);
    expect(reviewLessons.every((l) => l.answer.includes(' '))).toBe(true);
  });

  it('ZH-SPACE-013: 新詞庫 ID 使用獨立命名空間', () => {
    expect(ZHUYIN_VOCABULARY.length).toBe(300);
    for (const entry of ZHUYIN_VOCABULARY) {
      expect(entry.id).toMatch(/^zh-cedict2-(beg|int|adv)-\d{3}$/);
      expect(entry.display).toBeTruthy();
      expect(entry.answer).toBeTruthy();
      expect(entry.hint).toBeTruthy();
      // Raw answers in vocabulary file do NOT contain Space
      expect(entry.answer).not.toContain(' ');
    }
  });

  it('Complete keyboard test: "中午" via Daqian physical key mappings (Digit5 → KeyJ → Slash → Space → KeyJ → Digit3)', () => {
    const clock = createMockClock(0);
    const session = createGameSession({
      mode: 'zhuyin',
      duration: 30,
      clock,
      lessons: [{ mode: 'zhuyin', display: '中午', answer: 'ㄓㄨㄥㄨˇ', hint: 'ㄓㄨㄥ ㄨˇ' }],
      shuffle: false,
    });
    session.dispatch({ type: 'START' });

    // Daqian physical key sequence for 中午:
    // ㄓ (5), ㄨ (j), ㄥ (/), Space ( ), ㄨ (j), ˇ (3)
    const keys = ['5', 'j', '/', ' ', 'j', '3'];
    for (const key of keys) {
      const res = session.dispatch({ type: 'TYPE_CHAR', char: key });
      expect(res.accepted).toBe(true);
    }

    const state = session.getState();
    expect(state.words).toBe(1);
    expect(state.totalKeys).toBe(6);
    expect(state.correctKeys).toBe(6);
    expect(state.errors).toBe(0);
    expect(state.accuracy).toBe(100);
    expect(state.streak).toBe(1);
    expect(state.score).toBeGreaterThan(0);
  });

  it('Fail-closed error handling on missing or malformed Zhuyin hints', () => {
    // Missing hint
    expect(() =>
      getTypingAnswer({ mode: 'zhuyin', display: '測試', answer: 'ㄘㄜˋㄕˋ' } as any)
    ).toThrowError(/Missing Zhuyin hint/);

    // Empty hint
    expect(() =>
      getTypingAnswer({ mode: 'zhuyin', display: '測試', answer: 'ㄘㄜˋㄕˋ', hint: '   ' })
    ).toThrowError(/Missing Zhuyin hint/);

    // Syllable count mismatch
    expect(() =>
      getTypingAnswer({ mode: 'zhuyin', display: '測試', answer: 'ㄘㄜˋㄕˋ', hint: 'ㄘㄜˋ' })
    ).toThrowError(/Malformed Zhuyin hint/);
  });
});
