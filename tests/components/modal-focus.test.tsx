import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearningDashboard } from '../../src/features/learning/LearningDashboard';
import { ResultModal } from '../../src/features/results/ResultModal';
import { createGameSession } from '../../src/domain/session';
import { App } from '../../src/app/App';

describe('modal keyboard focus', () => {
  it('focuses the dashboard, wraps Tab in both directions and returns to its opener', async () => {
    const user = userEvent.setup();
    function Fixture() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open dashboard</button>
        <LearningDashboard isOpen={open} onClose={() => setOpen(false)}
          history={[{ id: '1', mode: 'en', difficulty: 'beginner', startedAt: '', completedAt: '', durationSeconds: 1, completedWords: 1, totalKeys: 1, correctKeys: 1, errors: 0, wpm: 1, accuracy: 100, score: 1 }]}
          weakKeys={[]} currentMode="en" onStartReview={() => {}} onClearHistory={() => {}} />
      </>;
    }
    render(<Fixture />);
    const opener = screen.getByRole('button', { name: 'Open dashboard' });
    await user.click(opener);
    const close = screen.getByRole('button', { name: 'dashboardCloseBtn' });
    const clear = screen.getByRole('button', { name: 'clearHistoryBtn' });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(clear).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(opener).toHaveFocus();
  });

  it('focuses and traps the result action, then restores the prior focus on restart', async () => {
    const user = userEvent.setup();
    const session = createGameSession();
    const finished = { ...session.getState(), status: 'finished' as const };
    function Fixture() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Finish</button>
        <ResultModal state={open ? finished : session.getState()} onRestart={() => setOpen(false)} />
      </>;
    }
    render(<Fixture />);
    const opener = screen.getByRole('button', { name: 'Finish' });
    await user.click(opener);
    const restart = screen.getByRole('button', { name: 'btnPlayAgain' });
    expect(restart).toHaveFocus();
    await user.tab();
    expect(restart).toHaveFocus();
    await user.tab({ shift: true });
    expect(restart).toHaveFocus();
    await user.click(restart);
    expect(opener).toHaveFocus();
  });

  it('dismisses the dashboard when a running game finishes and focuses the result', () => {
    vi.useFakeTimers();
    try {
      localStorage.clear();
      localStorage.setItem('tritype.ui.locale', 'en');
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
      render(<App />);
      fireEvent.change(screen.getByLabelText('Time limit:'), { target: { value: '30' } });
      fireEvent.click(screen.getByRole('button', { name: /Start Challenge/i }));
      const dashboardButton = screen.getByRole('button', { name: 'Learning Dashboard' });
      dashboardButton.focus();
      fireEvent.click(dashboardButton);
      expect(screen.getByRole('dialog', { name: /Learning Progress/i })).toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(30_200); });
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      const restart = screen.getByRole('button', { name: /Play Again/i });
      expect(restart).toHaveFocus();
      fireEvent.keyDown(restart, { key: 'Tab' });
      expect(restart).toHaveFocus();
      fireEvent.click(restart);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
