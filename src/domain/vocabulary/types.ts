import { Difficulty, Mode } from '../types';
export type { Difficulty };

export interface VocabularyEntry {
  id: string;
  mode: Mode;
  display: string;
  answer: string;
  hint?: string;
  difficulty: Difficulty;
  category: string;
  frequencyRank?: number;
  sourceNote?: string;
}
