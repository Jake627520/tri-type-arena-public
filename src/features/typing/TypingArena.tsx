import React, { useEffect, useRef, useCallback } from 'react';
import { SessionState } from '../../domain/types';
import type { Locale, UIKey } from '../../i18n/core';
import { resolveKeyInput } from '../../domain/zhuyin-map';

interface TypingArenaProps {
  state: SessionState;
  showHints: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onTypeChar: (char: string) => void;
  onBackspace: () => void;
  onPaste: (text: string) => void;
  locale?: Locale;
  t?: (key: UIKey) => string;
}

export const TypingArena: React.FC<TypingArenaProps> = ({
  state,
  showHints,
  onStart,
  onPause,
  onResume,
  onRestart,
  onTypeChar,
  onBackspace,
  onPaste,
  t = (k: UIKey) => k,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // Synchronous focus helper
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleStart = useCallback(() => {
    focusInput();
    onStart();
  }, [focusInput, onStart]);

  const handleResume = useCallback(() => {
    focusInput();
    onResume();
  }, [focusInput, onResume]);

  const handleRestart = useCallback(() => {
    focusInput();
    onRestart();
  }, [focusInput, onRestart]);

  // Auto-focus input when running or resuming
  useEffect(() => {
    if (state.status === 'running') {
      focusInput();
    }
  }, [state.status, focusInput]);

  // Global window listener: forwards Enter to start, and redirects keystrokes to input when running
  useEffect(() => {
    function handleWindowKeyDown(e: KeyboardEvent) {
      // Never intercept browser shortcuts (Cmd+C, Cmd+R, Cmd+L, Ctrl+*, Alt+*)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Do not intercept if a modal or dialog is open
      if (document.querySelector('[role="dialog"]')) return;

      // If the typing input itself is focused and active, input's own onKeyDown handles all events
      if (document.activeElement === inputRef.current && !inputRef.current?.disabled) return;

      const activeEl = document.activeElement;
      // Do not steal focus from form controls (e.g. language select, textareas, other inputs)
      const isOtherFormControl =
        activeEl &&
        activeEl !== inputRef.current &&
        (['SELECT', 'TEXTAREA'].includes(activeEl.tagName) ||
          (activeEl.tagName === 'INPUT' && activeEl !== inputRef.current));

      if (isOtherFormControl) return;

      if (state.status === 'idle') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStart();
        }
        return;
      }

      if (state.status === 'running') {
        // Recover focus to typing input
        focusInput();

        if (e.key === 'Escape') {
          e.preventDefault();
          onPause();
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          onBackspace();
          return;
        }

        const char = resolveKeyInput(e, state.mode);
        if (char) {
          e.preventDefault();
          onTypeChar(char);
        }
      }

      if (state.status === 'paused') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleResume();
        }
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [state.status, state.mode, handleStart, handleResume, onPause, onBackspace, onTypeChar, focusInput]);

  const currentLesson = state.currentLesson;
  const expectedAnswer = currentLesson?.answer || '';
  const typedValue = state.typedValue;

  // Calculate character matching status
  const renderedChars = expectedAnswer.split('').map((char, index) => {
    let statusClass = 'char-pending';
    if (index < typedValue.length) {
      statusClass = typedValue[index] === char ? 'char-correct' : 'char-wrong';
    } else if (index === typedValue.length) {
      statusClass = 'char-current';
    }
    const isSpace = char === ' ';
    const displayChar = isSpace ? '␣' : char;
    return (
      <span
        key={index}
        className={`target-char ${statusClass}${isSpace ? ' target-char-space' : ''}`}
        title={isSpace ? t('firstToneSpaceTooltip') : undefined}
      >
        {displayChar}
      </span>
    );
  });

  const progressPercent = expectedAnswer.length
    ? Math.min(100, (typedValue.length / expectedAnswer.length) * 100)
    : 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Never intercept browser shortcuts (Cmd+C, Cmd+R, Cmd+L, Ctrl+*, Alt+*)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (state.status === 'idle') {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleStart();
        return;
      }
    }

    if (state.status === 'running') {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onPause();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        onBackspace();
        return;
      }

      // Single character or physical key code input
      // In Zhuyin mode or non-IME, physical keys take immediate effect for muscle memory training
      if (!isComposingRef.current || state.mode === 'zhuyin' || e.key === 'Process') {
        const char = resolveKeyInput(e, state.mode);
        if (char) {
          e.preventDefault();
          e.stopPropagation();
          onTypeChar(char);
        }
      }
    }

    if (state.status === 'paused') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleResume();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    onPaste(pastedText);
  };

  const handleArenaClick = (e: React.MouseEvent) => {
    if (state.status === 'running') {
      const target = e.target as HTMLElement | null;
      if (target && !['BUTTON', 'A', 'SELECT'].includes(target.tagName)) {
        focusInput();
      }
    }
  };

  return (
    <div className="typing-arena" onClick={handleArenaClick}>
      <div className="arena-header">
        <div className="status-indicator">
          <span className={`status-dot status-${state.status}`} />
          <span className="status-text">
            {state.status === 'idle' && t('statusIdle')}
            {state.status === 'running' && t('statusRunning')}
            {state.status === 'paused' && t('statusPaused')}
            {state.status === 'finished' && t('statusFinished')}
          </span>
        </div>

        <div className="timer-badge">
          <span className="timer-icon">⏱</span>
          <span className="timer-seconds">{state.remaining}s</span>
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="target-display-card">
        <div className="target-word-display" id="word">
          {currentLesson?.display}
        </div>

        {showHints && (
          <div className="target-hint" id="hint">
            {currentLesson?.hint || currentLesson?.answer}
          </div>
        )}

        {state.mode === 'zhuyin' && showHints && (
          <div className="zhuyin-space-hint-badge" id="zhuyin-space-hint">
            💡 {t('zhuyinSpaceHint')}
          </div>
        )}

        <div className="target-characters" aria-label={t('targetAriaLabel')}>
          {renderedChars}
        </div>
      </div>

      <div className="input-row">
        <input
          ref={inputRef}
          id="typing"
          type="text"
          value={state.typedValue}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={
            state.status === 'idle'
              ? t('placeholderIdle')
              : state.status === 'paused'
              ? t('placeholderPaused')
              : t('placeholderRunning')
          }
          disabled={state.status === 'finished' || state.status === 'paused'}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            // In Zhuyin mode, physical keystrokes are processed directly on keydown.
            // compositionEnd data must not duplicate already handled keystrokes.
            if (state.mode !== 'zhuyin' && e.data) {
              for (const ch of e.data) {
                onTypeChar(ch);
              }
            }
          }}
          onChange={() => {
            // Handled via onKeyDown for single-key precision and paste rejection
          }}
          className={`typing-input ${
            typedValue && !expectedAnswer.startsWith(typedValue) ? 'input-error' : ''
          }`}
          aria-label={t('inputAriaLabel')}
        />
      </div>

      <div className="arena-controls">
        {state.status === 'idle' && (
          <button type="button" className="btn-primary" id="start" onClick={handleStart}>
            {t('btnStart')}
          </button>
        )}

        {state.status === 'running' && (
          <>
            <button type="button" className="btn-secondary" onClick={onPause}>
              {t('btnPause')}
            </button>
            <button type="button" className="btn-secondary" id="restart" onClick={handleRestart}>
              {t('btnAbandon')}
            </button>
          </>
        )}

        {state.status === 'paused' && (
          <>
            <button type="button" className="btn-primary" onClick={handleResume}>
              {t('btnResume')}
            </button>
            <button type="button" className="btn-secondary" onClick={handleRestart}>
              {t('btnRestart')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default TypingArena;
