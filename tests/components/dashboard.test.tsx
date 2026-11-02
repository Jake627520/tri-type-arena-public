import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LearningDashboard } from '../../src/features/learning/LearningDashboard';
import { translate } from '../../src/i18n/core';
import { LearningSessionRecord } from '../../src/shared/storage';
import { KeyStat } from '../../src/domain/learning/weak-keys';

describe('DASH: Learning Dashboard & Weak-Key UI (FR-007)', () => {
  const sampleHistory: LearningSessionRecord[] = [
    {
      id: 'sess-1',
      mode: 'en',
      difficulty: 'beginner',
      startedAt: '2026-10-26T10:00:00Z',
      completedAt: '2026-10-26T10:01:00Z',
      durationSeconds: 60,
      completedWords: 30,
      totalKeys: 150,
      correctKeys: 145,
      errors: 5,
      wpm: 30,
      accuracy: 96.6,
      score: 310,
    },
  ];

  const sampleWeakKeys: KeyStat[] = [
    {
      key: 'q',
      attempts: 20,
      errors: 6,
      errorRate: 0.3,
      lastPracticed: '2026-10-26T10:00:00Z',
      isWeak: true,
      insufficientData: false,
    },
  ];

  it('DASH-001: Renders empty state when history is empty', () => {
    render(
      <LearningDashboard
        isOpen={true}
        onClose={() => {}}
        history={[]}
        weakKeys={[]}
        currentMode="en"
        onStartReview={() => {}}
        onClearHistory={() => {}}
        t={(k) => translate('zh-TW', k)}
      />
    );

    expect(screen.getByText(/尚未有練習紀錄/i)).toBeInTheDocument();
  });

  it('DASH-002: Renders statistics summary and trend when history exists', () => {
    render(
      <LearningDashboard
        isOpen={true}
        onClose={() => {}}
        history={sampleHistory}
        weakKeys={[]}
        currentMode="en"
        onStartReview={() => {}}
        onClearHistory={() => {}}
        t={(k) => translate('zh-TW', k)}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // 1 session
    expect(screen.getAllByText(/30 WPM/i).length).toBeGreaterThan(0);
  });

  it('DASH-003: Lists weak keys and allows starting review session', () => {
    const onReview = vi.fn();
    render(
      <LearningDashboard
        isOpen={true}
        onClose={() => {}}
        history={sampleHistory}
        weakKeys={sampleWeakKeys}
        currentMode="en"
        onStartReview={onReview}
        onClearHistory={() => {}}
        t={(k) => translate('en', k)}
      />
    );

    expect(screen.getByText('q')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();

    const reviewBtn = screen.getByRole('button', { name: /Start Weak-Key Review/i });
    fireEvent.click(reviewBtn);
    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('DASH-004: Supports dialog close via button and escape key', () => {
    const onClose = vi.fn();
    render(
      <LearningDashboard
        isOpen={true}
        onClose={onClose}
        history={sampleHistory}
        weakKeys={[]}
        currentMode="en"
        onStartReview={() => {}}
        onClearHistory={() => {}}
        t={(k) => translate('en', k)}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close Dashboard/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('DASH-005: Dialog has accessible attributes role="dialog" and aria-modal="true"', () => {
    render(
      <LearningDashboard
        isOpen={true}
        onClose={() => {}}
        history={sampleHistory}
        weakKeys={[]}
        currentMode="en"
        onStartReview={() => {}}
        onClearHistory={() => {}}
        t={(k) => translate('zh-TW', k)}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('DASH-006: Clearing history prompts confirmation and calls callback', () => {
    const onClear = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <LearningDashboard
        isOpen={true}
        onClose={() => {}}
        history={sampleHistory}
        weakKeys={[]}
        currentMode="en"
        onStartReview={() => {}}
        onClearHistory={onClear}
        t={(k) => translate('en', k)}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /Clear History/i });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});
