# TriType Arena — Vocabulary Provenance, Quality Audit & License Attributions

- **Document Version:** 2.2
- **Application Target:** v0.4.0
- **Status:** CONDITIONAL — Structurally validated; original compilation provenance not fully reconstructed.
- **Historical Compatibility:** `NOT VERIFIABLE`
- **Development Merge Decision:** `CLEARED_FOR_DEV_MERGE` (Pending Repository Owner Approval)
- **Public Release Decision:** `CLEARED_FOR_PUBLIC_RELEASE` for current batches; historical data is not cleared.
- **Companion Documents:**
  - Batch Register: [`docs/VOCABULARY_SOURCE_REGISTER.csv`](./VOCABULARY_SOURCE_REGISTER.csv)
  - Sources Register: [`docs/vocabulary/SOURCES.md`](./vocabulary/SOURCES.md)
  - License Policy: [`docs/vocabulary/LICENSE_POLICY.md`](./vocabulary/LICENSE_POLICY.md)
  - Provenance Log: [`docs/vocabulary/PROVENANCE.md`](./vocabulary/PROVENANCE.md)
  - Review Checklist: [`docs/vocabulary/REVIEW_CHECKLIST.md`](./vocabulary/REVIEW_CHECKLIST.md)

---

## 1. Dataset Overview

TriType Arena V0.4.0 bundles 1,100 curated typing practice entries across three distinct input modes and three pedagogical difficulty tiers:

| Mode | Identifier Pattern | Beginner | Intermediate | Advanced | Total Entries |
|---|---|---|---|---|---|
| **English Vocabulary (`en`)** | `en-*` | 200 | 200 | 100 | **500** |
| **Simplified Chinese Pinyin (`pinyin`)** | `pi-*` | 120 | 120 | 60 | **300** |
| **Traditional Chinese Zhuyin (`zhuyin`)** | `zh-*` | 120 | 120 | 60 | **300** |
| **Total** | — | **440** | **440** | **220** | **1,100** |

All entries are strictly partitioned by difficulty to support structured tactile typing learning without introducing backend services, remote downloads, or account requirements.

---

## 2. Dataset Creation Methodology

The 1,100 vocabulary entries in TriType Arena are organized as hardcoded JavaScript arrays within `src/domain/vocabulary/{en,pinyin,zhuyin}.ts`.

1. **Word Selection**:
   - The current English batch is generated from [Moby Words II](./vocabulary/MOBY_ENGLISH.md), with tiers based on word length; the following source uncertainty applies to the initial dataset; the current Chinese candidates are documented in [CHINESE_CANDIDATES.md](./vocabulary/CHINESE_CANDIDATES.md).
   - Items represent standard everyday objects, conversational terms, greetings, cardinal numbers, colors, common actions, and foundational technical concepts.
   - The initial vocabulary selection process and sources are unknown. The repository owner reports that another AI temporarily collected that initial vocabulary.
2. **Database Ingestion Not Verified**:
   - For the initial vocabulary, the available record cannot establish whether external datasets were scraped, mirrored, or ingested.
   - The current vocabulary entries contain words and phonetic mappings rather than dictionary definitions, examples, audio, or images.
3. **Phonetic Transcriptions**:
   - Candidate Pinyin readings come from CC-CEDICT and are transformed for keyboard input; human pronunciation review is pending.
   - Candidate Zhuyin readings are mechanically transcribed from CC-CEDICT pinyin and transformed for the Daqian layout; Taiwanese usage and human pronunciation review are pending.

---

## 3. Copyright & Linguistic Facts

To establish clear legal boundaries and avoid overbroad claims, the project recognizes the following established copyright and open-source principles:

1. **Linguistic Facts Are Not Copyrightable**:
   - Individual words of natural languages, common phrases, standard phonetic readings (Pinyin syllables and Zhuyin symbols), and standard spellings are objective linguistic facts. Under international and regional copyright jurisprudence (e.g., U.S. Copyright Act 17 U.S.C. § 102(b), Taiwan Copyright Act Article 9), objective facts, raw ideas, and individual vocabulary items are not subject to individual copyright protection.
   - The application does not require individual copyright licenses merely to display common vocabulary words or their standard pronunciation keys.
2. **Third-Party Compilations, Definitions, and Creative Content**:
   - Substantial third-party creative databases, annotated dictionaries, curated example sentences, and original literary works possess copyright protection (or compilation copyright).
   - In particular, regarding Taiwanese Ministry of Education dictionaries:
     > CC BY-ND 3.0 TW permits commercial redistribution of unadapted licensed material, subject to the license conditions including attribution, but does not permit distribution of adapted material under that license. ND is not a NonCommercial restriction.
     >
     > The CC BY-ND 3.0 TW terms described above do not establish a license for this dataset. Whether and how official dictionaries were used in its creation is unknown.
3. **Refined Legal Position**:
   - TriType Arena contains only individual words and standard phonetic mappings.
   - The project does **NOT** make blanket claims that the entire vocabulary dataset is "Public Domain", "CC0", or "MIT Compatible".
   - The project does **NOT** assert complete legal immunity or guarantee absence of disputed selections.
   - Source limitation:
     > The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.

---

## 4. Source Evidence

The following references were documented for linguistic checks; the initial data sources and the extent of their use remain unknown:

| Category | Reference Authority | Canonical Reference URL | License / Legal Status | Project Utilization |
|---|---|---|---|---|
| **English Lexicon** | Public Lexicographical Standards | [https://en.wiktionary.org/](https://en.wiktionary.org/) | Reference terms require separate verification | Actual use in initial compilation unknown. |
| **Standard Pinyin (ISO 7098)** | National Language Commission / ISO | [https://www.iso.org/standard/66524.html](https://www.iso.org/standard/66524.html) | International Standard | Actual use in initial compilation unknown. |
| **Taiwan Mandarin Pronunciations** | Ministry of Education, Taiwan (ROC) | [https://dict.revised.moe.edu.tw/](https://dict.revised.moe.edu.tw/) | Reference terms require separate verification | Actual use in initial compilation unknown. |
| **Bilingual Technical Terminology** | National Academy for Educational Research (NAER) | [https://terms.naer.edu.tw/](https://terms.naer.edu.tw/) | Reference terms require separate verification | Actual use in initial compilation unknown. |

---

## 5. Automated Validation

Automated structural verification is enforced via `scripts/validate-vocabulary-provenance.mjs` and `tests/domain/provenance.test.ts` as part of `npm run check`. Every entry must pass:

1. **Unique and Traceable IDs (`PROV-001`)**: All 1,100 IDs are unique and strictly formatted (`en-moby-[beg|int|adv]-\d{3}`, `pi-cedict2-[beg|int|adv]-\d{3}`, `zh-cedict2-[beg|int|adv]-\d{3}`).
2. **Batch Mapping Integrity (`PROV-002`)**: The three batch records in `docs/VOCABULARY_SOURCE_REGISTER.csv` correspond exactly to the 500 EN, 300 Pinyin, and 300 Zhuyin items in source code.
3. **Valid Classification (`PROV-003`)**: Registered origin types and rights statuses adhere strictly to permitted enumeration values (`ORIGINAL`, `VERIFIED`, `NEEDS_REVIEW`, `REPLACE_REQUIRED`).
4. **License Evidence Contract (`PROV-004`)**: Any external source marked verified must contain source and license URLs and metadata; the automated check validates fields and URL format, not the authenticity of the sources.
5. **Quantity & Distribution Quotas (`PROV-005`)**: Exact tier counts (500 / 300 / 300) are enforced.
6. **Syntactic & Syllable Validation (`PROV-006`)**:
   - English: strictly lowercase alphabetic `[a-z]`.
   - Pinyin: lowercase ASCII syllables matching display character count.
   - Zhuyin: valid Bopomofo symbols with exact 1-to-1 character-to-syllable mapping.
   - *Automated formatting checks are explicitly distinguished from human linguistic and dialectal pronunciation review.*
7. **Session Compatibility & Historical Baseline Audit (`PROV-007`)**:
   - Runtime integration: All items integrate without runtime errors into `GameSession` and `ShuffleBag`, preserving internal structural consistency across all 1,100 IDs.
   - Historical compatibility verdict: `Historical Compatibility: NOT VERIFIABLE`.
   - Formal statement:
     > Current vocabulary IDs and data structures are internally consistent. No trustworthy prior-release baseline was available to prove that historical entries remain unchanged.
   - Prior release baseline check: Tag `v0.3.0` (Commit `6f2ea63`) and `main` baseline (Commit `727d045`) contained 48 un-indexed demo lessons (`src/domain/lessons.ts`) without an indexed vocabulary dataset.
8. **Document Consistency (`PROV-008`)**: Dataset totals, batch distributions, dual governance taxonomy, relative paths, and clearance statuses in markdown match the CSV register and `docs/vocabulary/` governance suite.

*Note: Automated tests validate technical data rules and integrity; they do not constitute legal proof of copyright clearance.*

---

## 6. Pronunciation Quality

The following corrections were documented during V0.4.0 development; complete independent linguistic review is not established:

1. **Pinyin Transliteration Audit**:
   - Corrected historical typos in compound pinyin answers (e.g. `lvse`, `fuza`, `zerendandang`, `dulisikao`, `jingyiqiujing`, `jiyinchongzu`).
   - Cleaned spacing and tone representation anomalies.
2. **Taiwanese Mandarin Readings Audit**:
   - Documented corrections to some Traditional Chinese readings (e.g., `微` `ㄨㄟˊ`, `權` `ㄑㄩㄢˊ`, `友誼` `ㄧㄡˇ ㄧˋ`).
3. **Advanced Technical Term Alignment**:
   - Verified that advanced technical terms (e.g., `人工智慧`, `量子力學`, `分散式系統`, `區塊鏈技術`) have complete character-to-syllable phonetic transcriptions.

---

## 7. Outstanding Limitations

The following limitations are explicitly recorded:

1. **Unreconstructed Initial Compilation Provenance**:
   - The full, granular generation history of the initial vocabulary lists cannot be completely reconstructed from existing repository commits or ephemeral scratch generator scripts.
   - The original Chinese batches had unknown origins and remain in Git history. Current Chinese candidates and English have documented sources; the owner accepts release of the current batches based on documented source statements; this is not a legal guarantee.
2. **Colloquial Light-Tone & Regional Variations**:
   - Certain Traditional Chinese colloquial words (e.g., `爸爸`, `媽媽`, `桌子`, `月亮`) feature slight differences between prescriptive dictionary readings and common conversational light-tone (輕聲) usage. These entries remain open for feedback from regional educators.
3. **No Claim of Blanket Certification**:
   - The initial source and selection remain unknown; the current English and Chinese sources are documented separately. No legal clearance is asserted for the dataset.

---

## 8. License Clearance Decision

- **Clearance Status**: **`CONDITIONAL`**
- **Decision Detail**:
  `CONDITIONAL — Structurally validated; original compilation provenance not fully reconstructed.`
- **Formal Definition**:
  > CONDITIONAL is a technical development-merge assessment, not a copyright license clearance. The repository owner may approve the merge for continued development after reviewing the documented risks and verifying that no public release or deployment is triggered.

  This historical definition predates the owner’s current release decision above.
- **Dual Governance Decisions**:
  - **Source Rights Status**: `VERIFIED` (source and published license statements documented; not legal certification).
  - **Development Merge Decision**: `CLEARED_FOR_DEV_MERGE` (pending Repository Owner approval).
  - **Public Release Decision**: `CLEARED_FOR_PUBLIC_RELEASE` for current batches. Old unknown-source data in Git history remains `BLOCKED_FROM_RELEASE` and outside this decision.
- **Private Main Branch Merge Policy**:
  - Merging PR #4 into the private repository's `main` branch does NOT constitute public release or deployment.
  - Historical policy: tests, provenance consistency, risk disclosure, and owner review were required. The historical unknown-source data is not included in the current release decision.
- **Public Release Gate**:
  - The owner accepts release of the current documented vocabulary under the applicable licenses; the legacy Git history requires separate handling. Automated checks do not certify legal rights or human pronunciation review.
