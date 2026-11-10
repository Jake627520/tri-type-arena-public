# TriType Arena / 中英打字競技場

[English](README.md) | **繁體中文** | [简体中文](README.zh-CN.md)

版本：**0.4.1** — 基於 React 18 與 TypeScript 開發之純前端本地優先（Local-first）多語言打字訓練系統。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[測試](tests)
正式網站：[tri-type-arena.vercel.app](https://tri-type-arena.vercel.app/)。

---

## 1. 專案概述 (Project Overview)

**TriType Arena（中英打字競技場）** 是專為中文與多語言輸入法設計的現代瀏覽器原生打字練習工具。支援英文盲打、簡體中文漢語拼音及臺灣標準繁體中文注音（大千鍵盤佈局）。系統採用純前端本地優先（Local-first）架構，無後端依賴、免註冊登入、零個人隱私追蹤，提供極致流暢與超低延遲的鍵盤指法鍛鍊體驗。

- 正式網站為 [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/)，由 Vercel 從本儲存庫部署。
- **目標族群**：雙語開發者、打字愛好者、希望建立大千注音或英文標準指法盲打肌肉記憶的學習者。

---

## 2. 系統功能特色 (Features)

- **三語完整在地化介面 (UI i18n)**：完整支援繁體中文 (`zh-TW`)、簡體中文 (`zh-CN`) 與英文 (`en`)。導覽列選單會立即切換。若 `tritype.ui.locale` 已存 `en`、`zh-TW` 或 `zh-CN`，以該值為準；否則讀取 `navigator.language`（`zh-CN`、`zh-SG` 與 `zh-Hans*` → 簡體中文，其他 `zh*` → 繁體中文，其餘 → 英文）。
- **無障礙新手導覽**：三步驟對話框：選擇模式、設定時限與提示、開始輸入並查看準確率與速度。對話框會圈住 Tab 焦點、按 Escape 關閉、還原焦點，並可重新開啟。
- **時限挑戰模式**：30 秒衝刺、60 秒標準、120 秒耐力。
- **即時數值**：WPM、準確率（`correctKeys / totalKeys`）、完成詞數，以及進行中的當前連擊（畫面上標為 COMBO）。結算視窗另顯示最高連擊。
- **前 2 秒 WPM 平滑**：當 `elapsedSeconds < 2` 時，顯示的 WPM 從 2 秒基準往上爬升，避免除以接近 0 的經過時間。
- **防貼上**：任何剪貼簿貼上都會被拒絕（`PASTE_PROHIBITED`），包含單一字元。進度只來自逐鍵輸入。
- **鍵盤操作**：閒置時按 `Enter` 開始。進行中按 `Esc` 暫停。暫停時按 `Space` 或 `Enter` 繼續。進行中的 `Space` 是輸入字元（注音第一聲必須使用），不是繼續快捷鍵。
- **學習進度面板**：用純 SVG 繪製最近 20 筆紀錄的趨勢圖（無圖表套件），並提供弱鍵統計與複習入口。

---

## 3. 三大練習模式 (Three Typing Modes)

練習模式與介面語言相互獨立，可自由搭配：

1. **英文標準練習 (`en`)**
   - 500 個來自 Moby Words II 詞頻表的單字。分級依字長（2–4、5–6、7 個字母以上），不是片語，也不是程式設計詞彙。
   - 逐字比對，Backspace 刪除最後一個已輸入字元。

2. **簡體漢語拼音 (`pinyin`)**
   - 答案是不含聲調符號的漢語拼音，例如「早餐」輸入 `zaocan`（提示仍可顯示 `zǎo cān`）。
   - 每個按鍵會正規化：去掉聲調符號，並把 `ü` 對應為 `v`。

3. **繁體注音 · 臺灣標準大千鍵盤 (`zhuyin`)**
   - 大千實體鍵位：`5`、`j`、`/` 與 Space 分別對應 `ㄓ`、`ㄨ`、`ㄥ` 與第一聲空白。
   - 具備即時虛擬大千鍵盤，動態高亮當前預期敲擊之實體按鍵。
   - 專注建立實體鍵位至注音符號之盲打肌肉記憶，不開啟作業系統選字清單。

---

## 4. 難度等級與題庫分級 (Difficulty Levels)

TriType Arena 內建 1,100 筆精選題庫，劃分為三種難度等級：

| 難度等級 | 英文題庫 (500 詞) | 拼音題庫 (300 詞) | 注音題庫 (300 詞) |
|---|---|---|---|
| **初級 (Beginner)** | 200 詞，2–4 個字母 | 120 筆日常生活詞 | 120 筆，由拼音詞表轉寫 |
| **中級 (Intermediate)** | 200 詞，5–6 個字母 | 120 筆日常生活詞 | 120 筆，由拼音詞表轉寫 |
| **高級 (Advanced)** | 100 詞，7 個字母以上 | 60 筆日常生活詞 | 60 筆，由拼音詞表轉寫 |

- 英文分級是 Moby Words II 的打字字長，不是語言能力等級。題庫只有一般單字。
- 拼音與注音共用同一份日常生活詞表。120 / 120 / 60 是名額分配，不是另一套已評定的難度量表。注音由拼音讀音機械轉寫。
- **隨機抽取**：`ShuffleBag` 使用 Fisher-Yates。當題池超過 1 筆時，第 $N$ 輪末題不會成為第 $N+1$ 輪首題。可注入種子以得到固定順序。一般挑戰介面不會設定種子，因此使用 `Math.random`。

---

## 5. 注音第一聲空白鍵規則 (Zhuyin First-Tone Space Rule, v0.4.1)

在標準臺灣大千式注音鍵盤中，**第一聲（陰平）**並無實體調號鍵。TriType Arena 嚴格遵循真實打字規則：

- **第一聲必須按空白鍵**：輸入第一聲音節時，使用者**必須按下實體 Space 鍵 (`' '`)** 以完成該音節（例如「中午」之「中」：`5` (ㄓ) + `j` (ㄨ) + `/` (ㄥ) + `Space`）。
- **非第一聲調號**：二聲 `6` (ˊ)、三聲 `3` (ˇ)、四聲 `4` (ˋ)、輕聲 `7` (˙)。這些音節的答案不含 Space。多按的 Space 會被當成已輸入字元並計為錯誤。
- **計分與按鍵納入**：第一聲的 Space 鍵敲擊視為合法有效按鍵，完全計入 `totalKeys`、`correctKeys`、WPM 計算及弱鍵統計分析。
- **視覺引導**：當預期按鍵為第一聲空白鍵時，虛擬大千鍵盤空白鍵 (`#daqian-space-key`) 自動觸發 `.key-active` 高亮，且目標字元序列顯示開口方塊符號 `␣` (`target-char-space`)。

---

## 6. 學習歷程與弱鍵複習 (Learning History & Weak-Key Review)

TriType Arena 內建完整的本機離線學習分析模組：

- **歷程留存**：完成的挑戰與複習都會寫入 `localStorage` 的 `tritype.learning.v1`（最多 200 筆，FIFO）。趨勢圖與面板平均值使用其中最近 20 筆。
- **弱鍵判定**：按鍵依模式累積於 `tritype.weakkeys.v1.${mode}`。嘗試次數 $\ge 10$ 且錯誤率 $\ge 20\%$ 才標成確認弱鍵。
- **弱鍵複習**：依目前模式與難度，從確認弱鍵組出最多 10 題。沒有確認弱鍵，或沒有對應題目時，複習不會開始。
- **最高分隔離**：複習場次標記為 `sessionType: 'review'`。只有 `sessionType: 'challenge'` 會更新最高分 (`tritype.best.v2`)。複習成績仍會寫入學習歷程。

---

## 7. 快速開始 (Getting Started)

### 環境需求
- Node.js 22.x
- npm >= 10.0.0

### 本地安裝與啟動
```bash
# 複製儲存庫
git clone https://github.com/Jake627520/tri-type-arena-public.git
cd tri-type-arena-public

# 安裝乾淨相依套件
npm ci

# 啟動 Vite 開發伺服器。
# vite.config.ts 把 server.port 設為 4174，server.host 設為 true（監聽所有介面）。
# 未設定 strictPort，4174 被占用時會改用下一個可用連接埠。
npm run dev
# 開啟 Vite 印出的網址。4174 可用時為 http://localhost:4174/
```

### 生產建置與預覽
```bash
# 先用 tsc 做型別檢查，再把生產套件寫入 dist/
npm run build

# 用 Vite preview 提供 dist/。
# 未設定 preview.port，因此使用 Vite 6 的預設連接埠 4173。
# 未設定 preview.host，因此沿用 server.host（所有介面）。
npm run preview
# 開啟 Vite 印出的網址。4173 可用時為 http://localhost:4173/

# 先做來源驗證與題庫發行閘門，再執行同一個生產建置。
# vercel.json 把這條指令設為 Vercel 建置指令。
npm run build:release
```

---

## 8. 測試指令與品質驗證 (Running Tests)

執行以下自動化檢查：

```bash
# 本機品質閘門，順序為：typecheck、lint、npm test、test:vitest、
# validate:provenance、audit:licenses、audit:security、npm run build。
# 不執行 Playwright，也不執行 build:release。
npm run check
```

### 個別測試指令
- **Node.js 單元與合規測試**：`npm test` 執行 `node --test tests/*.test.mjs`（此樹狀目錄為 66 項測試）。
- **Vitest 元件與領域測試**：`npm run test:vitest`（`tests/domain` 與 `tests/components` 共 318 項測試）。
- **Playwright**（`tests/e2e`，每個瀏覽器專案 20 項測試）。設定只有 Chromium 與 WebKit，沒有 Firefox 專案。
  - 先安裝瀏覽器：`npx playwright install chromium` 或 `npx playwright install webkit`。在 Linux 上，WebKit 還需要 `npx playwright install-deps webkit` 安裝的系統函式庫（此步驟需要安裝權限）。`npx playwright install --with-deps <browser>` 會一次做完。CI 以 `--with-deps` 安裝 Chromium。
  - 每條指令都會自行啟動 `npm run dev`，且連接埠 4174 必須空著（`reuseExistingServer: false`）。`baseURL` 為 `http://localhost:4174`。
  - Chromium（20 項）：`npm run test:e2e`
  - WebKit（20 項）：`npm run test:e2e:webkit`
  - 兩個專案（40 項）：`npm run test:e2e:all`
- **靜態檢查**：
  - TypeScript：`npm run typecheck`（`tsc --noEmit`）
  - ESLint：`npm run lint`（`eslint src`）
- **安全與授權**：
  - 授權稽核：`npm run audit:licenses` 依專案允許清單檢查 lockfile 授權，並再跑一次 `tests/license-audit.test.mjs`。
  - 安全稽核：`npm run audit:security` 掃描 git 歷史與已追蹤檔案中的密鑰，執行 `npm audit --omit=dev`（只查正式環境相依套件），並在已安裝時執行 Gitleaks。本機缺少 Gitleaks 時會警告並繼續；`CI=true` 時缺少該程式會使稽核失敗。
  - 來源驗證：`npm run validate:provenance` 依來源登記檢查 1,100 筆題庫。

---

## 9. 系統架構與技術選型 (Architecture & Technology Stack)

```
tri-type-arena-public/
├── index.html                  # 瀏覽器進入點 → src/app/main.tsx
├── src/
│   ├── app/                    # 應用程式殼層 (main.tsx, App.tsx, styles.css)
│   ├── domain/                 # 打字規則與題庫。弱鍵輔助也會讀取 localStorage。
│   │   ├── vocabulary/         # 1,100 筆題庫 (en, pinyin, zhuyin)
│   │   ├── learning/           # 歷程、弱鍵、複習產生器，以及適應練習輔助
│   │   │                       # （介面不會啟動適應練習）
│   │   ├── shuffle-bag.ts      # Fisher-Yates，並避免循環邊界重複
│   │   ├── typing-answer.ts    # 拼音/注音答案與第一聲 Space
│   │   ├── session.ts          # 打字狀態機
│   │   ├── metrics.ts          # WPM、準確率與得分
│   │   ├── zhuyin-map.ts       # 大千鍵位與輸入正規化
│   │   └── prng.ts             # 可選的種子隨機數
│   ├── features/
│   │   ├── typing/             # TypingArena、難度選擇、useTypingSession
│   │   ├── lessons/            # 模式與 30/60/120 秒時限
│   │   ├── keyboard/           # DaqianKeyboard
│   │   ├── learning/           # LearningDashboard、TrendChart
│   │   ├── stats/              # LiveStats
│   │   ├── results/            # ResultModal
│   │   └── onboarding/         # 新手導覽
│   ├── i18n/                   # 文案與 useLocale (core.ts, useLocale.ts)
│   └── shared/                 # localStorage 與版本
├── tests/
│   ├── *.test.mjs              # Node 測試執行器 (`npm test`)
│   ├── domain/                 # Vitest 領域測試
│   ├── components/             # Vitest 元件測試
│   └── e2e/                    # Playwright（Chromium 與 WebKit）
├── scripts/                    # 來源、授權與安全稽核
├── docs/                       # 規格、架構與題庫紀錄
├── public/notices/             # 第三方聲明
├── openspec/                   # 規格驅動變更提案
├── vite.config.ts              # 開發連接埠 4174；預覽使用 Vite 預設 4173
└── vercel.json                 # buildCommand: npm run build:release
```

Node 測試另會載入 `src/engine.mjs`、`src/app.mjs` 與 `src/legacy-lessons.mjs`。這些檔案不是瀏覽器進入點。

| 架構層級 | 技術選型 |
|---|---|
| **前端框架** | React 18.3.1 |
| **開發語言** | TypeScript 5.9.3（嚴格模式）。`package.json` 允許 `^5.6.3`；lockfile 解析為 5.9.3 |
| **建置工具** | Vite 6.4.5。開發伺服器連接埠 4174；預覽連接埠 4173 |
| **單元測試** | Node.js 測試執行器 + Vitest 4.1.12 |
| **元件測試** | React Testing Library + jsdom（經由 Vitest） |
| **E2E 測試** | Playwright 1.64（只有 Chromium 與 WebKit 專案） |
| **程式碼規範** | ESLint 9.39 |
| **靜態部署** | Vercel 靜態託管。儲存庫中的建置指令：`npm run build:release` |

---

## 10. 隱私政策與本地儲存 (Privacy & LocalStorage)

TriType Arena 貫徹嚴格的**純前端本地優先隱私政策**：

- **資料絕不主動外傳**：所有按鍵紀錄、打字速度 (WPM)、錯誤率及練習歷史僅於使用者本機瀏覽器（`localStorage`）運算與留存，前端程式絕不主動將任何練習數據上傳至外部伺服器。
- **無帳號系統**：無需註冊、無須登入即可隨開即練。
- **本地儲存鍵值**：
  - `tritype.best.v2`：各模式挑戰最高分。
  - `tritype.difficulty.v1`：難度偏好（預設 `beginner`）。
  - `tritype.learning.v1`：最多 200 筆挑戰與複習（FIFO）。
  - `tritype.weakkeys.v1.${mode}`：`en`、`pinyin`、`zhuyin` 各自的按鍵嘗試與錯誤次數。
  - `tritype.onboarding.v1.completed`：關閉導覽後寫入 `yes`。
  - `tritype.ui.locale`：介面語言（`en`、`zh-TW` 或 `zh-CN`）。
  - `tritype.adaptive.v1`：適應練習紀錄。目前介面不會啟動適應練習。清除紀錄仍會移除此鍵。
- **清除紀錄**：面板按鈕文字是「清除學習紀錄」。確認後會移除學習歷程、適應練習紀錄與弱鍵統計，不會清除最高分、難度、介面語言或導覽完成旗標。在瀏覽器清除此網站資料才會一併移除那些項目。
- **託管主機必要存取日誌**：網站託管於 Vercel CDN 平台，伺服器在傳輸靜態資源時依網際網路標準協定仍可能記錄基礎連線日誌（如 IP 位址、連線時間、User-Agent 等），此為網路基礎設施正常運作與防禦資安攻擊之技術常態。

---

## 11. 軟體授權、相依套件與題庫來源發行治理 (Licensing, Dependencies & Governance)

本專案明確劃分並嚴格遵守三層法律與治理架構：

1. **應用程式原始碼授權**：
   - 應用程式前端原始碼採用寬鬆友善之 [MIT License](LICENSE) 開源授權條款發布。
2. **第三方相依套件審計**：
   - 使用 `npm run audit:licenses` 檢查相依套件授權，並以 `npm run audit:security` 掃描密鑰、執行 `npm audit --omit=dev`，以及在已安裝時執行 Gitleaks。本機缺少 Gitleaks 時會警告並繼續；`CI=true` 時缺少該程式會使稽核失敗。對照此 lockfile，完整 `npm audit` 回報 6 項中度問題，全部在開發工具鏈（`minimatch`，經由 `@typescript-eslint` / ESLint）。`npm audit --omit=dev` 的正式環境相依套件沒有發現。數字會隨 lockfile 或 advisory 資料庫改變，而且兩條指令都需要連線至 registry。
3. **詞庫來源與授權**：
   - 中文詞庫採用 CC-CEDICT 資料，依 CC BY-SA 4.0 聲明；英文詞庫來自作者聲明為公有領域的 Moby Words II。詳見[第三方聲明](public/notices/index.html)及[來源紀錄](docs/vocabulary/)。
   - 擁有者同意依已記錄授權發布現行資料。來源紀錄並非法律保證；中文讀音尚未完成全面人工審查，注音由拼音機械轉寫，未確認符合臺灣慣用讀音。
   - 原始詞庫仍在 Git 歷史；來源審查前請使用不含舊歷史的乾淨快照公開。

---

## 12. 部署狀態與已知限制 (Deployment & Known Limitations)

- **部署**：正式網站為 [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/)。本儲存庫的 `vercel.json` 把 Vercel 建置指令設為 `npm run build:release`（來源驗證、題庫發行閘門，然後 `npm run build`）。Vercel 專案後台的設定可以覆寫這個檔案。`npm run check` 的最後一步仍是 `npm run build`，不是 `build:release`。
- **已知限制**：
  - **單機本機儲存 · 無雲端同步**：練習紀錄皆存於當前瀏覽器之 `localStorage`，無法跨裝置或跨不同瀏覽器自動同步進度。
  - **鍵位練習 vs. 作業系統 IME 選字**：注音模式專注於訓練實體按鍵對應大千注音符號之盲打肌肉記憶，模擬直接輸入拼音/注音字元，刻意不模擬作業系統層級之中文選字清單。
  - **行動裝置虛擬鍵盤限制**：行動裝置虛擬鍵盤之 IME 組字與按鍵事件處理機制與實體鍵盤差異甚大，強烈建議使用實體鍵盤進行大千注音指法練習以獲取最佳體驗。
