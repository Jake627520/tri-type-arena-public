import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { getTypingAnswer, prepareTypingLesson } from '../../src/domain/typing-answer';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';
import { generateAdaptiveLessons } from '../../src/domain/learning/adaptive-selector';
import { rankWeakKeys } from '../../src/domain/learning/adaptive-priority';
import { ZHUYIN_VOCABULARY } from '../../src/domain/vocabulary/zhuyin';
import { ENGLISH_VOCABULARY } from '../../src/domain/vocabulary/en';
import { PINYIN_VOCABULARY } from '../../src/domain/vocabulary/pinyin';
import { DaqianKeyboard } from '../../src/features/keyboard/DaqianKeyboard';
import { TypingArena } from '../../src/features/typing/TypingArena';
import { App } from '../../src/app/App';
import type { Lesson, RankedKey } from '../../src/domain/types';

describe('Phase 3: Zhuyin First-Tone Space Compatibility & Input Regression (ADP-018..023)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('tritype.ui.locale', 'zh-TW');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
  });

  // 1. 自適應 Selector 選出的第一聲題目，在 GameSession 使用前後答案一致。
  it('TEST-01: 自適應 Selector 選出的第一聲題目，在 GameSession 使用前後答案一致', () => {
    // 找出注音題庫中包含第一聲 (以 Space 結尾或含有 Space) 的題目
    const firstToneLessons = ZHUYIN_VOCABULARY.filter((l) => {
      const prepared = prepareTypingLesson(l, 'zhuyin');
      return prepared.answer.includes(' ');
    });
    expect(firstToneLessons.length).toBeGreaterThan(0);

    const targetKey: RankedKey = {
      key: ' ',
      priority: 0.95,
      errorRate: 0.8,
      attempts: 50,
      recencyBonus: 1.0,
      lastPracticed: 1000,
    };

    const result = generateAdaptiveLessons({
      mode: 'zhuyin',
      difficulty: 'beginner',
      vocabulary: ZHUYIN_VOCABULARY,
      weakKeys: [targetKey],
      count: 5,
      seed: 42,
    });
    const selected = result.lessons;

    expect(selected.length).toBe(5);
    // 確保每道選中的題目在傳入 GameSession 後，答案完全一致且維持空格
    const mockClock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: selected,
      clock: mockClock,
      shuffle: false,
    });

    for (let i = 0; i < selected.length; i++) {
      const selectedLesson = selected[i];
      const sessionLesson = session.lessons[i];
      expect(sessionLesson.answer).toBe(selectedLesson.answer);
      expect(sessionLesson.display).toBe(selectedLesson.display);
      expect(sessionLesson.answer).toBe(getTypingAnswer(selectedLesson, 'zhuyin'));
    }
  });

  // 2. 注音第一聲必須輸入 ASCII Space。
  it('TEST-02: 注音第一聲必須輸入 ASCII Space 才能前進', () => {
    // 中午: ㄓㄨㄥ (1st tone) ㄨˇ (3rd tone) -> answer: "ㄓㄨㄥ ㄨˇ"
    const zhongwu: Lesson = {
      id: 'test-zhongwu',
      display: '中午',
      answer: 'ㄓㄨㄥㄨˇ',
      hint: 'ㄓㄨㄥ ㄨˇ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prepared = prepareTypingLesson(zhongwu, 'zhuyin');
    expect(prepared.answer).toBe('ㄓㄨㄥ ㄨˇ');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepared],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    // 輸入 ㄓ ㄨ ㄥ
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄓ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄥ' });
    expect(session.state.typedValue).toBe('ㄓㄨㄥ');

    // 下一個字元是 Space (' ')。如果嘗試輸入第二音節的 'ㄨ'，應被視為錯誤，無法前進到正確狀態
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    expect(session.state.typedValue).toBe('ㄓㄨㄥㄨ');
    expect(session.state.errors).toBe(1);
    expect(session.state.words).toBe(0); // 未能完成單詞

    // 透過 Backspace 退回錯誤字元
    session.dispatch({ type: 'BACKSPACE' });
    expect(session.state.typedValue).toBe('ㄓㄨㄥ');

    // 正確輸入 ASCII Space (' ')
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.state.typedValue).toBe('ㄓㄨㄥ ');
    expect(session.state.correctKeys).toBe(4);

    // 接續輸入第二音節 ㄨ ˇ 完成單詞
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄨ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ˇ' });
    expect(session.state.words).toBe(1);
  });

  // 3. 正確 Space 計入 totalKeys 和 correctKeys。
  it('TEST-03: 正確 Space 計入 totalKeys 和 correctKeys', () => {
    const lesson: Lesson = {
      id: 'test-t1',
      display: '吃',
      answer: 'ㄔ',
      hint: 'ㄔ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prepared = prepareTypingLesson(lesson, 'zhuyin');
    expect(prepared.answer).toBe('ㄔ ');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepared],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    expect(session.state.totalKeys).toBe(0);
    expect(session.state.correctKeys).toBe(0);

    // 輸入 ㄔ
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄔ' });
    expect(session.state.totalKeys).toBe(1);
    expect(session.state.correctKeys).toBe(1);

    // 輸入 Space
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.state.totalKeys).toBe(2);
    expect(session.state.correctKeys).toBe(2);
    expect(session.state.errors).toBe(0);
    expect(session.state.accuracy).toBe(100);
  });

  // 4. 錯誤的第一聲按鍵歸入 keyAttempts[' ']。
  it('TEST-04: 錯誤的第一聲按鍵歸入 keyAttempts[\' \']', () => {
    const lesson: Lesson = {
      id: 'test-t1',
      display: '天',
      answer: 'ㄊㄧㄢ',
      hint: 'ㄊㄧㄢ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prepared = prepareTypingLesson(lesson, 'zhuyin');
    expect(prepared.answer).toBe('ㄊㄧㄢ ');

    const clock = createMockClock(2000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepared],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄊ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄧ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄢ' });

    // 此時 expectedChar 為 ' '
    expect(session.state.typedValue.length).toBe(3);
    expect(prepared.answer[3]).toBe(' ');

    // 刻意輸入錯誤字元（如 '6' 或 'ˊ'）
    session.dispatch({ type: 'TYPE_CHAR', char: 'ˊ' });

    expect(session.state.keyAttempts[' ']).toBeDefined();
    expect(session.state.keyAttempts[' '].attempts).toBe(1);
    expect(session.state.keyAttempts[' '].errors).toBe(1);
    expect(session.state.keyAttempts[' '].lastPracticed).toBe(2000);

    // 同時確認其他非目標鍵不受污染
    expect(session.state.keyAttempts['ˊ']).toBeUndefined();
  });

  // 5. Backspace 修正不能抹除已發生的錯誤。
  it('TEST-05: Backspace 修正不能抹除已發生的錯誤', () => {
    const lesson: Lesson = {
      id: 'test-t1',
      display: '包',
      answer: 'ㄅㄠ',
      hint: 'ㄅㄠ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prepared = prepareTypingLesson(lesson, 'zhuyin');
    expect(prepared.answer).toBe('ㄅㄠ ');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepared],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄅ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄠ' });

    // 在 Space 位置輸入錯誤
    session.dispatch({ type: 'TYPE_CHAR', char: 'x' });
    expect(session.state.errors).toBe(1);
    expect(session.state.keyAttempts[' '].errors).toBe(1);
    expect(session.state.keyAttempts[' '].attempts).toBe(1);

    // 執行 BACKSPACE
    session.dispatch({ type: 'BACKSPACE' });
    expect(session.state.typedValue).toBe('ㄅㄠ');

    // 驗證錯誤統計依然被保留，不可被抹除
    expect(session.state.errors).toBe(1);
    expect(session.state.totalKeys).toBe(3);
    expect(session.state.keyAttempts[' '].errors).toBe(1);
    expect(session.state.keyAttempts[' '].attempts).toBe(1);

    // 重新輸入正確 Space 完成單詞
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    // 單詞完成後 typedValue 重置為 ''，words 增加為 1
    expect(session.state.typedValue).toBe('');
    expect(session.state.words).toBe(1);
    expect(session.state.correctKeys).toBe(3);
    expect(session.state.totalKeys).toBe(4);
    // keyAttempts[' '] attempts 應為 2，errors 維持 1
    expect(session.state.keyAttempts[' '].attempts).toBe(2);
    expect(session.state.keyAttempts[' '].errors).toBe(1);
  });

  // 6. 虛擬大千鍵盤在預期 Space 時正確高亮。
  it('TEST-06: 虛擬大千鍵盤在預期 Space 時正確高亮', () => {
    // 6a: 渲染 DaqianKeyboard 直接驗證 activeChar === ' '
    const { container: activeContainer, rerender } = render(
      React.createElement(DaqianKeyboard, { activeChar: ' ' })
    );
    const activeSpaceKey = activeContainer.querySelector('#daqian-space-key');
    expect(activeSpaceKey).not.toBeNull();
    expect(activeSpaceKey).toHaveClass('key-active');

    // 6b: activeChar 為一般注音符號時，Space 不應高亮
    rerender(React.createElement(DaqianKeyboard, { activeChar: 'ㄅ' }));
    const normalSpaceKey = activeContainer.querySelector('#daqian-space-key');
    expect(normalSpaceKey).not.toHaveClass('key-active');

    // 6c: 在實際 App 整合下，輸入到第一聲 Space 節點時，#daqian-space-key 帶有 key-active
    const { container: appContainer } = render(React.createElement(App));
    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    fireEvent.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;
    const targetRegion = screen.getByLabelText(/目標字元比對序列/i);
    const targetChars = Array.from(targetRegion.querySelectorAll('.target-char')).map((el) => el.textContent || '');

    // 依序輸入直到遇到 Space
    for (let i = 0; i < targetChars.length; i++) {
      const char = targetChars[i];
      if (char === '␣' || char === ' ') {
        // 當前字元為 Space，大千鍵盤 Space 鍵必須具有 key-active
        const spaceBar = appContainer.querySelector('#daqian-space-key');
        expect(spaceBar).toHaveClass('key-active');
        break;
      } else {
        fireEvent.keyDown(input, { key: char });
      }
    }
  });

  // 7. 中間第一聲與詞尾第一聲均正確。
  it('TEST-07: 中間第一聲與詞尾第一聲均正確處理', () => {
    // 中午: ㄓㄨㄥ (1st tone, intermediate) ㄨˇ (3rd tone, end) -> "ㄓㄨㄥ ㄨˇ"
    const zhongwu: Lesson = {
      id: 'test-zhongwu',
      display: '中午',
      answer: 'ㄓㄨㄥㄨˇ',
      hint: 'ㄓㄨㄥ ㄨˇ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    // 手機: ㄕㄡˇ (3rd tone, intermediate) ㄐㄧ (1st tone, end) -> "ㄕㄡˇㄐㄧ "
    const shouji: Lesson = {
      id: 'test-shouji',
      display: '手機',
      answer: 'ㄕㄡˇㄐㄧ',
      hint: 'ㄕㄡˇ ㄐㄧ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };

    const prepZhongwu = prepareTypingLesson(zhongwu, 'zhuyin');
    const prepShouji = prepareTypingLesson(shouji, 'zhuyin');

    expect(prepZhongwu.answer).toBe('ㄓㄨㄥ ㄨˇ');
    expect(prepShouji.answer).toBe('ㄕㄡˇㄐㄧ ');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepZhongwu, prepShouji],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });

    // 輸入 中午: ㄓ ㄨ ㄥ <Space> ㄨ ˇ
    'ㄓㄨㄥ ㄨˇ'.split('').forEach((c) => {
      session.dispatch({ type: 'TYPE_CHAR', char: c });
    });
    expect(session.state.words).toBe(1);
    expect(session.state.errors).toBe(0);

    // 輸入 手機: ㄕ ㄡ ˇ ㄐ ㄧ <Space>
    'ㄕㄡˇㄐㄧ '.split('').forEach((c) => {
      session.dispatch({ type: 'TYPE_CHAR', char: c });
    });
    expect(session.state.words).toBe(2);
    expect(session.state.errors).toBe(0);
  });

  // 8. 已準備的 Runtime Answer 不重複產生 Space。
  it('TEST-08: 已準備的 Runtime Answer 不重複產生 Space (冪等性)', () => {
    const rawLesson: Lesson = {
      id: 'test-idem',
      display: '咖啡',
      answer: 'ㄎㄚㄈㄟ',
      hint: 'ㄎㄚ ㄈㄟ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };

    const run1 = prepareTypingLesson(rawLesson, 'zhuyin');
    expect(run1.answer).toBe('ㄎㄚ ㄈㄟ ');

    const run2 = prepareTypingLesson(run1, 'zhuyin');
    expect(run2.answer).toBe('ㄎㄚ ㄈㄟ ');

    const run3 = prepareTypingLesson(run2, 'zhuyin');
    expect(run3.answer).toBe('ㄎㄚ ㄈㄟ ');

    expect(run3.answer).not.toContain('  ');
    expect(run3.answer.endsWith('   ')).toBe(false);
  });

  // 9. 英文模式保持原有輸入語意。
  it('TEST-09: 英文模式保持原有輸入語意 (無音調規則、標準單字空白分隔)', () => {
    const enLesson: Lesson = {
      id: 'test-en',
      display: 'hello world',
      answer: 'hello world',
      mode: 'en',
      difficulty: 'beginner',
    };

    const prep = prepareTypingLesson(enLesson, 'en');
    expect(prep.answer).toBe('hello world');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'en',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prep],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    'hello world'.split('').forEach((c) => {
      session.dispatch({ type: 'TYPE_CHAR', char: c });
    });

    expect(session.state.words).toBe(1);
    expect(session.state.errors).toBe(0);
    expect(session.state.correctKeys).toBe(11);
    // 英文空格正確記錄在 keyAttempts[' ']
    expect(session.state.keyAttempts[' '].attempts).toBe(1);
    expect(session.state.keyAttempts[' '].errors).toBe(0);
  });

  // 10. 拼音模式不要求額外第一聲 Space。
  it('TEST-10: 拼音模式不要求額外第一聲 Space', () => {
    // 檢視全體 PINYIN_VOCABULARY，確認無音調空格污染
    for (const lesson of PINYIN_VOCABULARY) {
      const prep = prepareTypingLesson(lesson, 'pinyin');
      expect(prep.answer).toBe(lesson.answer);
      expect(prep.answer.endsWith(' ')).toBe(false);
    }

    const pinyinLesson: Lesson = {
      id: 'test-py',
      display: '妈妈',
      answer: 'mama',
      hint: 'mā ma',
      mode: 'pinyin',
      difficulty: 'beginner',
    };

    const prep = prepareTypingLesson(pinyinLesson, 'pinyin');
    expect(prep.answer).toBe('mama');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'pinyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prep],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    'mama'.split('').forEach((c) => {
      session.dispatch({ type: 'TYPE_CHAR', char: c });
    });
    expect(session.state.words).toBe(1);
    expect(session.state.errors).toBe(0);
  });

  // 11. 模式切換後不沿用其他模式答案。
  it('TEST-11: 模式切換後不沿用其他模式答案', () => {
    const zhLesson: Lesson = {
      id: 'test-zh',
      display: '天',
      answer: 'ㄊㄧㄢ',
      hint: 'ㄊㄧㄢ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prepZh = prepareTypingLesson(zhLesson, 'zhuyin');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prepZh],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄊ' });
    expect(session.state.typedValue).toBe('ㄊ');

    // 切換至英文模式
    session.dispatch({ type: 'SWITCH_MODE', mode: 'en' });
    expect(session.state.mode).toBe('en');
    expect(session.state.typedValue).toBe('');
    expect(session.state.currentLesson.mode).toBe('en');
    expect(session.state.currentLesson.answer).not.toBe(prepZh.answer);

    // 切換至拼音模式
    session.dispatch({ type: 'SWITCH_MODE', mode: 'pinyin' });
    expect(session.state.mode).toBe('pinyin');
    expect(session.state.typedValue).toBe('');
    expect(session.state.currentLesson.mode).toBe('pinyin');
    expect(session.state.currentLesson.answer).not.toBe(prepZh.answer);
  });

  // 12. 暫停、繼續、重新開始不破壞 Space 規則。
  it('TEST-12: 暫停、繼續、重新開始不破壞 Space 規則', () => {
    const lesson: Lesson = {
      id: 'test-lifecycle',
      display: '山',
      answer: 'ㄕㄢ',
      hint: 'ㄕㄢ',
      mode: 'zhuyin',
      difficulty: 'beginner',
    };
    const prep = prepareTypingLesson(lesson, 'zhuyin');
    expect(prep.answer).toBe('ㄕㄢ ');

    const clock = createMockClock(1000);
    const session = createGameSession({
      mode: 'zhuyin',
      difficulty: 'beginner',
      duration: 60,
      lessons: [prep],
      clock,
      shuffle: false,
    });

    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄕ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄢ' });
    expect(session.state.typedValue).toBe('ㄕㄢ');

    // 暫停
    session.dispatch({ type: 'PAUSE' });
    expect(session.state.status).toBe('paused');

    // 暫停狀態下嘗試輸入 Space 應被拒絕
    const resWhilePaused = session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(resWhilePaused.accepted).toBe(false);
    expect(session.state.typedValue).toBe('ㄕㄢ');

    // 繼續
    clock.advance(5000);
    session.dispatch({ type: 'RESUME' });
    expect(session.state.status).toBe('running');

    // 繼續後輸入 Space 應被正常接受
    const resAfterResume = session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(resAfterResume.accepted).toBe(true);
    expect(session.state.typedValue).toBe('');
    expect(session.state.words).toBe(1);

    // 重新開始：回到 idle 狀態，單字重置
    session.dispatch({ type: 'RESTART' });
    expect(session.state.status).toBe('idle');
    expect(session.state.typedValue).toBe('');
    expect(session.state.words).toBe(0);
    expect(session.state.currentLesson.answer).toBe('ㄕㄢ ');

    // 重新出發進入 running
    session.dispatch({ type: 'START' });
    expect(session.state.status).toBe('running');

    // 再次輸入驗證題目與空白鍵規則完好
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄕ' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'ㄢ' });
    session.dispatch({ type: 'TYPE_CHAR', char: ' ' });
    expect(session.state.words).toBe(1);
    expect(session.state.errors).toBe(0);
  });
});
