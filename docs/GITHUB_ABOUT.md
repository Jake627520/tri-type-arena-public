# TriType Arena — GitHub Repository Profile & About Specification

**Project:** TriType Arena  
**Version:** v0.3.0  
**Repository:** [https://github.com/Jake627520/tri-type-arena](https://github.com/Jake627520/tri-type-arena)  
**License:** MIT  
**Status:** Active Development  
**Repository Visibility:** Private (Owner-controlled)  

---

## 1. GitHub About — Description

### Recommended (English — Used for GitHub Repository About)
> A multilingual typing practice game for English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin. Built with React and TypeScript.

*Character count:* 147 characters (well within GitHub's 350-character limit).

### 繁體中文 (用於 README 與文件)
> 支援英文、簡體中文拼音及繁體中文注音（大千鍵盤）的多語言打字練習遊戲，使用 React 與 TypeScript 開發。

### 简体中文 (用于 README 与文件)
> 支持英语、简体中文拼音及繁体中文注音（大千键盘）的多语言打字练习游戏，基于 React 和 TypeScript 开发。

---

## 2. Website URL Policy

- **Current Status:** Not deployed.
- **GitHub About Website 欄位:** **暫時留空**，直到網站實際部署並通過驗收。
- **Proposed Website after Deployment:**  
  `https://tri-type-arena.vercel.app`
- **上線前檢驗條件:**
  此網址為預計使用的名稱，尚未確認是否可取得，不得在正式部署前標示為已上線。網站 URL 取得後，應經過 HTTPS、基本功能、行動裝置及三語介面驗證，才填入 GitHub About。

---

## 3. Recommended GitHub Topics (12 Topics)

```
typing-game typing-practice keyboard-training pinyin zhuyin bopomofo language-learning react typescript vite openspec tdd
```

### CLI Command to Apply Topics & Description:
```bash
gh repo edit Jake627520/tri-type-arena \
  --description "A multilingual typing practice game for English, Simplified Chinese Pinyin, and Traditional Chinese Zhuyin. Built with React and TypeScript." \
  --add-topic "typing-game,typing-practice,keyboard-training,pinyin,zhuyin,bopomofo,language-learning,react,typescript,vite,openspec,tdd"
```

---

## 4. Project Overview

TriType Arena is a browser-based typing practice game designed to help users improve typing speed, accuracy, and keyboard familiarity across English and Chinese input methods.

### Supported Typing Modes
- **English:** Standard English keyboard typing practice.
- **Simplified Chinese:** Hanyu Pinyin typing practice.
- **Traditional Chinese:** Zhuyin / Bopomofo practice using the Taiwan Daqian keyboard layout.

### User Interface Languages
- **Traditional Chinese — zh-TW**
- **Simplified Chinese — zh-CN**
- **English — en**

*Note:* The interface language can be selected independently of the typing practice mode.

---

## 5. Current Features — v0.3.0

- Three typing practice modes.
- Three user interface languages.
- First-time user onboarding.
- 30-, 60-, and 120-second challenges.
- Typing speed, accuracy, and score tracking.
- Typing error review.
- Keyboard navigation.
- Local browser preference storage.
- No account registration required.
- No backend database dependency for the current game.

*Non-goals (v0.3.0):* The current version does not provide online multiplayer, cloud synchronization, or user account authentication.

### Privacy & Data Policy (隱私與資料政策聲明)

- **繁體中文**:
  - **遊戲資料不主動上傳**：所有練習數據、統計與偏好僅留存在瀏覽器 `localStorage`，前端程式絕不主動上傳至外部伺服器。
  - **無帳號及雲端同步功能**：無須註冊或登入即可直接遊玩，目前版本無跨裝置雲端資料同步機制。
  - **部署主機必要存取日誌**：託管平台或 CDN（如 Vercel、GitHub Pages）傳輸靜態網頁資源時，可能記錄標準 HTTP 存取日誌（IP 位址、連線時間、User-Agent 等），此為網路傳輸與系統資安防護之必要技術日誌。
- **简体中文**:
  - **游戏数据不主动上传**：所有练习数据、统计与偏好仅保留在浏览器 `localStorage`，前端程序绝不主动上传至外部服务器。
  - **无账号及云端同步功能**：无需注册或登录即可直接体验，当前版本无跨设备云端数据同步机制。
  - **部署主机必要访问日志**：托管平台或 CDN（如 Vercel、GitHub Pages）分发静态网页资源时，可能记录标准 HTTP 访问日志（IP 地址、连接时间、User-Agent 等），此为网络传输与系统安全防护的必要技术日志。
- **English**:
  - **Game Data Stays Local**: Typing metrics and preferences are stored exclusively in local browser `localStorage` and never actively uploaded.
  - **No Accounts or Cloud Sync**: No registration or login required; no cloud synchronization features.
  - **Hosting Infrastructure Logs**: Hosting providers/CDNs (e.g. Vercel or GitHub Pages) inevitably record standard HTTP access logs (IP address, timestamp, headers) for static asset delivery and security defense.

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 |
| **Programming Language** | TypeScript (Strict) |
| **Build Tool** | Vite 6 |
| **Unit Testing** | Node.js Test Runner (60 tests) |
| **Component Testing** | Vitest 4 + React Testing Library (49 tests) |
| **Browser E2E** | Playwright (11 tests) |
| **Quality Validation** | ESLint, TypeScript, GitHub Actions |
| **Security** | npm audit (0 vulnerabilities), Gitleaks (0 leaks) |
| **Licensing** | MIT (Permissive only, SPDX AST validated) |
| **Specification** | OpenSpec / SDD / TDD |

---

## 7. Quality Baseline

Verified v0.3.0 local and remote release baseline:
- **Node tests:** 60 passed
- **Vitest tests:** 49 passed
- **Playwright tests:** 11 passed
- **Total:** 120 passed (0 failed, 100% pass rate)
- **Dependency audit:** 0 known vulnerabilities reported
- **Gitleaks:** 0 findings reported in entire Git history
- **Production build:** Passed

*Note:* These results represent the recorded release validation, not a guarantee that future versions will remain free from vulnerabilities.

---

## 8. Suggested Repository Configuration

- **Description:** Use the recommended English text.
- **Website:** Leave blank until deployment is verified.
- **Topics:** Use the 12 recommended topics.
- **Releases:** Enabled.
- **Issues:** Enabled for future feedback and bug reporting.
- **Discussions:** Optional, once community participation is needed.
- **License:** MIT.
- **Default branch:** `main`.
- **Repository Visibility:** Keep **Private** until the owner explicitly approves publication.

---

## 9. Roadmap

| Version | Planned Scope |
|---|---|
| **v0.3.0** | Multilingual interface and onboarding — Released |
| **v0.3.1** | Deployment readiness, documentation, UI polish |
| **v0.4.0** | Progressive lessons, learner history, weak-key review |
| **v0.5.0** | Optional user accounts and cloud progress |
| **v1.0.0** | Advanced game modes and potential multiplayer features |

*Disclaimer:* Roadmap entries are proposals and do not constitute committed delivery dates.
