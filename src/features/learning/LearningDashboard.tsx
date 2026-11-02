import React, { useEffect, useRef } from 'react';
import { Mode } from '../../domain/types';
import type { UIKey } from '../../i18n/core';
import { LearningSessionRecord } from '../../shared/storage';
import { KeyStat } from '../../domain/learning/weak-keys';
import { TrendChart } from './TrendChart';

interface LearningDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  history: LearningSessionRecord[];
  weakKeys: KeyStat[];
  currentMode: Mode;
  onStartReview: () => void;
  onClearHistory: () => void;
  t?: (key: UIKey) => string;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  isOpen,
  onClose,
  history,
  weakKeys,
  currentMode,
  onStartReview,
  onClearHistory,
  t = (k: UIKey) => k,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSessions = history.length;
  const recentSessions = history.slice(-20);

  const avgWpm =
    totalSessions > 0
      ? Math.round(recentSessions.reduce((acc, s) => acc + s.wpm, 0) / recentSessions.length)
      : 0;

  const avgAccuracy =
    totalSessions > 0
      ? (
          recentSessions.reduce((acc, s) => acc + s.accuracy, 0) / recentSessions.length
        ).toFixed(1)
      : '0.0';

  // Mode counts
  const modeCounts = history.reduce<Record<string, number>>((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + 1;
    return acc;
  }, {});

  let mostPracticedMode: Mode = currentMode;
  let maxCount = 0;
  for (const [m, count] of Object.entries(modeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostPracticedMode = m as Mode;
    }
  }

  const wpmData = recentSessions.map((s) => s.wpm);
  const accuracyData = recentSessions.map((s) => Math.round(s.accuracy));
  const confirmedWeakKeys = weakKeys.filter((k) => k.isWeak);

  const handleClear = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      onClearHistory();
    }
  };

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-header">
          <h2 id="dashboard-title">{t('dashboardTitle')}</h2>
          <button
            type="button"
            className="dashboard-close-btn"
            onClick={onClose}
            aria-label={t('dashboardCloseBtn')}
          >
            ✕
          </button>
        </div>

        <div className="dashboard-body">
          {totalSessions === 0 ? (
            <div className="dashboard-empty-state">
              <span className="empty-icon">📊</span>
              <p>{t('dashboardEmpty')}</p>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="dashboard-metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">{t('statTotalSessions')}</span>
                  <span className="metric-value">{totalSessions}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">{t('statRecentWpm')}</span>
                  <span className="metric-value">{avgWpm} WPM</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">{t('statRecentAccuracy')}</span>
                  <span className="metric-value">{avgAccuracy}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">{t('statMostPracticed')}</span>
                  <span className="metric-value">
                    {mostPracticedMode === 'en'
                      ? t('modeEn')
                      : mostPracticedMode === 'pinyin'
                      ? t('modePinyin')
                      : t('modeZhuyin')}
                  </span>
                </div>
              </div>

              {/* Trend Charts */}
              <div className="dashboard-charts-grid">
                <TrendChart
                  title={t('trendWpm')}
                  data={wpmData}
                  unit=" WPM"
                  strokeColor="var(--color-primary, #6366f1)"
                />
                <TrendChart
                  title={t('trendAccuracy')}
                  data={accuracyData}
                  unit="%"
                  strokeColor="var(--color-success, #10b981)"
                />
              </div>

              {/* Weak-Key Analysis Section */}
              <div className="dashboard-weak-keys-section">
                <div className="section-header">
                  <h3>{t('weakKeysTitle')}</h3>
                  {confirmedWeakKeys.length > 0 && (
                    <button
                      type="button"
                      className="btn-review-practice"
                      onClick={() => {
                        onStartReview();
                        onClose();
                      }}
                    >
                      {t('reviewModeBtn')}
                    </button>
                  )}
                </div>

                {weakKeys.length === 0 ? (
                  <p className="weak-keys-empty-text">{t('weakKeysEmpty')}</p>
                ) : (
                  <div className="weak-keys-table-container">
                    <table className="weak-keys-table">
                      <thead>
                        <tr>
                          <th>{t('keyColumnKey')}</th>
                          <th>{t('keyColumnAttempts')}</th>
                          <th>{t('keyColumnErrors')}</th>
                          <th>{t('keyColumnRate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weakKeys.slice(0, 10).map((stat) => (
                          <tr key={stat.key} className={stat.isWeak ? 'row-weak' : ''}>
                            <td>
                              <span className="key-badge">
                                {stat.key}
                                {stat.physicalKey && <small> ({stat.physicalKey})</small>}
                              </span>
                            </td>
                            <td>{stat.attempts}</td>
                            <td>{stat.errors}</td>
                            <td>
                              {stat.insufficientData ? (
                                <span className="status-insufficient" title={t('weakKeysInsufficient')}>
                                  <small>{(stat.errorRate * 100).toFixed(1)}% *</small>
                                </span>
                              ) : (
                                <span className={stat.isWeak ? 'rate-weak' : ''}>
                                  {(stat.errorRate * 100).toFixed(1)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="dashboard-footer">
          {totalSessions > 0 && (
            <button type="button" className="btn-clear-history" onClick={handleClear}>
              {t('clearHistoryBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
