import React from 'react';
import { SessionState } from '../../domain/types';
import type { Locale, UIKey } from '../../i18n/core';
import { useModalFocus } from '../../shared/useModalFocus';

interface ResultModalProps {
  state: SessionState;
  onRestart: () => void;
  locale?: Locale;
  t?: (key: UIKey) => string;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  state,
  onRestart,
  t = (k: UIKey) => k,
}) => {
  const dialogRef = useModalFocus(state.status === 'finished');
  if (state.status !== 'finished') return null;

  // Aggregate typos by key to highlight weak keys
  const typoMap: Record<string, number> = {};
  for (const item of state.typos) {
    const key = item.expected
      ? `${item.expected} (${t('typoMistypedAs')} ${item.typed})`
      : `${t('typoMistyped')} ${item.typed}`;
    typoMap[key] = (typoMap[key] || 0) + 1;
  }
  const typoList = Object.entries(typoMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title" ref={dialogRef} tabIndex={-1}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="celebrate-badge">{t('resultTag')}</span>
          <h2 id="result-title">{t('resultTitle')}</h2>
        </div>

        <div className="result-score-banner">
          <div className="score-primary">
            <span className="score-label">{t('scoreFinal')}</span>
            <strong className="score-num">{state.score}</strong>
          </div>
          <div className="score-metrics">
            <div>
              <span>{t('scoreSpeed')}</span>
              <b>{state.wpm} WPM</b>
            </div>
            <div>
              <span>{t('scoreAccuracy')}</span>
              <b>{state.accuracy}%</b>
            </div>
            <div>
              <span>{t('scoreWords')}</span>
              <b>{state.words} {t('wordsUnit')}</b>
            </div>
            <div>
              <span>{t('scoreStreak')}</span>
              <b>{state.maxStreak}</b>
            </div>
          </div>
        </div>

        <div className="typo-review-section">
          <h3>{t('typoReview')} ({state.typos.length} {t('typoReviewCount')})</h3>
          {typoList.length === 0 ? (
            <p className="no-typos">{t('typoZero')}</p>
          ) : (
            <div className="typo-list">
              {typoList.slice(0, 8).map(([keyDesc, count]) => (
                <div key={keyDesc} className="typo-badge">
                  <span className="typo-key">{keyDesc}</span>
                  <span className="typo-count">{count} {t('typoTimes')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onRestart}>
            {t('btnPlayAgain')}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ResultModal;
