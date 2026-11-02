import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';

describe('GAME-INPUT: Keyboard Input & Focus Resiliency', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('tritype.ui.locale', 'zh-TW');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
  });

  it('GAME-INPUT-001: starts challenge and automatically focuses typing input', async () => {
    const user = userEvent.setup();
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i);
    expect(input).toHaveFocus();
    expect(input).not.toBeDisabled();
  });

  it('GAME-INPUT-002: English mode updates display and typedValue immediately', () => {
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    fireEvent.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Dynamically get the current target word's first two characters
    const targetRegion = screen.getByLabelText(/目標字元比對序列/i);
    const targetChars = Array.from(targetRegion.querySelectorAll('.target-char')).map((el) => el.textContent || '');
    const c1 = targetChars[0];
    const c2 = targetChars[1];

    fireEvent.keyDown(input, { key: c1 });
    expect(input.value).toBe(c1);

    const firstCharEl = targetRegion.querySelectorAll('.target-char')[0];
    expect(firstCharEl).toHaveClass('char-correct');

    fireEvent.keyDown(input, { key: c2 });
    // Completing a two-letter word advances to the next word and clears input.
    expect(input.value).toBe(targetChars.length === 2 ? '' : c1 + c2);
  });

  it('GAME-INPUT-003: Pinyin mode updates display immediately on typing', async () => {
    const user = userEvent.setup();
    render(<App />);

    const pinyinBtn = screen.getByRole('button', { name: /簡[體体]拼音/i });
    await user.click(pinyinBtn);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Type the active pinyin target word
    const targetRegion = screen.getByLabelText(/目標字元比對序列/i);
    const targetWord = Array.from(targetRegion.querySelectorAll('.target-char'))
      .map((el) => el.textContent || '')
      .join('');

    for (const char of targetWord) {
      fireEvent.keyDown(input, { key: char });
    }

    // Word should complete and input resets for next word
    expect(input.value).toBe('');
    expect(screen.getByText(/完成詞數/i).closest('.stat-box')).toHaveTextContent('1');
  });

  it('GAME-INPUT-004: Daqian Zhuyin physical key K resolves to ㄜ', async () => {
    const user = userEvent.setup();
    render(<App />);

    const zhuyinBtn = screen.getByRole('button', { name: /繁[體体]注音/i });
    await user.click(zhuyinBtn);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Pressing 'k' or physical key code 'KeyK' maps to 'ㄜ'
    fireEvent.keyDown(input, { key: 'k', code: 'KeyK' });
    expect(input.value).toBe('ㄜ');
  });

  it('GAME-INPUT-004b: Daqian Zhuyin resolves physical key code KeyK even when key is Process (IME)', async () => {
    const user = userEvent.setup();
    render(<App />);

    const zhuyinBtn = screen.getByRole('button', { name: /繁[體体]注音/i });
    await user.click(zhuyinBtn);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Simulate keydown event emitted when an active CJK IME is enabled on macOS
    fireEvent.keyDown(input, { key: 'Process', code: 'KeyK' });
    expect(input.value).toBe('ㄜ');
  });

  it('GAME-INPUT-005: mistyped character displays error and can be backspaced', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Expected first is 'k', mistype 'x'
    fireEvent.keyDown(input, { key: 'x' });
    expect(input.value).toBe('x');
    expect(input).toHaveClass('input-error');

    // Backspace removes error
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(input.value).toBe('');
    expect(input).not.toHaveClass('input-error');
  });

  it('GAME-INPUT-006: restart resets session and accepts input on next start', async () => {
    const user = userEvent.setup();
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'k' });
    expect(input.value).toBe('k');

    // Click abandon / restart
    const restartBtn = screen.getByRole('button', { name: /放棄重試|重新開始/i });
    await user.click(restartBtn);

    expect(screen.getByRole('button', { name: /開始挑戰/i })).toBeInTheDocument();

    // Start again
    await user.click(screen.getByRole('button', { name: /開始挑戰/i }));
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'k' });
    expect(input.value).toBe('k');
  });

  it('GAME-INPUT-007: pause disables input and resume restores focus and typing', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'k' });

    // Pause via Escape
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toBeDisabled();

    // Resume via button
    fireEvent.click(screen.getByRole('button', { name: /繼續挑戰/i }));
    expect(input).not.toBeDisabled();
    expect(input).toHaveFocus();

    // Continue typing
    fireEvent.keyDown(input, { key: 'e' });
    expect(input.value).toBe('ke');
  });

  it('GAME-INPUT-008: closing onboarding unblocks all keyboard interactions', async () => {
    localStorage.removeItem('tritype.onboarding.v1.completed');
    const user = userEvent.setup();
    render(<App />);

    // Onboarding dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Dismiss onboarding
    const skipBtn = screen.getByRole('button', { name: /跳過/i });
    await user.click(skipBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Start challenge
    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    await user.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'k' });
    expect(input.value).toBe('k');
  });

  it('GAME-INPUT-009: paste is strictly rejected without altering typedValue', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'k' });

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'eyboard cheat string',
      },
    });

    expect(input.value).toBe('k');
  });

  it('GAME-INPUT-010: IME composition does not double-count or miss committed characters', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Interim composition
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'k', isComposing: true });
    expect(input.value).toBe('');

    // End composition
    fireEvent.compositionEnd(input, { data: 'k' });
    expect(input.value).toBe('k');
  });

  it('GAME-INPUT-011: changing UI locale preserves active typing input state', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'k' });
    expect(input.value).toBe('k');

    // Switch locale to English
    const localeSelect = document.getElementById('ui-locale') as HTMLSelectElement;
    fireEvent.change(localeSelect, { target: { value: 'en' } });

    // Input state preserved
    expect(input.value).toBe('k');

    // Can continue typing
    fireEvent.keyDown(input, { key: 'e' });
    expect(input.value).toBe('ke');
  });

  it('GAME-INPUT-012: Enter key on window or input in idle state starts challenge', () => {
    render(<App />);

    // In idle state, pressing Enter starts the challenge
    fireEvent.keyDown(window, { key: 'Enter' });

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(screen.getByText(/LIVE CHALLENGE|挑戰進行中/i)).toBeInTheDocument();
  });

  it('GAME-HARDEN-001: Enter on focused input triggers start only once without duplicate dispatch', () => {
    render(<App />);

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    // Press Enter once on input
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText(/LIVE CHALLENGE|挑戰進行中/i)).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('GAME-HARDEN-002: Zhuyin mode does not duplicate keystroke when compositionend fires after keydown', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /繁[體体]注音/i }));
    await user.click(screen.getByRole('button', { name: /開始挑戰/i }));

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Simulate keydown on physical KeyK
    fireEvent.keyDown(input, { key: 'Process', code: 'KeyK' });

    // Simulate subsequent compositionEnd emitted by macOS CJK IME
    fireEvent.compositionEnd(input, { data: 'ㄜ' });

    // Must be exactly one 'ㄜ', NOT 'ㄜㄜ'
    expect(input.value).toBe('ㄜ');
  });

  it('GAME-HARDEN-003: rejects Dead and Unidentified keys without corrupting session', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Simulate Dead or Unidentified keys
    fireEvent.keyDown(input, { key: 'Dead' });
    fireEvent.keyDown(input, { key: 'Unidentified' });
    fireEvent.keyDown(input, { key: 'Process' }); // Process without code

    expect(input.value).toBe('');

    // Valid key should still work cleanly
    fireEvent.keyDown(input, { key: 'k' });
    expect(input.value).toBe('k');
  });

  it('GAME-HARDEN-004: running session recovers focus and receives input when activeElement is BODY', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Simulate focus moving to BODY (e.g. clicking background)
    input.blur();
    expect(document.activeElement).toBe(document.body);

    // Press 'k' on window
    fireEvent.keyDown(window, { key: 'k' });
    expect(input.value).toBe('k');
    expect(document.activeElement).toBe(input);
  });

  it('GAME-HARDEN-005: interacting with UI locale select is not hijacked by window keydown', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    const select = document.getElementById('ui-locale') as HTMLSelectElement;
    select.focus();
    expect(document.activeElement).toBe(select);

    // Arrow keys or Space on select element should NOT be redirected to typing input
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    select.dispatchEvent(event);

    expect(document.activeElement).toBe(select);
    expect(input.value).toBe('');
  });

  it('GAME-HARDEN-006: Backspace, Escape, and Resume do not execute repeatedly or duplicate', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Type 'ke'
    fireEvent.keyDown(input, { key: 'k' });
    fireEvent.keyDown(input, { key: 'e' });
    expect(input.value).toBe('ke');

    // Backspace once
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(input.value).toBe('k');

    // Escape once to pause
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toBeDisabled();
    expect(screen.getByText(/SESSION PAUSED|練習已暫停/i)).toBeInTheDocument();

    // Resume via Enter once
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(input).not.toBeDisabled();
    expect(screen.getByText(/LIVE CHALLENGE|挑戰進行中/i)).toBeInTheDocument();
  });

  it('GAME-HARDEN-007: browser shortcuts with Meta or Ctrl are not intercepted', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    const cmdR = new KeyboardEvent('keydown', { key: 'r', metaKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(cmdR);
    expect(cmdR.defaultPrevented).toBe(false);

    const cmdC = new KeyboardEvent('keydown', { key: 'c', metaKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(cmdC);
    expect(cmdC.defaultPrevented).toBe(false);

    expect(input.value).toBe('');
  });

  it('GAME-HARDEN-008: full IME lifecycle (compositionstart -> keydown -> compositionend) in Zhuyin mode outputs exactly one character', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /繁[體体]注音/i }));
    await user.click(screen.getByRole('button', { name: /開始挑戰/i }));

    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Full IME lifecycle
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Process', code: 'KeyK', isComposing: true });
    fireEvent.compositionEnd(input, { data: 'ㄜ' });

    // Must be exactly one 'ㄜ'
    expect(input.value).toBe('ㄜ');
  });

  it('GAME-HARDEN-009: anti-paste protection remains strictly non-degraded', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Attempt paste
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'malicious_paste_content',
      },
    });

    expect(input.value).toBe('');
  });

  it('GAME-HARDEN-010: single physical keystroke generates exactly one session character', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i) as HTMLInputElement;

    // Single physical 'k'
    fireEvent.keyDown(input, { key: 'k', code: 'KeyK' });
    expect(input.value).toBe('k');
    expect(input.value.length).toBe(1);
  });
});
