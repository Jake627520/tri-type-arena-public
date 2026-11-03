import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createGameSession } from '../../src/domain/session';
import { createMockClock } from '../../src/domain/clock';
import { ResultModal } from '../../src/features/results/ResultModal';

describe('maximum streak', () => {
  it('shows the highest streak even after a later mistake, and resets for a new session', () => {
    const clock = createMockClock();
    const session = createGameSession({ clock, duration: 1, lessons: [{ display: 'a', answer: 'a' }] });
    session.dispatch({ type: 'START' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'a' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'a' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'x' });
    session.dispatch({ type: 'BACKSPACE' });
    session.dispatch({ type: 'TYPE_CHAR', char: 'a' });
    expect(session.getState()).toMatchObject({ streak: 1, maxStreak: 2 });
    clock.advance(1000);
    session.dispatch({ type: 'TICK' });
    render(<ResultModal state={session.getState()} onRestart={() => {}} />);
    expect(screen.getByText('scoreStreak').nextElementSibling).toHaveTextContent('2');
    session.dispatch({ type: 'RESTART' });
    expect(session.getState()).toMatchObject({ streak: 0, maxStreak: 0 });
    session.dispatch({ type: 'START' });
    expect(session.getState().maxStreak).toBe(0);
  });
});
