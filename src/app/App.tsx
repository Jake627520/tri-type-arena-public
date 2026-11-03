import React, { useState, useEffect } from 'react';
import { useTypingSession } from '../features/typing/useTypingSession';
import { ModeDurationConfig } from '../features/lessons/ModeDurationConfig';
import { DifficultySelector } from '../features/typing/DifficultySelector';
import { TypingArena } from '../features/typing/TypingArena';
import { DaqianKeyboard } from '../features/keyboard/DaqianKeyboard';
import { LiveStats } from '../features/stats/LiveStats';
import { ResultModal } from '../features/results/ResultModal';
import { LearningDashboard } from '../features/learning/LearningDashboard';
import { useLocale } from '../i18n/useLocale';
import { Onboarding } from '../features/onboarding/Onboarding';
import type { Locale } from '../i18n/core';
import { locales } from '../i18n/core';
import {
  loadLearningHistory,
  clearLearningHistory,
  LearningSessionRecord,
} from '../shared/storage';
import {
  loadWeakKeyStats,
  clearWeakKeyStats,
  analyzeWeakKeys,
  KeyStat,
} from '../domain/learning/weak-keys';
import { generateReviewLessons } from '../domain/learning/review-generator';
import { getVocabularyPool } from '../domain/vocabulary/index';
import { prepareTypingLesson } from '../domain/typing-answer';
import { Mode } from '../domain/types';
import { APP_VERSION_LABEL } from '../shared/version';

export const App: React.FC = () => {
  const { locale, setLocale, t } = useLocale();

  const {
    state,
    bestScore,
    showHints,
    setShowHints,
    start,
    pause,
    resume,
    restart,
    typeChar,
    backspace,
    paste,
    switchMode,
    switchDifficulty,
    switchDuration,
    startReviewMode,
    exitReviewMode,
  } = useTypingSession({ mode: 'en', duration: 60 });

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isReviewActive, setIsReviewActive] = useState(false);
  const [history, setHistory] = useState<LearningSessionRecord[]>([]);
  const [weakKeys, setWeakKeys] = useState<KeyStat[]>([]);

  // A finished session takes precedence over the dashboard. Dismiss the
  // dashboard instead of leaving two modal focus traps active at once.
  useEffect(() => {
    if (state.status === 'finished') setIsDashboardOpen(false);
  }, [state.status]);

  // Refresh history and weak key stats when dashboard opens
  useEffect(() => {
    if (isDashboardOpen) {
      setHistory(loadLearningHistory());
      const statsMap = loadWeakKeyStats(state.mode);
      setWeakKeys(analyzeWeakKeys(statsMap, state.mode));
    }
  }, [isDashboardOpen, state.mode]);

  const handleModeChange = (newMode: Mode) => {
    setIsReviewActive(false);
    switchMode(newMode);
  };

  const handleDifficultyChange = (diff: typeof state.difficulty) => {
    setIsReviewActive(false);
    switchDifficulty(diff);
  };

  const handleStartReview = () => {
    const pool = getVocabularyPool(state.mode, state.difficulty);
    const preparedPool = pool.map((l) => prepareTypingLesson(l, state.mode));
    const statsMap = loadWeakKeyStats(state.mode);
    const currentWeakKeys = analyzeWeakKeys(statsMap, state.mode);
    const reviewLessons = generateReviewLessons(state.mode, currentWeakKeys, preparedPool, 10);
    if (reviewLessons.length > 0) {
      startReviewMode(reviewLessons);
      setIsReviewActive(true);
    }
  };

  const handleExitReview = () => {
    setIsReviewActive(false);
    exitReviewMode();
  };

  const handleClearHistory = () => {
    clearLearningHistory();
    clearWeakKeyStats();
    setHistory([]);
    setWeakKeys([]);
  };

  // Active character to highlight on Daqian keyboard
  const expectedAnswer = state.currentLesson?.answer || '';
  const nextExpectedChar = expectedAnswer[state.typedValue.length];

  const localeLabels: Record<Locale, string> = {
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    en: 'English',
  };

  return (
    <div className="arena-shell">
      <header className="top-nav">
        <div className="brand-group">
          <span className="brand-logo" aria-hidden="true">
            ⌨
          </span>
          <div>
            <h1 className="brand-title">
              TriType<span className="brand-accent">Arena</span>
            </h1>
            <span className="brand-subtitle">{t('tagline')} · {APP_VERSION_LABEL}</span>
          </div>
        </div>

        <div className="locale-selector">
          <label htmlFor="ui-locale" className="locale-label">
            {t('language')}
          </label>
          <select
            id="ui-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="locale-select"
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeLabels[l]}
              </option>
            ))}
          </select>
        </div>

        <div className="status-badges">
          <button
            type="button"
            className="btn-open-dashboard"
            onClick={() => setIsDashboardOpen(true)}
            aria-label={t('dashboardOpenBtn')}
          >
            <span>📊</span>
            <span>{t('dashboardOpenBtn')}</span>
          </button>
          <span className="badge-local">● {t('local').toUpperCase()}</span>
          <span className="badge-clean">{t('guest')}</span>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-eyebrow">{t('heroEyebrow')}</div>
          <h2 className="hero-heading">
            {t('introTitlePrefix')}
            <span className="gradient-text">{t('introTitleAccent')}</span>
          </h2>
          <p className="hero-description">{t('introText')}</p>
        </section>

        {isReviewActive && (
          <div className="review-active-banner">
            <span>🎯 {t('reviewActiveNotice')}</span>
            <button type="button" className="review-exit-btn" onClick={handleExitReview}>
              ✕
            </button>
          </div>
        )}

        <div className="game-grid">
          <div className="primary-column">
            <ModeDurationConfig
              currentMode={state.mode}
              duration={state.duration}
              status={state.status}
              showHints={showHints}
              onModeChange={handleModeChange}
              onDurationChange={switchDuration}
              onHintsToggle={setShowHints}
              locale={locale}
              t={t}
            />

            <DifficultySelector
              currentDifficulty={state.difficulty}
              disabled={state.status === 'running'}
              onDifficultyChange={handleDifficultyChange}
              t={t}
            />

            <TypingArena
              state={state}
              showHints={showHints}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onRestart={restart}
              onTypeChar={typeChar}
              onBackspace={backspace}
              onPaste={paste}
              locale={locale}
              t={t}
            />

            {state.mode === 'zhuyin' && (
              <DaqianKeyboard activeChar={nextExpectedChar} locale={locale} t={t} />
            )}
          </div>

          <aside className="sidebar-column">
            <LiveStats state={state} bestScore={bestScore} locale={locale} t={t} />

            <div className="rules-card">
              <span className="card-tag">{t('howToPlayTag')}</span>
              <h3>{t('rulesTitle')}</h3>
              <ol className="rules-steps">
                <li>{t('step1')}</li>
                <li>{t('step2')}</li>
                <li>{t('step3')}</li>
                <li>{t('step4')}</li>
                <li>{t('step5')}</li>
              </ol>
            </div>
          </aside>
        </div>
      </main>

      <footer className="footer-bar">
        <p>{t('footerText')} · <a href={`${import.meta.env.BASE_URL}notices/index.html`}>{t('footerNotices')}</a></p>
      </footer>

      <ResultModal state={state} onRestart={restart} locale={locale} t={t} />
      <Onboarding locale={locale} />

      <LearningDashboard
        isOpen={isDashboardOpen && state.status !== 'finished'}
        onClose={() => setIsDashboardOpen(false)}
        history={history}
        weakKeys={weakKeys}
        currentMode={state.mode}
        onStartReview={handleStartReview}
        onClearHistory={handleClearHistory}
        t={t}
      />
    </div>
  );
};
export default App;
