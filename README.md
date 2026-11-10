# TriType Arena

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

Version: **0.4.1** — Local-first multilingual typing trainer built with React 18 and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[Tests](tests)
Production: [tri-type-arena.vercel.app](https://tri-type-arena.vercel.app/).

---

## 1. Project Overview

**TriType Arena** is a browser-native typing trainer designed specifically for multilingual typing instruction across English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin (Taiwan standard Daqian layout). Built on a pure local-first architecture, it runs entirely in the browser with zero backend requirements, zero account registration, and zero telemetry tracking, offering an ultra-low latency, privacy-preserving typing workout.

- The production site is [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/), deployed by Vercel from this repository.
- **Target Audience**: Typists, bilingual developers, and learners seeking to build keyboard muscle memory across Latin and Chinese phonetic input systems.

---

## 2. Features

- **Trilingual User Interface (UI i18n)**: Full localization across Traditional Chinese (`zh-TW`), Simplified Chinese (`zh-CN`), and English (`en`). The navigation selector switches immediately. A saved `tritype.ui.locale` of `en`, `zh-TW`, or `zh-CN` wins; otherwise the app reads `navigator.language` (`zh-CN`, `zh-SG`, and `zh-Hans*` → Simplified Chinese, other `zh*` → Traditional Chinese, everything else → English).
- **Accessible Onboarding**: 3-step dialog: choose a mode, set the time limit and hints, then start typing and watch accuracy and speed. The dialog traps Tab focus, closes on Escape, restores focus, and can be reopened.
- **Timed Challenges**: 30s sprint, 60s standard, and 120s endurance practice rounds.
- **Real-Time Telemetry**: WPM, accuracy (`correctKeys / totalKeys`), completed-word count, and the current streak (shown as COMBO while playing). The result dialog adds max streak.
- **Initial Dampening**: While `elapsedSeconds < 2`, displayed WPM ramps up from a 2-second baseline instead of dividing by a near-zero elapsed time.
- **Anti-Cheat Protection**: Any clipboard paste is rejected (`PASTE_PROHIBITED`), including a single character. Progress comes from individual keystrokes.
- **Keyboard Controls**: `Enter` starts from idle. `Esc` pauses a running round. `Space` or `Enter` resumes while paused. During a running round, `Space` is a typed character (required for Zhuyin first tone), not a resume shortcut.
- **Learning Dashboard**: SVG trend charts (no chart library) of the latest 20 stored sessions, plus weak-key stats and a review launcher.

---

## 3. Three Typing Modes

The application supports three distinct input systems, completely decoupled from the UI interface language:

1. **English Standard Typing (`en`)**
   - 500 single words from the Moby Words II frequency list. Tiers follow word length (2–4, 5–6, and 7+ letters), not phrases or a programming glossary.
   - Character-by-character comparison, with Backspace removing the last typed character.

2. **Simplified Chinese Hanyu Pinyin (`pinyin`)**
   - Tone-mark-free Hanyu Pinyin answers, for example `zaocan` for `早餐` (the hint can still show `zǎo cān`).
   - Each keystroke is normalized: tone marks are stripped and `ü` is mapped to `v`.

3. **Traditional Chinese Zhuyin / Bopomofo (`zhuyin`)**
   - Taiwan **Daqian** physical-key map. `5`, `j`, `/`, and Space produce `ㄓ`, `ㄨ`, `ㄥ`, and the first-tone space.
   - Real-time Daqian visual keyboard displaying dynamic active-key highlights.
   - Dedicated focus on physical key-to-phonetic symbol muscle memory. The mode does not open an OS candidate list.

---

## 4. Difficulty Levels

TriType Arena provides three distinct difficulty tiers backed by a curated 1,100-entry vocabulary catalog:

| Difficulty | English (500 words) | Pinyin (300 words) | Zhuyin (300 words) |
|---|---|---|---|
| **Beginner** | 200 words, 2–4 letters | 120 daily-life entries | 120 entries transcribed from the Pinyin list |
| **Intermediate** | 200 words, 5–6 letters | 120 daily-life entries | 120 entries transcribed from the Pinyin list |
| **Advanced** | 100 words, 7 or more letters | 60 daily-life entries | 60 entries transcribed from the Pinyin list |

- English tiers are typing length from Moby Words II, not a proficiency grade. The list is single common words.
- Pinyin and Zhuyin share one daily-life word list. The 120 / 120 / 60 split keeps the catalog quotas; it is not a separately graded difficulty scale. Zhuyin is a mechanical transcription of the Pinyin readings.
- **Selection Engine**: `ShuffleBag` shuffles with Fisher-Yates and will not place the last item of cycle $N$ first in cycle $N+1$ when the pool has more than one item. A seed can be injected for a deterministic order. The normal challenge UI does not set a seed, so it uses `Math.random`.

---

## 5. Zhuyin First-Tone Space Rule (v0.4.1)

In Taiwanese Daqian keyboard practice, the **first tone (陰平)** has no physical tone mark key on standard keyboards. Following authentic typing rules:

- **Mandatory Space Keystroke**: Users **must press the physical Space key (`' '`)** to complete first-tone syllables (e.g. `ㄓㄨㄥ` + `Space` for `中`).
- **Tones 2, 3, 4, and Neutral**: Enter them with `6` (ˊ), `3` (ˇ), `4` (ˋ), and `7` (˙). Those syllables do not include a Space in the answer. An extra Space is stored as the typed character and counted as an error.
- **Scoring & Metrics**: The physical Space key in first-tone syllables is treated as a valid keystroke, counted toward `totalKeys`, `correctKeys`, WPM, and error rate analytics.
- **Visual Guidance**: When a first-tone Space is expected, the virtual keyboard spacebar (`#daqian-space-key`) activates `.key-active`, and the target character renders with an open box glyph `␣` (`target-char-space`).

---

## 6. Learning History & Weak-Key Review

TriType Arena includes an offline learning analytics engine:

- **Session Retention**: Completed challenge and review sessions are stored in `localStorage` under `tritype.learning.v1` (latest 200 sessions, FIFO). Trend charts and dashboard averages use the latest 20 of those records.
- **Weak-Key Qualification**: Keystrokes accumulate per mode in `tritype.weakkeys.v1.${mode}`. A key is confirmed weak at $\ge 10$ attempts and an error rate $\ge 20\%$.
- **Review Mode**: Builds a practice list of up to 10 lessons from confirmed weak keys in the current mode and difficulty. If there are no confirmed weak keys, or no matching lessons, review does not start.
- **Challenge Best Score Isolation**: Review sessions are tagged `sessionType: 'review'`. Only `sessionType: 'challenge'` updates best scores (`tritype.best.v2`). Review sessions are still written to learning history.

---

## 7. Getting Started

### Prerequisites
- Node.js 22.x
- npm >= 10.0.0

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/Jake627520/tri-type-arena-public.git
cd tri-type-arena-public

# Install clean dependencies
npm ci

# Start the Vite dev server.
# vite.config.ts sets server.port to 4174 and server.host to true (all interfaces).
# strictPort is not set, so a busy 4174 moves to the next free port.
npm run dev
# Open the URL Vite prints. With 4174 free, that is http://localhost:4174/
```

### Production Build & Preview
```bash
# Typecheck with tsc, then write the production bundle to dist/
npm run build

# Serve dist/ with Vite preview.
# preview.port is not set, so Vite 6 uses its default port 4173.
# preview.host is not set, so Vite reuses server.host (all interfaces).
npm run preview
# Open the URL Vite prints. With 4173 free, that is http://localhost:4173/

# Provenance check, vocabulary release gate, then the same production build.
# vercel.json sets this as the Vercel build command.
npm run build:release
```

---

## 8. Running Tests

Run the automated checks below:

```bash
# Local quality gate, in order: typecheck, lint, npm test, test:vitest,
# validate:provenance, audit:licenses, audit:security, and npm run build.
# This does not run Playwright and does not run build:release.
npm run check
```

### Individual Test Commands
- **Node.js unit and compliance suite**: `npm test` runs `node --test tests/*.test.mjs` (66 tests on this tree).
- **Vitest component and domain suite**: `npm run test:vitest` (318 tests in `tests/domain` and `tests/components`).
- **Playwright** (`tests/e2e`, 20 tests per browser project). The config defines Chromium and WebKit only; there is no Firefox project.
  - Install the browser first: `npx playwright install chromium` or `npx playwright install webkit`. On Linux, WebKit also needs the OS libraries from `npx playwright install-deps webkit` (that step needs install privileges). `npx playwright install --with-deps <browser>` does both. CI installs Chromium with `--with-deps`.
  - Each command starts `npm run dev` itself and requires port 4174 to be free (`reuseExistingServer: false`). `baseURL` is `http://localhost:4174`.
  - Chromium (20 tests): `npm run test:e2e`
  - WebKit (20 tests): `npm run test:e2e:webkit`
  - Both projects (40 tests): `npm run test:e2e:all`
- **Static Analysis**:
  - TypeScript: `npm run typecheck` (`tsc --noEmit`)
  - ESLint: `npm run lint` (`eslint src`)
- **Security & Licensing**:
  - License audit: `npm run audit:licenses` checks lockfile licenses against the project allowlist, then re-runs `tests/license-audit.test.mjs`.
  - Security audit: `npm run audit:security` scans git history and tracked files for secrets, runs `npm audit --omit=dev` (production dependencies only), and runs Gitleaks when the binary is installed. A missing Gitleaks binary warns and continues locally; when `CI=true`, a missing binary fails the audit.
  - Provenance validation: `npm run validate:provenance` checks the 1,100-entry dataset against the source register.

---

## 9. Architecture & Technology Stack

```
tri-type-arena-public/
├── index.html                  # Browser entry → src/app/main.tsx
├── src/
│   ├── app/                    # Shell (main.tsx, App.tsx, styles.css)
│   ├── domain/                 # Typing rules and vocabulary. Weak-key helpers read localStorage.
│   │   ├── vocabulary/         # 1,100 entries across en, pinyin, zhuyin
│   │   ├── learning/           # History helpers, weak keys, review generator,
│   │   │                       # and adaptive helpers (the UI does not start them)
│   │   ├── shuffle-bag.ts      # Fisher-Yates bag with boundary deduplication
│   │   ├── typing-answer.ts    # Phonetic answers and first-tone Space
│   │   ├── session.ts          # Typing state machine
│   │   ├── metrics.ts          # WPM, accuracy, and score
│   │   ├── zhuyin-map.ts       # Daqian map and input normalization
│   │   └── prng.ts             # Optional seeded RNG
│   ├── features/
│   │   ├── typing/             # TypingArena, DifficultySelector, useTypingSession
│   │   ├── lessons/            # Mode and 30/60/120 duration controls
│   │   ├── keyboard/           # DaqianKeyboard
│   │   ├── learning/           # LearningDashboard, TrendChart
│   │   ├── stats/              # LiveStats
│   │   ├── results/            # ResultModal
│   │   └── onboarding/         # Onboarding dialog
│   ├── i18n/                   # Messages and useLocale (core.ts, useLocale.ts)
│   └── shared/                 # localStorage helpers and version
├── tests/
│   ├── *.test.mjs              # Node test runner (`npm test`)
│   ├── domain/                 # Vitest domain tests
│   ├── components/             # Vitest component tests
│   └── e2e/                    # Playwright (Chromium and WebKit)
├── scripts/                    # Provenance, license, and security audits
├── docs/                       # Specs, architecture, and vocabulary records
├── public/notices/             # Third-party notices
├── openspec/                   # Spec-driven change proposals
├── vite.config.ts              # Dev port 4174; preview uses Vite's default 4173
└── vercel.json                 # buildCommand: npm run build:release
```

Node tests also import legacy modules at `src/engine.mjs`, `src/app.mjs`, and `src/legacy-lessons.mjs`. Those files are not the browser entry.

| Layer | Technology Choice |
|---|---|
| **Frontend Framework** | React 18.3.1 |
| **Language** | TypeScript 5.9.3 (strict). `package.json` allows `^5.6.3`; the lockfile resolves 5.9.3 |
| **Build Tool** | Vite 6.4.5. Dev server port 4174; preview port 4173 |
| **Unit Testing** | Node.js test runner + Vitest 4.1.12 |
| **Component Testing** | React Testing Library + jsdom (through Vitest) |
| **E2E Testing** | Playwright 1.64 (Chromium and WebKit projects only) |
| **Code Style** | ESLint 9.39 |
| **Deployment** | Vercel static hosting. Committed build command: `npm run build:release` |

---

## 10. Privacy & LocalStorage

TriType Arena operates on a strict **local-first privacy policy**:

- **No Active Network Uploads**: All keystrokes, WPM metrics, error rates, and historical logs are calculated and stored locally in browser `localStorage`.
- **No User Accounts**: No registration, no login, and no passwords required.
- **Storage Keys**:
  - `tritype.best.v2`: Best challenge scores per mode.
  - `tritype.difficulty.v1`: Active difficulty preference (`beginner` by default).
  - `tritype.learning.v1`: Up to 200 challenge and review sessions (FIFO).
  - `tritype.weakkeys.v1.${mode}`: Per-key attempt and error stats for `en`, `pinyin`, and `zhuyin`.
  - `tritype.onboarding.v1.completed`: Set to `yes` after the guide is dismissed.
  - `tritype.ui.locale`: Selected UI language (`en`, `zh-TW`, or `zh-CN`).
  - `tritype.adaptive.v1`: Adaptive-session records. The current UI does not start adaptive sessions. Clear History still removes this key.
- **Clear History**: The dashboard button is labeled **Clear History**. After confirmation it removes learning history, adaptive records, and weak-key stats. It does not clear best scores, difficulty, UI language, or the onboarding flag. Clearing the site's data in the browser removes those as well.
- **Hosting Infrastructure Logs**: Standard HTTP requests to Vercel CDN naturally record standard web server connection logs (IP address, User-Agent) necessary for static asset delivery and DDoS mitigation.

---

## 11. Licensing, Dependencies & Vocabulary Provenance Governance

TriType Arena strictly delineates three distinct legal and governance tiers:

1. **Application Source Code License**:
   - The application client source code is released under the permissive [MIT License](LICENSE).
2. **Third-Party Dependency Audit**:
   - Run `npm run audit:licenses` to check dependency licenses and `npm run audit:security` to scan for secrets, run `npm audit --omit=dev`, and run Gitleaks when installed. A missing Gitleaks binary warns and continues locally; when `CI=true`, it fails the audit. Against this lockfile, a full `npm audit` reports 6 moderate findings, all in the development toolchain (`minimatch` through `@typescript-eslint` / ESLint). `npm audit --omit=dev` reports no production findings. Counts change when the lockfile or advisory database changes, and both commands need registry access.
3. **Vocabulary sources and licensing**:
   - The Chinese vocabulary incorporates data from CC-CEDICT under CC BY-SA 4.0; the English vocabulary is based on Moby Words II, whose author stated a public-domain grant. See [third-party notices](public/notices/index.html) and [source records](docs/vocabulary/).
   - The owner accepts release of the current documented dataset. Source records are not a legal guarantee; Chinese readings have not received complete human review, and Zhuyin is mechanically transcribed from pinyin rather than verified Taiwanese usage.
   - The original vocabulary remains in Git history. Publish a clean snapshot without that history until its sources are reviewed.

---

## 12. Deployment & Known Limitations

- **Deployment**: The production site is [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/). This repository's `vercel.json` sets the Vercel build command to `npm run build:release` (provenance check, vocabulary release gate, then `npm run build`). A setting in the Vercel project dashboard can override that file. `npm run check` still ends with `npm run build`, not `build:release`.
- **Known Limitations**:
  - **Single Device / No Cloud Sync**: Because all progress is stored locally in `localStorage`, practice history does not sync across different browsers or devices.
  - **IME Candidate Selection vs. Key Mapping**: Traditional Zhuyin practice is designed to build physical keyboard muscle memory according to the Daqian layout. It simulates direct phonetic typing and intentionally does not emulate OS-level Chinese character candidate selection lists (選字清單).
  - **Mobile Soft Keyboards**: Mobile browser virtual keyboards handle composition and virtual keycodes differently from physical keyboards. A physical hardware keyboard is strongly recommended for Zhuyin Daqian practice.
