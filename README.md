# TriType Arena

**English** | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md)

Version: **0.4.1** — Local-first multilingual typing trainer built with React 18 and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[Tests](tests)
Deployment status: unverified.

---

## 1. Project Overview

**TriType Arena** is a browser-native typing trainer designed specifically for multilingual typing instruction across English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin (Taiwan standard Daqian layout). Built on a pure local-first architecture, it runs entirely in the browser with zero backend requirements, zero account registration, and zero telemetry tracking, offering an ultra-low latency, privacy-preserving typing workout.

- A previous deployment URL is [tri-type-arena.vercel.app](https://tri-type-arena.vercel.app); its current status is unverified.
- **Target Audience**: Typists, bilingual developers, and learners seeking to build keyboard muscle memory across Latin and Chinese phonetic input systems.

---

## 2. Features

- **Trilingual User Interface (UI i18n)**: Full localization across Traditional Chinese (`zh-TW`), Simplified Chinese (`zh-CN`), and English (`en`), with automatic browser language detection and instant switching.
- **Accessible Onboarding**: 3-step modal guide covering mode selection, timer adjustments, and controls with focus trapping and keyboard shortcuts.
- **Timed Challenges**: 30s sprint, 60s standard, and 120s endurance practice rounds.
- **Real-Time Telemetry**: Real-time Words Per Minute (WPM), net accuracy percentage, word completion count, and combo streak counters.
- **Initial Dampening**: Smoothed WPM calculation during the first 2 seconds to eliminate extreme division spikes.
- **Anti-Cheat Protection**: Enforces individual physical keystrokes and rejects multi-character clipboard paste injections.
- **Accessibility & Keyboard Navigation**: `Enter` to start, `Esc` to pause, and `Space` to resume. Full gameplay is navigable via physical keyboard.
- **Learning Dashboard**: Visualizes practice trends using pure SVG charts (no external charting dependencies), summarizes stats, and catalogs weak keys.

---

## 3. Three Typing Modes

The application supports three distinct input systems, completely decoupled from the UI interface language:

1. **English Standard Typing (`en`)**
   - High-frequency daily vocabulary, phrases, and modern programming terminology.
   - Character-by-character real-time validation with precise backspace error correction.

2. **Simplified Chinese Hanyu Pinyin (`pinyin`)**
   - Hanyu Pinyin phonetic input sequences (e.g. `nihao` → `你好`).
   - Normalizes tone marks and tests direct Latin-to-Pinyin keystroke speed.

3. **Traditional Chinese Zhuyin / Bopomofo (`zhuyin`)**
   - Physical keyboard mapping based on the standard Taiwan **Daqian layout** (e.g. `5 j / Space` for `ㄓㄨㄥ`).
   - Real-time Daqian visual keyboard displaying dynamic active-key highlights.
   - Dedicated focus on physical key-to-phonetic symbol muscle memory.

---

## 4. Difficulty Levels

TriType Arena provides three distinct difficulty tiers backed by a curated 1,100-entry vocabulary catalog:

| Difficulty | English (500 words) | Pinyin (300 words) | Zhuyin (300 words) | Description |
|---|---|---|---|---|
| **Beginner** | 200 entries | 120 entries | 120 entries | High-frequency daily vocabulary and simple syllables |
| **Intermediate** | 200 entries | 120 entries | 120 entries | Compound words, extended syllables, and combined keys |
| **Advanced** | 100 entries | 60 entries | 60 entries | Specialized technical terms, idioms, and complex phrasing |

- **Selection Engine**: Uses a seeded `ShuffleBag` algorithm with Fisher-Yates randomization and boundary deduplication (the last item of cycle $N$ will never repeat as the first item of cycle $N+1$).

---

## 5. Zhuyin First-Tone Space Rule (v0.4.1)

In Taiwanese Daqian keyboard practice, the **first tone (陰平)** has no physical tone mark key on standard keyboards. Following authentic typing rules:

- **Mandatory Space Keystroke**: Users **must press the physical Space key (`' '`)** to complete first-tone syllables (e.g. `ㄓㄨㄥ` + `Space` for `中`).
- **Tones 2, 3, 4, and Neutral**: Must be entered using their designated tone keys: `6` (ˊ), `3` (ˇ), `4` (ˋ), and `7` (˙). Extra spacebars on non-first tones are rejected as errors.
- **Scoring & Metrics**: The physical Space key in first-tone syllables is treated as a valid keystroke, counted toward `totalKeys`, `correctKeys`, WPM, and error rate analytics.
- **Visual Guidance**: When a first-tone Space is expected, the virtual keyboard spacebar (`#daqian-space-key`) activates `.key-active`, and the target character renders with an open box glyph `␣` (`target-char-space`).

---

## 6. Learning History & Weak-Key Review

TriType Arena includes an offline learning analytics engine:

- **Session Retention**: Automatically records completed challenge sessions in `localStorage` under `tritype.learning.v1` (retains the latest 200 sessions with FIFO pruning).
- **Weak-Key Qualification**: Evaluates keystrokes per mode in `tritype.weakkeys.v1.${mode}`. Keys with $\ge 10$ attempts and an error rate $\ge 20\%$ are flagged as confirmed weak keys.
- **Review Mode**: Generates a targeted 10-lesson practice sequence synthesized from the user's weak keys.
- **Challenge Best Score Isolation**: Review sessions are tagged as `sessionType: 'review'`, preventing drill scores from altering challenge Best Scores (`tritype.best.v2`).

---

## 7. Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/Jake627520/tri-type-arena.git
cd tri-type-arena

# Install clean dependencies
npm ci

# Start Vite development server (configured on port 4174 in vite.config.ts)
npm run dev
# Open http://localhost:4174
```

### Production Build & Preview
```bash
# Typecheck and build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 8. Running Tests

Run the automated checks below:

```bash
# Run full quality gate (typecheck, lint, Node and Vitest suites, license audit, security audit, build)
npm run check
```

### Individual Test Commands
- **Node.js Unit & Compliance Suite**: `npm test`
- **Vitest Component & Domain Suite**: `npm run test:vitest`
- **Playwright End-to-End Browser Tests**:
  - Chromium: `npm run test:e2e`
  - WebKit (Safari): `npm run test:e2e:webkit`
  - All Browsers: `npm run test:e2e:all`
- **Static Analysis**:
  - TypeScript: `npm run typecheck`
  - ESLint: `npm run lint`
- **Security & Licensing**:
  - License Audit: `npm run audit:licenses` (checks dependency licenses against project rules)
  - Security audit: `npm run audit:security` runs npm audit and, when installed, Gitleaks. Locally, a missing Gitleaks binary is skipped with a warning; CI requires it.
  - Provenance Validation: `npm run validate:provenance` (checks dataset integrity)

---

## 9. Architecture & Technology Stack

```
tri-type-arena/
├── src/
│   ├── app/                    # Application assembly (App.tsx, styles.css)
│   ├── domain/                 # Pure domain logic (100% testable, zero React/DOM dependency)
│   │   ├── vocabulary/         # 1,100 curated entries across en, pinyin, zhuyin
│   │   ├── learning/           # History store, weak-key analytics, review generator
│   │   ├── shuffle-bag.ts      # Seeded Fisher-Yates with boundary deduplication
│   │   ├── typing-answer.ts    # Runtime phonetic answer & first-tone Space derivations
│   │   └── session.ts          # Core typing state machine
│   ├── features/               # React UI components
│   │   ├── typing/             # TypingArena, DifficultySelector, useTypingSession
│   │   ├── keyboard/           # DaqianKeyboard virtual keyboard
│   │   ├── learning/           # LearningDashboard, TrendChart
│   │   ├── stats/              # LiveStats
│   │   ├── results/            # ResultModal
│   │   └── onboarding/         # Onboarding dialog
│   ├── i18n/                   # Multilingual translation dictionary (core.ts, useLocale.ts)
│   └── shared/                 # Storage wrappers and version constants
├── docs/                       # Specifications, architecture, and compliance governance
├── openspec/                   # Spec-Driven Development (SDD) change proposals
└── tests/                      # Automated test suites
```

| Layer | Technology Choice |
|---|---|
| **Frontend Framework** | React 18.3 |
| **Language** | TypeScript 5.6 (Strict Mode) |
| **Build Tool** | Vite 6.4 (Port 4174) |
| **Unit Testing** | Node.js Test Runner + Vitest 4.1 |
| **Component Testing** | React Testing Library + jsdom |
| **E2E Testing** | Playwright (Chromium & WebKit) |
| **Code Style** | ESLint 9 |
| **Deployment** | Vercel Static Hosting |

---

## 10. Privacy & LocalStorage

TriType Arena operates on a strict **local-first privacy policy**:

- **No Active Network Uploads**: All keystrokes, WPM metrics, error rates, and historical logs are calculated and stored locally in browser `localStorage`.
- **No User Accounts**: No registration, no login, and no passwords required.
- **Storage Keys**:
  - `tritype.best.v2`: Best challenge scores per mode.
  - `tritype.difficulty.v1`: Active difficulty preference.
  - `tritype.learning.v1`: 200-session FIFO practice history.
  - `tritype.weakkeys.v1.${mode}`: Accumulated per-key attempt and error stats.
  - `tritype.onboarding.v1.completed`: Onboarding guide completion flag.
  - `tritype.locale.v1`: Selected UI language.
- **Purge Anytime**: Users can reset all stored data via the "Clear Learning History" button or standard browser cache clearing.
- **Hosting Infrastructure Logs**: Standard HTTP requests to Vercel CDN naturally record standard web server connection logs (IP address, User-Agent) necessary for static asset delivery and DDoS mitigation.

---

## 11. Licensing, Dependencies & Vocabulary Provenance Governance

TriType Arena strictly delineates three distinct legal and governance tiers:

1. **Application Source Code License**:
   - The application client source code is released under the permissive [MIT License](LICENSE).
2. **Third-Party Dependency Audit**:
   - Run `npm run audit:licenses` to check dependency licenses and `npm run audit:security` to run npm audit and Gitleaks when installed; a missing Gitleaks binary is skipped locally with a warning but fails CI. The latest full npm audit reported 10 moderate findings in the development toolchain; production dependencies had no findings. Audit results change over time and require registry access.
3. **Vocabulary sources and licensing**:
   - The Chinese vocabulary incorporates data from CC-CEDICT under CC BY-SA 4.0; the English vocabulary is based on Moby Words II, whose author stated a public-domain grant. See [third-party notices](public/notices/index.html) and [source records](docs/vocabulary/).
   - The owner accepts release of the current documented dataset. Source records are not a legal guarantee; Chinese readings have not received complete human review, and Zhuyin is mechanically transcribed from pinyin rather than verified Taiwanese usage.
   - The original vocabulary remains in Git history. Publish a clean snapshot without that history until its sources are reviewed.

---

## 12. Deployment & Known Limitations

- **Deployment**: Vercel configuration is present; the current deployment and its build settings have not been verified.
- **Known Limitations**:
  - **Single Device / No Cloud Sync**: Because all progress is stored locally in `localStorage`, practice history does not sync across different browsers or devices.
  - **IME Candidate Selection vs. Key Mapping**: Traditional Zhuyin practice is designed to build physical keyboard muscle memory according to the Daqian layout. It simulates direct phonetic typing and intentionally does not emulate OS-level Chinese character candidate selection lists (選字清單).
  - **Mobile Soft Keyboards**: Mobile browser virtual keyboards handle composition and virtual keycodes differently from physical keyboards. A physical hardware keyboard is strongly recommended for Zhuyin Daqian practice.
