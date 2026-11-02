# Specification — Typing Engine Baseline

## TE-001 Input Modes
The engine SHALL support three input modes: `en`, `pinyin`, `zhuyin`.

## TE-002 Daqian Key Mapping
In `zhuyin` mode, the engine SHALL translate Latin keyboard characters using the standard CNS 11643 Daqian mapping:
- First tone SHALL be implicit.
- Tones 2, 3, 4, light SHALL map to keys `6`, `3`, `4`, `7`.

## TE-003 Pinyin Diacritic Normalization
In `pinyin` mode, input text SHALL have all tone diacritics stripped, `ü` replaced with `v`, and whitespace/apostrophes removed.

## TE-004 WPM & Metric Integrity
The engine SHALL calculate WPM as $(\text{correctKeys} / 5) / (\text{elapsedSeconds} / 60)$.
For $\text{elapsedSeconds} < 2.0$, WPM SHALL be dampened to prevent division by near-zero spikes.
