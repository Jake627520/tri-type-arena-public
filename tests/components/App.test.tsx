import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';

describe('TriType Arena — React Component Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('tritype.ui.locale', 'zh-TW');
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
  });

  it('renders initial brand, mode selectors, and default English prompt', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /TriType/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /簡[體体]拼音/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /繁[體体]注音/i })).toBeInTheDocument();

    const input = screen.getByLabelText(/打字輸入框/i);
    expect(input).toBeInTheDocument();
  });

  it('switches mode to Zhuyin and reveals the Daqian visual keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    const zhuyinBtn = screen.getByRole('button', { name: /繁體注音/i });
    await user.click(zhuyinBtn);

    expect(zhuyinBtn).toHaveClass('active');
    expect(screen.getByLabelText(/注音大千鍵位速查表/i)).toBeInTheDocument();
    expect(screen.getByText(/標準大千鍵盤/i)).toBeInTheDocument();
  });

  it('starts session on button click, accepts single keystroke, and rejects paste cheat', async () => {
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    fireEvent.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i);
    expect(input).not.toBeDisabled();

    // Type a single valid keystroke
    fireEvent.keyDown(input, { key: 'k' });

    // Simulate paste event (paste cheat attempt)
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'keyboard practice typing',
      },
    });

    // Input value should only reflect single keystroke 'k', not pasted string
    expect(input).toHaveValue('k');
  });

  it('supports pause and resume flow via keyboard and controls', async () => {
    render(<App />);

    const startBtn = screen.getByRole('button', { name: /開始挑戰/i });
    fireEvent.click(startBtn);

    const input = screen.getByLabelText(/打字輸入框/i);

    // Press Escape to pause
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText(/SESSION PAUSED|練習已暫停/i)).toBeInTheDocument();
    expect(input).toBeDisabled();

    // Resume button
    const resumeBtn = screen.getByRole('button', { name: /繼續挑戰/i });
    fireEvent.click(resumeBtn);
    expect(screen.getByText(/LIVE CHALLENGE|挑戰進行中/i)).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('allows backspace to correct a mistyped character', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i);

    // Type correct 'k', then incorrect 'x'
    fireEvent.keyDown(input, { key: 'k' });
    fireEvent.keyDown(input, { key: 'x' });
    expect(input).toHaveValue('kx');

    // Press Backspace
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(input).toHaveValue('k');
  });

  it('handles IME composition events without counting interim keystrokes', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /開始挑戰/i }));
    const input = screen.getByLabelText(/打字輸入框/i);

    // Start composition (user typing with an active IME)
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'n' });
    fireEvent.keyDown(input, { key: 'i' });

    // Interim keys must not be prematurely accepted while composing
    expect(input).toHaveValue('');

    // End composition with committed character
    fireEvent.compositionEnd(input, { data: 'k' });
    expect(input).toHaveValue('k');
  });
});
