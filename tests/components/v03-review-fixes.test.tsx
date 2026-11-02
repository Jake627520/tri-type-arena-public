import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { Onboarding } from '../../src/features/onboarding/Onboarding';
import { messages, locales, translate, parseLocale } from '../../src/i18n/core';
import type { Locale, UIKey } from '../../src/i18n/core';

describe('V0.3 Review Fixes — TDD Requirements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Key completeness: All 3 locales have identical, complete keys
  it('TDD-001: all 3 locales have identical and complete translation key sets', () => {
    const zhTWKeys = Object.keys(messages['zh-TW']).sort();
    const zhCNKeys = Object.keys(messages['zh-CN']).sort();
    const enKeys = Object.keys(messages['en']).sort();

    expect(zhCNKeys).toEqual(zhTWKeys);
    expect(enKeys).toEqual(zhTWKeys);

    // Specific review required keys
    const expectedKeys: UIKey[] = [
      'introTitlePrefix',
      'introTitleAccent',
      'modeSelectLabel',
      'modeEn',
      'modeEnDesc',
      'modePinyin',
      'modePinyinDesc',
      'modeZhuyin',
      'modeZhuyinDesc',
      'durationLabel',
      'duration30',
      'duration60',
      'duration120',
      'showHints',
      'statusIdle',
      'statusRunning',
      'statusPaused',
      'statusFinished',
      'targetAriaLabel',
      'placeholderIdle',
      'placeholderPaused',
      'placeholderRunning',
      'inputAriaLabel',
      'btnStart',
      'btnPause',
      'btnAbandon',
      'btnResume',
      'btnRestart',
      'livePerformance',
      'statSpeed',
      'statAccuracy',
      'statWords',
      'statStreak',
      'statBest',
      'resultTitle',
      'scoreFinal',
      'scoreSpeed',
      'scoreAccuracy',
      'scoreWords',
      'scoreStreak',
      'typoReview',
      'typoZero',
      'btnPlayAgain',
      'keyboardAriaLabel',
      'keyboardBadge',
      'keyboardTitle',
      'keyboardSubtitle',
      'keyboardGridAria',
      'keyboardNote',
      'footerText',
    ];

    for (const k of expectedKeys) {
      expect(zhTWKeys).toContain(k);
    }
  });

  // 2. Localized hero title without Chinese comma split
  it('TDD-002: English hero accent renders properly without split failure', () => {
    localStorage.setItem('tritype.ui.locale', 'en');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<App />);

    const heroHeading = screen.getByRole('heading', { level: 2 });
    expect(heroHeading).toBeInTheDocument();

    const accent = heroHeading.querySelector('.gradient-text');
    expect(accent).not.toBeNull();
    // In English, accent should only be "makes you faster.", not the whole sentence
    expect(accent?.textContent?.trim()).toBe('makes you faster.');
    expect(heroHeading.textContent).toContain('Every keystroke');
  });

  // 3. English UI does not show untranslated Traditional Chinese control texts
  it('TDD-003: English UI does not show untranslated Traditional Chinese control texts', () => {
    localStorage.setItem('tritype.ui.locale', 'en');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<App />);

    // Switch to Zhuyin to display Daqian keyboard
    fireEvent.click(screen.getByRole('button', { name: /Zhuyin/i }));

    const bodyText = document.body.textContent || '';
    // Unwanted untranslated traditional Chinese labels that previously leaked in English UI
    const traditionalLeaks = [
      '選擇語言模式',
      '英文標準鍵盤',
      '大千式鍵盤',
      '挑戰時限：',
      '30 秒衝刺',
      '顯示讀音/鍵位提示',
      '開始挑戰 (Enter)',
      '即時表現數據',
      '打字速度',
      '完成詞數',
      '本機最高得分',
      '注音大千鍵位速查表',
      '標準大千鍵盤 · 實體按鍵映射',
    ];

    for (const leak of traditionalLeaks) {
      expect(bodyText).not.toContain(leak);
    }
  });

  // 4. Simplified Chinese UI does not show untranslated Traditional Chinese control texts
  it('TDD-004: Simplified Chinese UI does not show untranslated Traditional Chinese control texts', () => {
    localStorage.setItem('tritype.ui.locale', 'zh-CN');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<App />);

    const bodyText = document.body.textContent || '';
    const traditionalLeaks = [
      '選擇語言模式',
      '繁體注音',
      '大千式鍵盤',
      '挑戰時限：',
      '30 秒衝刺',
      '顯示讀音/鍵位提示',
      '開始挑戰 (Enter)',
      '即時表現數據',
      '完成詞數',
      '本機最高得分',
    ];

    for (const leak of traditionalLeaks) {
      expect(bodyText).not.toContain(leak);
    }
  });

  // 5. Accessible Onboarding: Escape, Tab focus trap, and background keyboard blocking
  it('TDD-005: Onboarding blocks background keyboard events when modal is open', () => {
    render(<Onboarding locale="en" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    let backgroundActionTriggered = false;
    const backgroundListener = () => {
      backgroundActionTriggered = true;
    };
    window.addEventListener('keydown', backgroundListener);

    // Dispatch a keydown on document.body outside the dialog
    const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    document.body.dispatchEvent(evt);

    // Because modal is active and blocking background, default should be prevented or stopped
    expect(evt.defaultPrevented).toBe(true);

    window.removeEventListener('keydown', backgroundListener);
  });

  it('TDD-006: Onboarding restores focus to trigger button upon close', async () => {
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<Onboarding locale="en" />);

    const reopenBtn = screen.getByRole('button', { name: /Show beginner guide/i });
    reopenBtn.focus();
    expect(document.activeElement).toBe(reopenBtn);

    fireEvent.click(reopenBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Dismiss with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen button should have focus restored
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Show beginner guide/i }));
  });

  // 6. UI Locale × Typing Mode independent switching
  it('TDD-007: 3 UI Locales x 3 Typing Modes can all be switched independently', async () => {
    const user = userEvent.setup();
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<App />);

    const localeSelect = screen.getByLabelText(/Interface language|介面語言|界面语言/i);

    for (const targetLocale of locales) {
      await user.selectOptions(localeSelect, targetLocale);
      expect(localeSelect).toHaveValue(targetLocale);

      // Verify that all 3 mode buttons are clickable and switch mode regardless of UI locale
      const modeButtons = screen.getAllByRole('button').filter(b => b.className.includes('mode-btn'));
      expect(modeButtons.length).toBe(3);

      for (const btn of modeButtons) {
        await user.click(btn);
        expect(btn).toHaveClass('active');
      }
    }
  });
});
