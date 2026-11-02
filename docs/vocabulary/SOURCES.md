# Vocabulary Sources & Register

- **Target Version:** v0.4.0
- **Scope:** 1,100 Typing Practice Entries (500 English, 300 Simplified Pinyin, 300 Traditional Zhuyin)
- **Development Merge Decision:** `CLEARED_FOR_DEV_MERGE` (Pending Repository Owner Approval)
- **Public Release Decision:** `CLEARED_FOR_PUBLIC_RELEASE` for current batches; historical data is not cleared.
- **Policy Reference:** [`LICENSE_POLICY.md`](./LICENSE_POLICY.md)
- **Provenance Reference:** [`PROVENANCE.md`](./PROVENANCE.md)

---

## 1. Overview & Content Type Restriction

TriType Arena is an offline-first tactile typing game. To systematically control and minimize copyright liabilities, the application enforces a strict **Content Type Boundary**:

- **Permitted Content Types**:
  - `Word` (Common uncopyrightable lexical units)
  - `Pronunciation` (Standard objective phonetic spellings: Pinyin ASCII syllables and Daqian Zhuyin keycodes)
- **Strictly Prohibited Content Types**:
  - `Definition` (Creative dictionary explanations)
  - `Sentence` (Copyrighted example sentences or contextual literature)
  - `Audio` / `Image` (Proprietary media recordings)

Zero dictionary definitions or example sentences are stored or displayed in TriType Arena.

> The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.

---

## 2. Dataset Source Register (Dual Governance & Usage Classification)

The current English source is Moby; the Chinese candidates use the sources documented in [CHINESE_CANDIDATES.md](./CHINESE_CANDIDATES.md). Other references below are potential references only, and their actual use in the initial dataset is unknown. Terms and obligations require separate verification. `fact_check_only` is a classification defined in the policy, not a finding about these references.

| Source ID | Source URL 或自行編寫紀錄 | Content Type | Usage Classification | License Type | Attribution Requirement | Commercial Use Eligibility | Modification Permission | Verification Date | Review Status (Rights Status) | Release Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| **`SRC-BATCH-EN-001`** | [Moby Words II](./MOBY_ENGLISH.md) | Word | `licensed_content_reuse` | 作者聲明 public-domain grant；法域依授權聲明 | 記錄作者與來源 | 依授權聲明 | 依授權聲明 | 2026-11-02 | **VERIFIED** | **CLEARED_FOR_PUBLIC_RELEASE** |
| **`SRC-BATCH-PI-001`** | [獨立選詞與 CC-CEDICT](./CHINESE_CANDIDATES.md) | Word, Pronunciation | `licensed_content_reuse` | CC BY-SA 4.0 | 需署名 | 依授權允許 | 依授權允許 | 2026-11-02 | **VERIFIED** | **CLEARED_FOR_PUBLIC_RELEASE** |
| **`SRC-BATCH-ZH-001`** | [獨立選詞、CC-CEDICT 與拼音轉寫](./CHINESE_CANDIDATES.md) | Word, Pronunciation | `licensed_content_reuse` | CC BY-SA 4.0 + converter MIT | 需保留聲明 | 依授權允許 | 依授權允許 | 2026-11-02 | **VERIFIED** | **CLEARED_FOR_PUBLIC_RELEASE** |
| **`SRC-REF-ISO7098`** | [https://www.iso.org/standard/66524.html](https://www.iso.org/standard/66524.html) (ISO 7098:2015 中文羅馬字母拼寫法) | Pronunciation | `pending_review` | 參考條款待獨立核實；實際用途未知 | 待確認 | 待確認 | 待確認 | 未確認 | **NEEDS_REVIEW** | **BLOCKED_FROM_RELEASE** |
| **`SRC-REF-MOE-DICT`** | [https://dict.revised.moe.edu.tw/](https://dict.revised.moe.edu.tw/) (教育部重編國語辭典修訂本) | Pronunciation | `pending_review` | 參考條款待獨立核實；實際用途未知 | 待確認 | 待確認 | 待確認 | 未確認 | **NEEDS_REVIEW** | **BLOCKED_FROM_RELEASE** |
| **`SRC-REF-NAER-TERMS`** | [https://terms.naer.edu.tw/](https://terms.naer.edu.tw/) (國家教育研究院雙語詞彙資料庫) | Word | `pending_review` | 參考條款待獨立核實；實際用途未知 | 待確認 | 待確認 | 待確認 | 未確認 | **NEEDS_REVIEW** | **BLOCKED_FROM_RELEASE** |
| **`SRC-REF-WIKTIONARY`** | [https://en.wiktionary.org/](https://en.wiktionary.org/) (維基詞典) | Word | `pending_review` | 參考條款待獨立核實；實際用途未知 | 待確認 | 待確認 | 待確認 | 未確認 | **NEEDS_REVIEW** | **BLOCKED_FROM_RELEASE** |

---

## 3. 來源取得方式與資料版本說明

1. **英文練習詞庫 (`SRC-BATCH-EN-001`)**:
   - 筆數：500 筆（初級 200、中級 200、高級 100）。
   - 取得方式：使用 [Moby Words II](./MOBY_ENGLISH.md) 頻率資料去重並按字長分級，來源檔與重現腳本均保留。
   - 現行來源與其授權聲明已記錄，擁有者同意依適用條款發布；此不代表法律保證或已完成人工讀音審查。
2. **簡體拼音詞庫 (`SRC-BATCH-PI-001`)**:
   - 筆數：300 筆（初級 120、中級 120、高級 60）。
   - 取得方式：獨立種子選詞，並以固定版本來源比對讀音，詳見 [中文候選資料](./CHINESE_CANDIDATES.md)。
   - 現行來源與其授權聲明已記錄，擁有者同意依適用條款發布；此不代表法律保證或已完成人工讀音審查。
3. **繁體注音詞庫 (`SRC-BATCH-ZH-001`)**:
   - 筆數：300 筆（初級 120、中級 120、高級 60）。
   - 取得方式：獨立種子選詞，並以固定版本來源比對讀音，詳見 [中文候選資料](./CHINESE_CANDIDATES.md)。
   - 現行來源與其授權聲明已記錄，擁有者同意依適用條款發布；此不代表法律保證或已完成人工讀音審查。

---

## 4. 禁止未經審查大量資料匯入之防範措施

- 初始資料的取得方式未知，無法確認是否使用爬蟲或整批複製；新資料應記錄來源及審查狀態。
- 所有題庫資料儲存於靜態唯讀 TypeScript 陣列（`src/domain/vocabulary/*.ts`），並受版本控制與 CI 自動化測試監控。
