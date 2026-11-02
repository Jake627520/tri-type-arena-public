import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DifficultySelector } from '../../src/features/typing/DifficultySelector';
import { translate } from '../../src/i18n/core';

describe('LEVEL: Difficulty Selector Component (FR-003)', () => {
  it('LEVEL-001: Renders three difficulty options: beginner, intermediate, advanced', () => {
    render(
      <DifficultySelector
        currentDifficulty="beginner"
        disabled={false}
        onDifficultyChange={() => {}}
        t={(k) => translate('zh-TW', k)}
      />
    );

    expect(screen.getByRole('button', { name: /初級/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /中級/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /高級/i })).toBeInTheDocument();
  });

  it('LEVEL-002: Clicking difficulty option calls onDifficultyChange callback', () => {
    const onChange = vi.fn();
    render(
      <DifficultySelector
        currentDifficulty="beginner"
        disabled={false}
        onDifficultyChange={onChange}
        t={(k) => translate('en', k)}
      />
    );

    const advancedBtn = screen.getByRole('button', { name: /Advanced/i });
    fireEvent.click(advancedBtn);
    expect(onChange).toHaveBeenCalledWith('advanced');
  });

  it('LEVEL-003: Buttons are disabled when running', () => {
    render(
      <DifficultySelector
        currentDifficulty="intermediate"
        disabled={true}
        onDifficultyChange={() => {}}
        t={(k) => translate('en', k)}
      />
    );

    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
  });

  it('LEVEL-006: Renders appropriate labels across locales', () => {
    const { rerender } = render(
      <DifficultySelector
        currentDifficulty="beginner"
        disabled={false}
        onDifficultyChange={() => {}}
        t={(k) => translate('zh-CN', k)}
      />
    );
    expect(screen.getByRole('button', { name: /初级/i })).toBeInTheDocument();

    rerender(
      <DifficultySelector
        currentDifficulty="beginner"
        disabled={false}
        onDifficultyChange={() => {}}
        t={(k) => translate('en', k)}
      />
    );
    expect(screen.getByRole('button', { name: /Beginner/i })).toBeInTheDocument();
  });
});
