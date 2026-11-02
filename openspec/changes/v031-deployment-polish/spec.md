# Specification: v0.3.1 Deployment Readiness & Repository Polish

## 1. Repository Metadata Specifications (`docs/GITHUB_ABOUT.md`)
- **Description:** 
  - English: `A multilingual typing practice game for English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin. Built with React and TypeScript.` (147 chars, within 350-character limit).
  - 繁體中文: `支援英文、簡體中文拼音及繁體中文注音（大千鍵盤）的多語言打字練習遊戲，使用 React 與 TypeScript 開發。`
  - 简体中文: `支持英语、简体中文拼音及繁体中文注音（大千键盘）的多语言打字练习游戏，基于 React 和 TypeScript 开发。`
- **Website Policy:** Status is **Not deployed**. The GitHub About website field remains blank until deployed and verified. Proposed URL is `https://tri-type-arena.vercel.app`.
- **Topics (12):** `typing-game`, `typing-practice`, `keyboard-training`, `pinyin`, `zhuyin`, `bopomofo`, `language-learning`, `react`, `typescript`, `vite`, `openspec`, `tdd`.
- **Repository Configuration:** Private by default, Issues enabled, Releases enabled, MIT license.

## 2. Deployment Architecture (`docs/DEPLOYMENT_PLAN.md`)
- **Initial Recommended Platform:** **Vercel** (preferred for native Vite auto-detection and preview deployment workflow).
- **Alternative Supported Platform:** GitHub Pages (supported subject to repository visibility and plan).
- **Invariants:**
  - Frontend-only: Zero backend database, zero auth servers, zero cloud sync in current version.
  - Deployment approval is strictly decoupled from repository visibility approval.
  - No production deployment without explicit repository owner approval.
- **Vercel Settings:**
  - Build command: `npm run build`
  - Output directory: `dist`
  - Node version: Node 22
- **Deployment Smoke Tests (10 checks):**
  1. HTTP 200 return code.
  2. JS and CSS assets load cleanly.
  3. App renders successfully.
  4. English UI loads.
  5. Simplified Chinese UI loads.
  6. Traditional Chinese UI loads.
  7. Onboarding opens on first visit.
  8. Onboarding guide can be dismissed.
  9. Typing can start without account.
  10. Zero browser console errors.

## 3. README Specifications (`README.md`)
- **Header:** Explicitly declare Version **0.3.0** with trilingual descriptions.
- **Website Status & Non-goals:** Document not deployed status and absence of backend/cloud sync.
- **Section: Privacy & Data Policy (Trilingual):** Clearly distinguish:
  - Game data stays local (`localStorage`) and is not actively uploaded.
  - Zero user account requirement and no cloud synchronization.
  - Hosting infrastructure (Vercel, GitHub Pages) standard HTTP access logs for static delivery and security defense.
  - Consistent presentation across 繁體中文, 简体中文, and English.
- **Section: Typing Modes:** English, Simplified Chinese Hanyu Pinyin, Traditional Chinese Zhuyin (Daqian layout).
- **Section: How to Run Locally:** Step-by-step instructions for `npm ci`, `npm run dev`, `npm run check`, `npm run build`, and `npm run preview`.
- **Section: Current Status & Roadmap (5 stages):**
  - v0.3.0: Multilingual interface and onboarding — Released
  - v0.3.1: Deployment readiness, documentation, UI polish
  - v0.4.0: Progressive lessons, learner history, weak-key review
  - v0.5.0: Optional user accounts and cloud progress
  - v1.0.0: Advanced game modes and potential multiplayer features

## 4. Verification & Quality Gates
- `npm run check` passes with 0 lint, typecheck, unit, vitest, license, and security audit errors.
- `npm run test:e2e` passes 11/11 Playwright browser tests.
- Vite build produces valid bundle in `dist/` with relative asset links (`base: './'`).
