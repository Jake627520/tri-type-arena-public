import React from 'react';
import { ZHUYIN_KEYS, ZHUYIN_KEY_ORDER } from '../../domain/zhuyin-map';
import type { Locale, UIKey } from '../../i18n/core';

interface DaqianKeyboardProps {
  activeChar?: string;
  locale?: Locale;
  t?: (key: UIKey) => string;
}

export const DaqianKeyboard: React.FC<DaqianKeyboardProps> = ({
  activeChar,
  t = (k: UIKey) => k,
}) => {
  // Find which physical Latin key maps to the active Zhuyin symbol
  const activePhysicalKey = activeChar
    ? Object.keys(ZHUYIN_KEYS).find((k) => ZHUYIN_KEYS[k] === activeChar)
    : undefined;
  const isSpaceActive = activeChar === ' ';

  return (
    <div className="keyboard-container" aria-label={t('keyboardAriaLabel')}>
      <div className="keyboard-header">
        <div className="keyboard-title">
          <span className="keyboard-badge">{t('keyboardBadge')}</span>
          <strong>{t('keyboardTitle')}</strong>
        </div>
        <small className="keyboard-subtitle">{t('keyboardSubtitle')}</small>
      </div>

      <div className="keyboard-grid" role="region" aria-label={t('keyboardGridAria')}>
        {ZHUYIN_KEY_ORDER.split('').map((key) => {
          const zhuyin = ZHUYIN_KEYS[key];
          if (!zhuyin) return null;
          const isActive = key === activePhysicalKey;
          return (
            <div
              key={key}
              className={`key-cap ${isActive ? 'key-active' : ''}`}
              title={`${t('keyboardKeyTitle')} ${key} → ${zhuyin}`}
            >
              <span className="key-latin">{key.toUpperCase()}</span>
              <span className="key-zhuyin">{zhuyin}</span>
            </div>
          );
        })}
      </div>

      <div className="keyboard-space-bar-wrap">
        <div
          className={`key-cap key-space-bar ${isSpaceActive ? 'key-active' : ''}`}
          title={`${t('keyboardKeyTitle')} Space → ${t('firstToneSpaceLabel')}`}
          aria-label={`${t('keyboardKeyTitle')} Space ${t('firstToneSpaceLabel')}`}
          id="daqian-space-key"
        >
          <span className="key-latin">SPACE</span>
          <span className="key-zhuyin">␣ ({t('firstToneSpaceLabel')})</span>
        </div>
      </div>

      <p className="keyboard-note">{t('keyboardNote')}</p>
    </div>
  );
};
export default DaqianKeyboard;
