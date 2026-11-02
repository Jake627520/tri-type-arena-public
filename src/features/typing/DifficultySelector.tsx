import React from 'react';
import { Difficulty } from '../../domain/types';
import type { UIKey } from '../../i18n/core';

interface DifficultySelectorProps {
  currentDifficulty: Difficulty;
  disabled: boolean;
  onDifficultyChange: (difficulty: Difficulty) => void;
  t?: (key: UIKey) => string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  currentDifficulty,
  disabled,
  onDifficultyChange,
  t = (k: UIKey) => k,
}) => {
  const difficulties: Array<{ id: Difficulty; labelKey: UIKey; descKey: UIKey }> = [
    { id: 'beginner', labelKey: 'difficultyBeginner', descKey: 'difficultyBeginnerDesc' },
    { id: 'intermediate', labelKey: 'difficultyIntermediate', descKey: 'difficultyIntermediateDesc' },
    { id: 'advanced', labelKey: 'difficultyAdvanced', descKey: 'difficultyAdvancedDesc' },
  ];

  return (
    <div className="difficulty-selector-wrapper" role="group" aria-label={t('difficultyLabel')}>
      <span className="config-label">{t('difficultyLabel')}</span>
      <div className="difficulty-buttons">
        {difficulties.map(({ id, labelKey, descKey }) => {
          const isActive = currentDifficulty === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              className={`difficulty-btn ${isActive ? 'active' : ''}`}
              onClick={() => onDifficultyChange(id)}
              title={t(descKey)}
              aria-pressed={isActive}
            >
              <span className="diff-name">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelector;
