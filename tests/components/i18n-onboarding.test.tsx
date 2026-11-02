import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Onboarding, initialGuideOpen } from '../../src/features/onboarding/Onboarding';
import { parseLocale, readLocale, translate } from '../../src/i18n/core';

// ---------------------------------------------------------------------------
// i18n core unit tests
// ---------------------------------------------------------------------------
describe('i18n — parseLocale', () => {
  it('maps zh-CN to simplified', () => expect(parseLocale('zh-CN')).toBe('zh-CN'));
  it('maps zh-SG to simplified', () => expect(parseLocale('zh-SG')).toBe('zh-CN'));
  it('maps zh-Hans-HK to simplified', () => expect(parseLocale('zh-Hans-HK')).toBe('zh-CN'));
  it('maps zh-TW to traditional', () => expect(parseLocale('zh-TW')).toBe('zh-TW'));
  it('maps zh to traditional (generic zh)', () => expect(parseLocale('zh')).toBe('zh-TW'));
  it('maps en to English', () => expect(parseLocale('en')).toBe('en'));
  it('maps unknown to English', () => expect(parseLocale('fr')).toBe('en'));
  it('handles null/undefined gracefully', () => {
    expect(parseLocale(null)).toBe('en');
    expect(parseLocale(undefined)).toBe('en');
  });
});

describe('i18n — readLocale', () => {
  it('returns saved locale from storage when valid', () => {
    const storage = { getItem: () => 'zh-CN' };
    expect(readLocale(storage as Storage, 'en')).toBe('zh-CN');
  });

  it('ignores invalid saved locale and falls back to navigator', () => {
    const storage = { getItem: () => 'fr' };
    expect(readLocale(storage as Storage, 'zh-TW')).toBe('zh-TW');
  });

  it('falls back to navigator when storage throws', () => {
    const storage = { getItem: () => { throw new Error('denied'); } };
    expect(readLocale(storage as unknown as Storage, 'zh-CN')).toBe('zh-CN');
  });

  it('falls back to navigator when storage is null', () => {
    expect(readLocale(null, 'zh-TW')).toBe('zh-TW');
  });
});

describe('i18n — translate', () => {
  it('translates guide key to Traditional Chinese', () =>
    expect(translate('zh-TW', 'guide')).toBe('新手導覽'));

  it('translates guide key to Simplified Chinese', () =>
    expect(translate('zh-CN', 'guide')).toBe('新手指引'));

  it('translates guide key to English', () =>
    expect(translate('en', 'guide')).toBe('Quick start'));

  it('translates all 3x3 mode labels exist — 3 locales × language key', () => {
    for (const locale of ['zh-TW', 'zh-CN', 'en'] as const) {
      expect(translate(locale, 'language')).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Onboarding component tests (GUIDE-001 / GUIDE-002 / GUIDE-003)
// ---------------------------------------------------------------------------
describe('Onboarding — initialGuideOpen', () => {
  it('returns true when key not set', () => {
    const storage = { getItem: () => null };
    expect(initialGuideOpen(storage as Storage)).toBe(true);
  });

  it('returns false when key is "yes"', () => {
    const storage = { getItem: () => 'yes' };
    expect(initialGuideOpen(storage as Storage)).toBe(false);
  });

  it('returns true when storage throws', () => {
    const storage = { getItem: () => { throw new Error('denied'); } };
    expect(initialGuideOpen(storage as unknown as Storage)).toBe(true);
  });
});

describe('Onboarding — component (zh-TW)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('GUIDE-001: renders dialog on first visit with title and steps', () => {
    render(<Onboarding locale="zh-TW" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('歡迎來到 TriType Arena')).toBeInTheDocument();
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('GUIDE-001: Next button advances to step 2', async () => {
    render(<Onboarding locale="zh-TW" />);
    fireEvent.click(screen.getByText('下一步'));
    expect(screen.getByText(/2\/3/)).toBeInTheDocument();
  });

  it('GUIDE-001: Back button returns to step 1', async () => {
    render(<Onboarding locale="zh-TW" />);
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('上一步'));
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('GUIDE-001: Finish button on step 3 dismisses dialog', () => {
    render(<Onboarding locale="zh-TW" />);
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('下一步'));
    fireEvent.click(screen.getByText('開始使用'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('GUIDE-001: Skip dismisses dialog immediately', () => {
    render(<Onboarding locale="zh-TW" />);
    fireEvent.click(screen.getByText('跳過'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('GUIDE-002: dialog does not reopen on second render when storage key is set', () => {
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<Onboarding locale="zh-TW" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重新開啟新手教學/i })).toBeInTheDocument();
  });

  it('GUIDE-002: Reopen button re-shows dialog', () => {
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    render(<Onboarding locale="zh-TW" />);
    fireEvent.click(screen.getByRole('button', { name: /重新開啟新手教學/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('GUIDE-003: dialog has aria-modal and aria-labelledby', () => {
    render(<Onboarding locale="zh-TW" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
  });

  it('GUIDE-003: Escape key dismisses the dialog', () => {
    render(<Onboarding locale="zh-TW" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Onboarding — locale switching', () => {
  beforeEach(() => localStorage.clear());

  it('renders English labels when locale=en', () => {
    render(<Onboarding locale="en" />);
    expect(screen.getByText('Welcome to TriType Arena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('renders Simplified Chinese labels when locale=zh-CN', () => {
    render(<Onboarding locale="zh-CN" />);
    expect(screen.getByText('欢迎来到 TriType Arena')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
  });

  it('GUIDE-002: privacy notice is shown in correct locale', () => {
    render(<Onboarding locale="en" />);
    expect(screen.getByText(/Results stay in this browser/)).toBeInTheDocument();
  });
});
