> 本文件保留先前的審查紀錄；下方混入事後對新詞庫的說明，不代表新來源已在 2026-10-27 審查。現行 Moby 與 CC-CEDICT 來源核查日期為 2026-11-02。現行詞庫依已記錄的來源與授權聲明獲擁有者同意發布；舊 Git 歷史不在此決策範圍。讀音與法律風險仍須如實評估。

# Vocabulary Review Checklist for PR #4

- **Target PR:** [PR #4: feat: TriType Arena V0.4.0 — typing learning system](https://github.com/Jake627520/tri-type-arena/pull/4)
- **Branch:** `feat/v0.4.0-typing-learning`
- **Audit Scope:** 1,100 Vocabulary Entries
- **Date:** 2026-10-27

---

## 1. 驗收條件檢查清單（Acceptance Criteria Checklist）

| 項目 | 驗收條件 | 檢查標準 | 查核結果 |
|---|---|---|---|
| **AC-1** | 不將公開資料直接標示為 Public Domain | 確認所有外部參考資料未擅自標註為 CC0 或 Public Domain（除非屬於古代公有文獻）。 | **PASS** |
| **AC-2** | 第三方資料確認實際授權條款 | 參考資料的實際使用情形與題庫授權未能確認。 | **NEEDS_REVIEW** |
| **AC-3** | 自行編寫內容明確標記來源類型 | 中文批次標記為 `UNVERIFIED_COMPILATION` / `pending_review`；英文改用 Moby 資料並保留來源證據。 | **PASS** |
| **AC-4** | 禁止未經審查大量資料直接匯入 | 初始來源及是否整批抓取尚未查明。 | **NEEDS_REVIEW** |
| **AC-5** | 來源與授權欄位建立自動化驗證測試 | 實作 PROV-001 至 PROV-008 自動化校驗腳本與 Vitest 測試套件。 | **PASS** |
| **AC-6** | OpenSpec 需求定義與 TDD 驗證 | OpenSpec 規格納入 PROV-001..008，經由 Vitest 與 Playwright 獨立驗證。 | **PASS** |
| **AC-7** | 提交 PR #4 前提供完整報告 | 提供來源清冊、授權審查、測試結果與未解決風險。 | **PASS** |

> The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.

---

## 2. 題庫資料中繼欄位清查（9 Metadata Fields）

| Metadata Field | 規範要求 | 實作狀態 |
|---|---|---|
| **Source ID** | 具備唯一批次或來源編號 | 包含 `SRC-BATCH-EN-001`, `SRC-BATCH-PI-001`, `SRC-BATCH-ZH-001` 等 |
| **Source URL / 編寫紀錄** | 提供有效 URL 或自行編寫說明 | 當時的現行候選來源已記錄；舊批次來源未知 |
| **Content Type** | 僅限 Word / Pronunciation | 全數僅包含 Word 與 Pronunciation，0 釋義，0 例句 |
| **License Type** | 註明客觀事實或確切授權名稱 | 記載客觀語言事實與參考規約 |
| **Attribution Requirement** | 標示是否需要署名 | 現行候選署名要求見來源文件，完整權利鏈待確認 |
| **Commercial Use Eligibility** | 標示商業使用限制 | 現有題庫的商業使用權待確認 |
| **Modification Permission** | 標示是否允許修改 | 現有題庫的修改權待確認 |
| **Verification Date** | 標註查驗日期 | 全數記錄查驗日期 (2026-10-27) |
| **Review Status** | 標記合規審查狀態 | 當時批次標記為 `NEEDS_REVIEW` |

---

## 3. 合併與發行決策矩陣（Merge & Release Decision Matrix）

| 維度 | 狀態評定 | 說明 |
|---|---|---|
| **Technical Validation** | **`PASS`** | TypeScript、Lint、Node Test、Vitest (143/143)、Playwright (Chromium/WebKit) 全數通過。 |
| **Historical Compatibility** | **`NOT VERIFIABLE`** | 前一版本（Tag `v0.3.0` / Commit `6f2ea63`）僅有 48 筆未標記 ID 之展示課程，無可信之既有 ID 基準檔可供逐筆比對。 |
| **Vocabulary Source Rights** | **`NEEDS_REVIEW`** | 初始完整生成來源鏈未完全還原，維持 NEEDS_REVIEW，不得自動升級為 VERIFIED。 |
| **Development Merge** | **`CLEARED_FOR_DEV_MERGE`** | 技術與治理文件完備，附條件准予進入 Repository Owner 人工審查以決定是否合併至私有開發主線。 |
| **Public Release** | **`BLOCKED_FROM_RELEASE`** | 公開發行前必須啟動獨立之發行審查，當時禁止對外公開發布或部署題庫。 |
| **Overall PR Status** | **`READY_FOR_OWNER_REVIEW`** | 待專案擁有者（Repository Owner）做最終合併決策。 |

---

## 4. 審查簽核（Sign-off）

- **Reviewer:** Antigravity AI Review Agent / Jake627520
- **Review Date:** 2026-10-27
- **Target Branch:** `feat/v0.4.0-typing-learning`
- **Target PR:** `#4`
- **Clearance Verdict:** **CONDITIONAL — Structurally validated; original compilation provenance not fully reconstructed.**
- **Statement:**
  > Current vocabulary IDs and data structures are internally consistent. No trustworthy prior-release baseline was available to prove that historical entries remain unchanged.
