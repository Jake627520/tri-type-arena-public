# Vocabulary Copyright & License Policy

- **Target Version:** v0.4.0
- **Scope:** 1,100 Typing Practice Entries
- **Development Merge Decision:** `CLEARED_FOR_DEV_MERGE` (Pending Repository Owner Approval)
- **Public Release Decision:** `CLEARED_FOR_PUBLIC_RELEASE` for current batches; old Git history is not cleared.
- **Companion Documents:**
  - Sources Register: [`SOURCES.md`](./SOURCES.md)
  - Provenance Log: [`PROVENANCE.md`](./PROVENANCE.md)
  - Review Checklist: [`REVIEW_CHECKLIST.md`](./REVIEW_CHECKLIST.md)

---

## 1. 核心法律與著作權原則

TriType Arena 在收錄與編製練習題庫時，遵循嚴謹的智慧財產權與開放原始碼規範：

### 1.1 語言事實與個別資料的評估
- 單字、通用符號與讀音等語言事實，與他人創作的表達或資料選輯應分別評估；適用法律、具體內容及使用方式會影響權利判斷。
- 收錄字詞與讀音前，仍須考量來源的授權、契約條款及可能適用的資料庫權利；不得僅因內容可公開查詢就推定可自由使用。

### 1.2 第三方內容與資料編輯
- 辭典釋義、例句、錄音或資料選輯可能受著作權或其他權利保護；是否受保護取決於適用法律、原創性及具體事實，不能一概認定所有資料庫均受保護。
- **嚴格排除條款**：本專案題庫**完全排除任何釋義、例句、辭典註釋或音訊**。禁止未經授權將任何第三方辭典之說明文字或範例句子納入專案。
- **審查證據說明**：
  > The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.

---

## 2. 第三方資料授權評估準則

評估外部參考資料時，嚴格遵守下列驗收原則：

### 2.1 CC BY-ND 3.0 TW 授權精確條款界定
> CC BY-ND 3.0 TW permits commercial redistribution of unadapted licensed material, subject to the license conditions including attribution, but does not permit distribution of adapted material under that license. ND is not a NonCommercial restriction.
>
> The CC BY-ND 3.0 TW terms described above do not establish a license for this dataset. Whether and how official dictionaries were used in its creation is unknown.
>
> 官方參考連結：
> - [Creative Commons BY-ND 3.0 TW Deed](https://creativecommons.org/licenses/by-nd/3.0/tw/deed.en)
> - [Creative Commons BY-ND 3.0 TW Legal Code](https://creativecommons.org/licenses/by-nd/3.0/tw/legalcode)

- 嚴禁將 ND（NoDerivatives, 禁止改作）誤解為 NC（NonCommercial, 非商業性）。
- 初始題庫來源未能重建，無法確認是否複製或重製教育部辭典資料；現行候選題庫的來源記錄見 [CHINESE_CANDIDATES.md](./CHINESE_CANDIDATES.md) 與 [MOBY_ENGLISH.md](./MOBY_ENGLISH.md)，已記錄現行來源與授權聲明；該參考來源本身不是題庫授權證據。

### 2.2 「公開可查」不等於「公有領域（Public Domain）」
- 官方網站、辭典入口或學術網站可免費檢索之資料，並不代表可任意轉載、重製或再散布。嚴禁將未聲明公有領域之公開資料直接推定為 Public Domain 或 CC0。

### 2.3 禁止未經審查之大量匯入
- 禁止使用任何自動化腳本爬取未經版權審查之第三方詞表或商業打字軟體字庫。

---

## 3. 雙軌分類機制（Dual Governance Taxonomy）

本專案將「資料來源權利狀態」與「發行與合併決策」分開記錄，杜絕混淆：

### 3.1 資料來源權利狀態（Source Rights Status）
| 狀態 | 定義 |
|---|---|
| **`ORIGINAL`** | 有可信紀錄支持內容為自行創作或獨立選編。 |
| **`VERIFIED`** | 第三方內容有可核對的授權或使用依據。 |
| **`NEEDS_REVIEW`** | 來源或使用權利尚未充分確認。 |
| **`REPLACE_REQUIRED`** | 已確認存在不相容授權或必須移除的內容。 |

*現行三批的來源及公布的授權聲明已記錄為 `VERIFIED`；此狀態不代表法律保證或逐詞人工讀音審核。測試通過不會自動升級狀態。*

### 3.2 發行與合併決策（Release / Merge Decision）
| 決策 | 定義 |
|---|---|
| **`CLEARED_FOR_DEV_MERGE`** | 符合開發主線合併要求，但不代表公開發行授權完成。 |
| **`BLOCKED_FROM_RELEASE`** | 存在未解決的發行阻礙，不允許公開散布。 |
| **`EXCLUDED_FROM_DATASET`** | 有問題的資料已明確排除，且不會進入發布產物。 |
| **`CLEARED_FOR_PUBLIC_RELEASE`** | 公開發行要求已完成，並具有相應的核准證據。 |

*擁有者已同意依已記錄的適用授權發布現行三批。舊的未知來源資料及 Git 歷史不在此決策範圍，仍為 `BLOCKED_FROM_RELEASE`。*

---

## 4. 第三方來源使用方式分類（Source Usage Classification）

本專案採納嚴格的使用方式分類：
1. **`fact_check_only`**：僅用以核對個別單字拼法或標準讀音之客觀語言事實，無受保護實質內容之重製。
2. **`licensed_content_reuse`**：實際重製或引用第三方受授權內容。在此情況下，必須具備：
   - 明確的授權證據
   - 實際使用內容與範圍
   - Attribution Requirement（署名要求）
   - Commercial Use Eligibility（商業可用性）
   - Modification Permission（修改權利）
   - License Evidence URL（官方條款網址）
   - Review Date 與 Reviewer（審查日期與審查人員）
3. **`pending_review`**：使用方式或來源邊界尚未完成正式書面審定。

---

## 5. CONDITIONAL 與合併政策標準

### 5.1 CONDITIONAL 的正式定義
> **CONDITIONAL is a technical development-merge assessment, not a copyright license clearance. The repository owner may approve the merge for continued development after reviewing the documented risks and verifying that no public release or deployment is triggered.**

### 5.2 Private Main Branch 合併門檻
PR #4 進入 Owner Review 並核准合併進私有開發主線（`main`），必須符合：
1. TypeScript、ESLint、Vitest、Node Test、Playwright 全數通過。
2. 來源與版權文件完整一致。
3. 現有風險（包括未還原之初始生成鏈）已如實列明。
4. 未發現需要立即排除的具體受保護內容。
5. 不因 Merge 自動觸發公開部署、正式 Release 或對外發布題庫。
6. Repository Owner 明確審查與核准。

*合併進 Private Repository 的 main 分支，不應且不得被自動視為公開發行。*

### 5.3 Public Release Gate（公開發行門檻）
在執行公開部署、將 Repository 改為 Public、發布正式 Release 或對外提供完整題庫前，必須另行啟動公開發行審查：
- 所有來源均有足夠的使用權利依據，或已排除問題內容。
- `NEEDS_REVIEW` 批次完成實質人工審查。
- 不得以 Owner Risk Acceptance 取代法律授權。
- 具備正式之發行核准紀錄。
