import React from 'react';
import { Mode, SessionStatus } from '../../domain/types';
import type { Locale, UIKey } from '../../i18n/core';

interface ModeDurationConfigProps {
  currentMode: Mode;
  duration: number;
  status: SessionStatus;
  showHints: boolean;
  onModeChange: (mode: Mode) => void;
  onDurationChange: (duration: number) => void;
  onHintsToggle: (checked: boolean) => void;
  locale?: Locale;
  t?: (key: UIKey) => string;
}

export const ModeDurationConfig: React.FC<ModeDurationConfigProps> = ({
  currentMode,
  duration,
  status,
  showHints,
  onModeChange,
  onDurationChange,
  onHintsToggle,
  t = (k: UIKey) => k,
}) => {
  const isRunning = status === 'running';

  return (
    <div className="config-section">
      <div className="mode-selector" role="group" aria-label={t('modeSelectLabel')}>
        <button
          type="button"
          disabled={isRunning}
          className={`mode-btn ${currentMode === 'en' ? 'active' : ''}`}
          onClick={() => onModeChange('en')}
        >
          <span className="mode-icon">EN</span>
          <span className="mode-text">
            <b>{t('modeEn')}</b>
            <small>{t('modeEnDesc')}</small>
          </span>
        </button>

        <button
          type="button"
          disabled={isRunning}
          className={`mode-btn ${currentMode === 'pinyin' ? 'active' : ''}`}
          onClick={() => onModeChange('pinyin')}
        >
          <span className="mode-icon">拼</span>
          <span className="mode-text">
            <b>{t('modePinyin')}</b>
            <small>{t('modePinyinDesc')}</small>
          </span>
        </button>

        <button
          type="button"
          disabled={isRunning}
          className={`mode-btn ${currentMode === 'zhuyin' ? 'active' : ''}`}
          onClick={() => onModeChange('zhuyin')}
        >
          <span className="mode-icon">注</span>
          <span className="mode-text">
            <b>{t('modeZhuyin')}</b>
            <small>{t('modeZhuyinDesc')}</small>
          </span>
        </button>
      </div>

      <div className="secondary-config">
        <div className="duration-picker">
          <label htmlFor="duration-select">{t('durationLabel')}</label>
          <select
            id="duration-select"
            disabled={isRunning}
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
          >
            <option value={30}>{t('duration30')}</option>
            <option value={60}>{t('duration60')}</option>
            <option value={120}>{t('duration120')}</option>
          </select>
        </div>

        <label className="hints-toggle">
          <input
            type="checkbox"
            checked={showHints}
            onChange={(e) => onHintsToggle(e.target.checked)}
          />
          <span>{t('showHints')}</span>
        </label>
      </div>
    </div>
  );
};
export default ModeDurationConfig;
