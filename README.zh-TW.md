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

- **三語完整在地化介面 (UI i18n)**：完整支援繁體中文 (`zh-TW`)、簡體中文 (`zh-CN`) 與英文 (`en`)，自動偵測瀏覽器偏好語系，可隨時在導覽列切換。
- **無障礙新手導覽 (Onboarding Guide)**：三步驟彈窗引導模式、時限與按鍵操作，具備鍵盤 Focus Trap、Escape 關閉、焦點還原與隨時重新開啟。
- **時限挑戰模式**：提供 30 秒衝刺、60 秒標準與 120 秒耐力練習。
- **即時數值運算**：即時計算打字速度 (WPM)、淨準確率百分比、完成詞數與連續連擊數 (Combo Streak)。
- **極短時間突波平滑抑制 (Initial Dampening)**：平滑前 2 秒的除算公式，消除因極短時間運算所造成的異常速度峰值。
- **防作弊貼上攔截 (Anti-Cheat Paste Rejection)**：嚴格攔截剪貼簿直接貼上，確保每一下敲擊皆來自真實鍵盤輸入。
- **鍵盤全流程支援 (Accessibility)**：支援 `Enter` 快速開局、`Esc` 暫停、`Space` 繼續挑戰，全流程無須依賴滑鼠。
- **學習進度面板 (Learning Dashboard)**：使用原生純 SVG 繪製進度趨勢圖表（無外部圖表相依套件），統計弱鍵分析與專項練習。

---

## 3. 三大練習模式 (Three Typing Modes)

練習模式與介面語言相互獨立，可自由搭配：

1. **英文標準練習 (`en`)**
   - 涵蓋高頻日常生活單字、片語及現代程式設計專用術語。
   - 逐字即時比對，支援精確 Backspace 退格修正。

2. **簡體漢語拼音 (`pinyin`)**
   - 漢語拼音字母流暢輸入（如 `nihao` → `你好`）。
   - 自動語音正規化，專注 Latin 鍵位至拼音音節的反應速度。

3. **繁體注音 · 臺灣標準大千鍵盤 (`zhuyin`)**
   - 實體鍵盤英文字鍵直接映射注音符號（如 `5 j / Space` 對應 `ㄓㄨㄥ`）。
   - 具備即時虛擬大千鍵盤，動態高亮當前預期敲擊之實體按鍵。
   - 專注建立實體鍵位至注音符號之盲打肌肉記憶。

---

## 4. 難度等級與題庫分級 (Difficulty Levels)

TriType Arena 內建 1,100 筆精選題庫，劃分為三種難度等級：

| 難度等級 | 英文題庫 (500 詞) | 拼音題庫 (300 詞) | 注音題庫 (300 詞) | 等級說明 |
|---|---|---|---|---|
| **初級 (Beginner)** | 200 詞 | 120 詞 | 120 詞 | 高頻日常詞彙與基礎音節 |
| **中級 (Intermediate)**| 200 詞 | 120 詞 | 120 詞 | 進階合成詞與組合鍵位 |
| **高級 (Advanced)** | 100 詞 | 60 詞 | 60 詞 | 專業技術詞彙、成語及長音節詞組 |

- **隨機抽取演算法**：採用具隨機數種子 (Seeded) 的 `ShuffleBag` 演算法與 Fisher-Yates 洗牌機制，保證循環邊界不重複（第 $N$ 輪末題絕不等於第 $N+1$ 輪首題）。

---

## 5. 注音第一聲空白鍵規則 (Zhuyin First-Tone Space Rule, v0.4.1)

在標準臺灣大千式注音鍵盤中，**第一聲（陰平）**並無實體調號鍵。TriType Arena 嚴格遵循真實打字規則：

- **第一聲必須按空白鍵**：輸入第一聲音節時，使用者**必須按下實體 Space 鍵 (`' '`)** 以完成該音節（例如「中午」之「中」：`5` (ㄓ) + `j` (ㄨ) + `/` (ㄥ) + `Space`）。
- **非第一聲調號**：二聲 `6` (ˊ)、三聲 `3` (ˇ)、四聲 `4` (ˋ)、輕聲 `7` (˙) 使用對應鍵輸入，輸入非第一聲調號後嚴禁多按空白鍵。
- **計分與按鍵納入**：第一聲的 Space 鍵敲擊視為合法有效按鍵，完全計入 `totalKeys`、`correctKeys`、WPM 計算及弱鍵統計分析。
- **視覺引導**：當預期按鍵為第一聲空白鍵時，虛擬大千鍵盤空白鍵 (`#daqian-space-key`) 自動觸發 `.key-active` 高亮，且目標字元序列顯示開口方塊符號 `␣` (`target-char-space`)。

---

## 6. 學習歷程與弱鍵複習 (Learning History & Weak-Key Review)

TriType Arena 內建完整的本機離線學習分析模組：

- **挑戰歷程留存**：每場完成的挑戰賽自動儲存於 `localStorage` 之 `tritype.learning.v1`（最多保存 200 場，採 FIFO 輪替淘汰）。
- **弱鍵判定標準**：依模式將按鍵資料累積於 `tritype.weakkeys.v1.${mode}`。凡嘗試次數 $\ge 10$ 次且錯誤率 $\ge 20\%$ 之按鍵，即標記為確認弱鍵。
- **弱鍵專項複習 (Review Mode)**：依據當前弱鍵清單動態合成 10 題專項練習。
- **最高分隔離保護**：複習模式標記為 `sessionType: 'review'`，練習成績絕不覆寫正規挑戰賽之本機最高得分 (`tritype.best.v2`)。

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

# 啟動 Vite 本機開發伺服器（依據 vite.config.ts 設定於連接埠 4174）
npm run dev
# 瀏覽器訪問 http://localhost:4174
```

### 生產建置與預覽
```bash
# 執行 TypeScript 型別檢查並編譯至 dist/
npm run build

# 本地預覽生產版本
npm run preview
```

---

## 8. 測試指令與品質驗證 (Running Tests)

執行以下自動化檢查：

```bash
# 執行完整品質閘門 (型別檢查、ESLint、Node 與 Vitest 測試、授權審計、安全掃描、生產建置)
npm run check
```

### 個別測試指令
- **Node.js 原生單元與合規測試**：`npm test`
- **Vitest 元件與領域整合測試**：`npm run test:vitest`
- **Playwright 端對端瀏覽器測試**：
  - Chromium：`npm run test:e2e`
  - WebKit (Safari)：`npm run test:e2e:webkit`
  - 跨瀏覽器完整測試：`npm run test:e2e:all`
- **靜態程式碼檢查**：
  - TypeScript 型別檢查：`npm run typecheck`
  - ESLint 靜態分析：`npm run lint`
- **安全與開源授權審計**：
  - 開源授權合規檢查：`npm run audit:licenses`（依專案規則檢查相依套件授權）
  - 安全稽核：`npm run audit:security` 執行 npm audit，並在已安裝時使用 Gitleaks；本機未安裝時會警告並跳過，CI 則要求安裝。
  - 題庫資料完整性檢查：`npm run validate:provenance`

---

## 9. 系統架構與技術選型 (Architecture & Technology Stack)

```
tri-type-arena/
├── src/
│   ├── app/                    # 應用程式裝配 (App.tsx, styles.css)
│   ├── domain/                 # 純領域邏輯 (100% 可單獨測試，無 React/DOM 依賴)
│   │   ├── vocabulary/         # 1,100 筆精選題庫 (en, pinyin, zhuyin)
│   │   ├── learning/           # 歷程儲存、弱鍵分析、複習產生器
│   │   ├── shuffle-bag.ts      # 種子隨機 Fisher-Yates 與邊界防重複演算法
│   │   ├── typing-answer.ts    # 執行階段拼音/注音答案與第一聲 Space 推導
│   │   └── session.ts          # 核心遊戲狀態機
│   ├── features/               # 功能元件層
│   │   ├── typing/             # 打字舞台、難度切換器、打字 Session Hook
│   │   ├── keyboard/           # 大千虛擬鍵盤 (DaqianKeyboard)
│   │   ├── learning/           # 學習進度面板與純 SVG 趨勢圖 (TrendChart)
│   │   ├── stats/              # 即時數據看板 (LiveStats)
│   │   ├── results/            # 結算視窗 (ResultModal)
│   │   └── onboarding/         # 新手導覽彈窗 (Onboarding)
│   ├── i18n/                   # 多語言字典與 Hook (core.ts, useLocale.ts)
│   └── shared/                 # LocalStorage 存取與版本設定
├── docs/                       # 系統架構規範與開源合規治理文件
├── openspec/                   # 規格驅動開發 (SDD) 變更提案目錄
└── tests/                      # 自動化測試套件
```

| 架構層級 | 技術選型 |
|---|---|
| **前端框架** | React 18.3 |
| **開發語言** | TypeScript 5.6 (嚴格模式 Strict Mode) |
| **建置工具** | Vite 6.4 (連接埠 4174) |
| **單元測試** | Node.js Test Runner + Vitest 4.1 |
| **元件測試** | React Testing Library + jsdom |
| **E2E 測試** | Playwright (Chromium & WebKit) |
| **程式碼規範** | ESLint 9 |
| **靜態部署** | Vercel Static Hosting |

---

## 10. 隱私政策與本地儲存 (Privacy & LocalStorage)

TriType Arena 貫徹嚴格的**純前端本地優先隱私政策**：

- **資料絕不主動外傳**：所有按鍵紀錄、打字速度 (WPM)、錯誤率及練習歷史僅於使用者本機瀏覽器（`localStorage`）運算與留存，前端程式絕不主動將任何練習數據上傳至外部伺服器。
- **無帳號系統**：無需註冊、無須登入即可隨開即練。
- **本地儲存鍵值清單**：
  - `tritype.best.v2`：各模式最高分紀錄。
  - `tritype.difficulty.v1`：當前選定之難度偏好。
  - `tritype.learning.v1`：200 筆練習歷程（採 FIFO 輪替淘汰）。
  - `tritype.weakkeys.v1.${mode}`：各模式累積之按鍵嘗試次數與錯誤次數。
  - `tritype.onboarding.v1.completed`：新手導覽完成狀態旗標。
  - `tritype.locale.v1`：介面語言設定。
- **隨時可手動清除**：使用者可透過學習進度面板中的「清除學習紀錄」按鈕或瀏覽器清除網站快取，隨時徹底清空本機資料。
- **託管主機必要存取日誌**：網站託管於 Vercel CDN 平台，伺服器在傳輸靜態資源時依網際網路標準協定仍可能記錄基礎連線日誌（如 IP 位址、連線時間、User-Agent 等），此為網路基礎設施正常運作與防禦資安攻擊之技術常態。

---

## 11. 軟體授權、相依套件與題庫來源發行治理 (Licensing, Dependencies & Governance)

本專案明確劃分並嚴格遵守三層法律與治理架構：

1. **應用程式原始碼授權**：
   - 應用程式前端原始碼採用寬鬆友善之 [MIT License](LICENSE) 開源授權條款發布。
2. **第三方相依套件審計**：
   - 使用 `npm run audit:licenses` 檢查相依套件授權，並以 `npm run audit:security` 執行 npm audit，並在已安裝時使用 Gitleaks；本機缺少 Gitleaks 時會警告並跳過，CI 則要求安裝。最近一次完整 npm audit 在開發工具鏈回報 10 項中度問題；正式環境相依套件未有發現。稽核結果會隨時間變動，且需要連線至 registry。
3. **詞庫來源與授權**：
   - 中文詞庫採用 CC-CEDICT 資料，依 CC BY-SA 4.0 聲明；英文詞庫來自作者聲明為公有領域的 Moby Words II。詳見[第三方聲明](public/notices/index.html)及[來源紀錄](docs/vocabulary/)。
   - 擁有者同意依已記錄授權發布現行資料。來源紀錄並非法律保證；中文讀音尚未完成全面人工審查，注音由拼音機械轉寫，未確認符合臺灣慣用讀音。
   - 原始詞庫仍在 Git 歷史；來源審查前請使用不含舊歷史的乾淨快照公開。

---

## 12. 部署狀態與已知限制 (Deployment & Known Limitations)

- **部署**：正式網站為 [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/)，由 Vercel 從本儲存庫部署。
- **已知限制**：
  - **單機本機儲存 · 無雲端同步**：練習紀錄皆存於當前瀏覽器之 `localStorage`，無法跨裝置或跨不同瀏覽器自動同步進度。
  - **鍵位練習 vs. 作業系統 IME 選字**：注音模式專注於訓練實體按鍵對應大千注音符號之盲打肌肉記憶，模擬直接輸入拼音/注音字元，刻意不模擬作業系統層級之中文選字清單。
  - **行動裝置虛擬鍵盤限制**：行動裝置虛擬鍵盤之 IME 組字與按鍵事件處理機制與實體鍵盤差異甚大，強烈建議使用實體鍵盤進行大千注音指法練習以獲取最佳體驗。
