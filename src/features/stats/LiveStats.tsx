import React from 'react';
import { SessionState } from '../../domain/types';
import type { Locale, UIKey } from '../../i18n/core';

interface LiveStatsProps {
  state: SessionState;
  bestScore: number;
  locale?: Locale;
  t?: (key: UIKey) => string;
}

export const LiveStats: React.FC<LiveStatsProps> = ({
  state,
  bestScore,
  t = (k: UIKey) => k,
}) => {
  return (
    <div className="stats-card">
      <div className="card-header">
        <span className="card-tag">{t('liveTag')}</span>
        <h3>{t('livePerformance')}</h3>
      </div>

      <div
        className="stats-grid"
        aria-live="polite"
        data-total-keys={state.totalKeys}
        data-correct-keys={state.correctKeys}
        data-words={state.words}
      >
        <div className="stat-box">
          <span className="stat-label">{t('statSpeed')}</span>
          <div className="stat-value">
            <strong>{state.wpm}</strong>
            <small>WPM</small>
          </div>
        </div>

        <div className="stat-box">
          <span className="stat-label">{t('statAccuracy')}</span>
          <div className="stat-value">
            <strong>{state.accuracy}</strong>
            <small>%</small>
          </div>
        </div>

        <div className="stat-box">
          <span className="stat-label">{t('statWords')}</span>
          <div className="stat-value">
            <strong>{state.words}</strong>
            <small>WORDS</small>
          </div>
        </div>

        <div className="stat-box">
          <span className="stat-label">{t('statStreak')}</span>
          <div className="stat-value">
            <strong className={state.streak >= 5 ? 'combo-fire' : ''}>
              {state.streak}
            </strong>
            <small>COMBO</small>
          </div>
        </div>
      </div>

      <div className="best-score-banner">
        <span className="trophy-icon">🏆</span>
        <div>
          <span className="best-label">{t('statBest')}</span>
          <b className="best-value">{bestScore}</b>
        </div>
      </div>
    </div>
  );
};
export default LiveStats;
