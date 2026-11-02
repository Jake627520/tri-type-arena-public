# Asset & Prompt Provenance Record

This document records the origin, authorship, and licensing of all non-trivial assets, prompts, word banks, and fonts used in TriType Arena.

## 1. Word Banks & Prompts

The repository owner reports that another AI temporarily collected the initial vocabulary. Its underlying sources, selection process, and license are unknown. The English batch has since been replaced using the documented [Moby source](./vocabulary/MOBY_ENGLISH.md); the Chinese batches have been replaced with [documented candidates](./vocabulary/CHINESE_CANDIDATES.md); the original data remains in Git history. The current batches are cleared for public release based on the documented source and license statements; this is not a legal guarantee. See [vocabulary provenance](./vocabulary/PROVENANCE.md).

## 2. Fonts and Typography
- System font stack prioritizing native modern sans-serif:
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif`.
  - Zero external web fonts loaded via CDN in offline mode; optional open-source Google Font (Outfit / Inter) with SIL Open Font License (OFL 1.1).

## 3. Visuals & Icons
- Unicode glyphs and Lucide SVG icons (ISC licensed).
- No raster bitmaps or scraped brand assets.
