import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_VOCABULARY,
  ENGLISH_VOCABULARY,
  PINYIN_VOCABULARY,
  ZHUYIN_VOCABULARY,
  validateVocabularyEntry,
} from '../../src/domain/vocabulary';
import { createGameSession } from '../../src/domain/session';
import { ShuffleBag } from '../../src/domain/shuffle-bag';

interface BatchRow {
  batch_id: string;
  entry_id_pattern: string;
  mode: string;
  entry_count: string;
  origin_type: string;
  content_type: string;
  usage_method: string;
  source_name: string;
  source_url: string;
  source_version: string;
  license_spdx: string;
  license_evidence_url: string;
  rights_status: string;
  evidence_note: string;
  review_date: string;
}

function loadBatchRegister(): BatchRow[] {
  const csvPath = path.resolve(__dirname, '../../docs/VOCABULARY_SOURCE_REGISTER.csv');
  expect(fs.existsSync(csvPath), 'VOCABULARY_SOURCE_REGISTER.csv must exist').toBe(true);
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  const rows: BatchRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());

    const row: any = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

describe('PROV: Vocabulary Provenance & License Clearance (Task 3)', () => {
  const batches = loadBatchRegister();

  it('PROV-001: All vocabulary entries have valid, unique, and traceable IDs', () => {
    expect(ALL_VOCABULARY.length).toBe(1100);

    const idPattern = /^(en-moby|pi-cedict2|zh-cedict2)-(beg|int|adv)-\d{3}$/;
    const idSet = new Set<string>();
    for (const entry of ALL_VOCABULARY) {
      expect(entry.id).toBeTruthy();
      expect(idPattern.test(entry.id), `Invalid ID format: ${entry.id}`).toBe(true);
      expect(idSet.has(entry.id), `Duplicate ID in vocabulary: ${entry.id}`).toBe(false);
      idSet.add(entry.id);
    }
    expect(idSet.size).toBe(1100);
  });

  it('PROV-002: Batch register corresponds strictly to the 1,100 dataset entries', () => {
    expect(batches.length).toBe(3);

    const enBatch = batches.find((b) => b.mode === 'en' && b.entry_id_pattern === 'en-*');
    const piBatch = batches.find((b) => b.mode === 'pinyin' && b.entry_id_pattern === 'pi-*');
    const zhBatch = batches.find((b) => b.mode === 'zhuyin' && b.entry_id_pattern === 'zh-*');

    expect(enBatch).toBeDefined();
    expect(piBatch).toBeDefined();
    expect(zhBatch).toBeDefined();

    expect(Number(enBatch?.entry_count)).toBe(500);
    expect(Number(piBatch?.entry_count)).toBe(300);
    expect(Number(zhBatch?.entry_count)).toBe(300);

    const totalBatchCount = batches.reduce((sum, b) => sum + Number(b.entry_count), 0);
    expect(totalBatchCount).toBe(1100);
  });

  it('PROV-003: Provenance origin classification, rights_status, usage classification, and release decision use permitted values', () => {
    const allowedOriginTypes = new Set(['UNVERIFIED_COMPILATION', 'ORIGINAL_SELECTION', 'EXTERNAL_REFERENCE', 'COMMON_LEXICON']);
    const allowedRightsStatuses = new Set(['NEEDS_REVIEW', 'ORIGINAL', 'VERIFIED', 'REPLACE_REQUIRED']);
    const allowedUsageClassifications = new Set(['fact_check_only', 'licensed_content_reuse', 'pending_review']);
    const allowedReleaseDecisions = new Set(['CLEARED_FOR_DEV_MERGE', 'BLOCKED_FROM_RELEASE', 'EXCLUDED_FROM_DATASET', 'CLEARED_FOR_PUBLIC_RELEASE']);

    for (const batch of batches) {
      expect(allowedOriginTypes.has(batch.origin_type), `Invalid origin_type: ${batch.origin_type}`).toBe(true);
      expect(allowedRightsStatuses.has(batch.rights_status), `Invalid rights_status: ${batch.rights_status}`).toBe(true);
      if ((batch as any).usage_classification) {
        expect(allowedUsageClassifications.has((batch as any).usage_classification)).toBe(true);
      }
      if ((batch as any).release_decision) {
        expect(allowedReleaseDecisions.has((batch as any).release_decision)).toBe(true);
      }
      if ((batch as any).release_decision === 'CLEARED_FOR_PUBLIC_RELEASE') {
        expect(['VERIFIED', 'ORIGINAL']).toContain(batch.rights_status);
      }
    }
  });

  it('PROV-004: VERIFIED third-party content requires verifiable source and license evidence contract', () => {
    for (const batch of batches) {
      if (batch.rights_status === 'VERIFIED' || (batch as any).usage_classification === 'licensed_content_reuse') {
        expect(batch.source_name.length).toBeGreaterThan(0);
        expect(batch.source_name).not.toBe('N/A');
        expect(batch.source_url.startsWith('http')).toBe(true);
        expect(batch.license_spdx.length).toBeGreaterThan(0);
        expect(batch.license_spdx).not.toBe('NOASSERTION');
        expect(batch.license_evidence_url.startsWith('http')).toBe(true);
      }
    }
  });

  it('PROV-005: Dataset quotas and difficulty distributions are maintained', () => {
    expect(ENGLISH_VOCABULARY.length).toBe(500);
    expect(PINYIN_VOCABULARY.length).toBe(300);
    expect(ZHUYIN_VOCABULARY.length).toBe(300);

    const enBeg = ENGLISH_VOCABULARY.filter((e) => e.difficulty === 'beginner').length;
    const enInt = ENGLISH_VOCABULARY.filter((e) => e.difficulty === 'intermediate').length;
    const enAdv = ENGLISH_VOCABULARY.filter((e) => e.difficulty === 'advanced').length;
    expect(enBeg).toBe(200);
    expect(enInt).toBe(200);
    expect(enAdv).toBe(100);

    const piBeg = PINYIN_VOCABULARY.filter((e) => e.difficulty === 'beginner').length;
    const piInt = PINYIN_VOCABULARY.filter((e) => e.difficulty === 'intermediate').length;
    const piAdv = PINYIN_VOCABULARY.filter((e) => e.difficulty === 'advanced').length;
    expect(piBeg).toBe(120);
    expect(piInt).toBe(120);
    expect(piAdv).toBe(60);

    const zhBeg = ZHUYIN_VOCABULARY.filter((e) => e.difficulty === 'beginner').length;
    const zhInt = ZHUYIN_VOCABULARY.filter((e) => e.difficulty === 'intermediate').length;
    const zhAdv = ZHUYIN_VOCABULARY.filter((e) => e.difficulty === 'advanced').length;
    expect(zhBeg).toBe(120);
    expect(zhInt).toBe(120);
    expect(zhAdv).toBe(60);
  });

  it('PROV-006: Structural format and syllable alignment validated (automated format checks distinct from human linguistic review)', () => {
    for (const entry of ALL_VOCABULARY) {
      const res = validateVocabularyEntry(entry);
      expect(res.valid, `Entry ${entry.id} (${entry.display}) failed validation: ${res.error}`).toBe(true);

      if (entry.mode === 'en') {
        expect(/^[a-z]+$/.test(entry.answer), `English answer not lowercase letters: ${entry.id}`).toBe(true);
      } else if (entry.mode === 'pinyin') {
        expect(/^[a-z]+$/.test(entry.answer), `Pinyin answer not lowercase: ${entry.id}`).toBe(true);
        if (entry.hint) {
          const syllableCount = entry.hint.split(' ').length;
          expect(syllableCount, `Entry ${entry.id} (${entry.display}) hint count mismatch`).toBe(entry.display.length);
        }
      } else if (entry.mode === 'zhuyin') {
        if (entry.hint) {
          const syllableCount = entry.hint.split(' ').length;
          expect(syllableCount, `Entry ${entry.id} (${entry.display}) hint count mismatch`).toBe(entry.display.length);
        }
      }
    }
  });

  it('PROV-007: Complete 1,100 ID internal consistency verified and historical compatibility accurately marked NOT VERIFIABLE', () => {
    // 1. Snapshot regression across all 1,100 IDs
    const pad3 = (n: number) => String(n).padStart(3, '0');
    const expectedIdSnapshot = [
      ...Array.from({ length: 200 }, (_, i) => `en-moby-beg-${pad3(i + 1)}`),
      ...Array.from({ length: 200 }, (_, i) => `en-moby-int-${pad3(i + 1)}`),
      ...Array.from({ length: 100 }, (_, i) => `en-moby-adv-${pad3(i + 1)}`),
      ...Array.from({ length: 120 }, (_, i) => `pi-cedict2-beg-${pad3(i + 1)}`),
      ...Array.from({ length: 120 }, (_, i) => `pi-cedict2-int-${pad3(i + 1)}`),
      ...Array.from({ length: 60 }, (_, i) => `pi-cedict2-adv-${pad3(i + 1)}`),
      ...Array.from({ length: 120 }, (_, i) => `zh-cedict2-beg-${pad3(i + 1)}`),
      ...Array.from({ length: 120 }, (_, i) => `zh-cedict2-int-${pad3(i + 1)}`),
      ...Array.from({ length: 60 }, (_, i) => `zh-cedict2-adv-${pad3(i + 1)}`),
    ];
    expect(ALL_VOCABULARY.length).toBe(expectedIdSnapshot.length);
    for (let i = 0; i < expectedIdSnapshot.length; i++) {
      expect(ALL_VOCABULARY[i].id).toBe(expectedIdSnapshot[i]);
    }

    // 2. Compatibility with session engine
    for (const mode of ['en', 'pinyin', 'zhuyin'] as const) {
      for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
        const session = createGameSession({ mode, difficulty, duration: 30 });
        const state = session.getState();
        expect(state.mode).toBe(mode);
        expect(state.difficulty).toBe(difficulty);
        expect(state.currentLesson).toBeTruthy();
        expect(state.currentLesson?.display).toBeTruthy();
      }
    }

    const bag = new ShuffleBag(ALL_VOCABULARY);
    const sampled = bag.next();
    expect(sampled).toBeTruthy();

    // 3. Historical compatibility assertion in documentation
    const docPath = path.resolve(__dirname, '../../docs/VOCABULARY_PROVENANCE.md');
    const docContent = fs.readFileSync(docPath, 'utf8');
    expect(docContent).toContain('NOT VERIFIABLE');
    expect(docContent).toContain(
      'Current vocabulary IDs and data structures are internally consistent. No trustworthy prior-release baseline was available to prove that historical entries remain unchanged.'
    );
  });

  it('PROV-008: Markdown documentation matches batch counts, relative links, and conditional review conclusions', () => {
    const docPath = path.resolve(__dirname, '../../docs/VOCABULARY_PROVENANCE.md');
    expect(fs.existsSync(docPath), 'VOCABULARY_PROVENANCE.md must exist').toBe(true);
    const content = fs.readFileSync(docPath, 'utf8');

    expect(content).toContain('1. Dataset Overview');
    expect(content).toContain('2. Dataset Creation Methodology');
    expect(content).toContain('3. Copyright & Linguistic Facts');
    expect(content).toContain('4. Source Evidence');
    expect(content).toContain('5. Automated Validation');
    expect(content).toContain('6. Pronunciation Quality');
    expect(content).toContain('7. Outstanding Limitations');
    expect(content).toContain('8. License Clearance Decision');

    expect(content).toContain('CONDITIONAL — Structurally validated; original compilation provenance not fully reconstructed.');
    expect(content).toContain('NEEDS_REVIEW');
    expect(content).toContain('CLEARED_FOR_DEV_MERGE');
    expect(content).toContain('BLOCKED_FROM_RELEASE');

    const condDef =
      'CONDITIONAL is a technical development-merge assessment, not a copyright license clearance. The repository owner may approve the merge for continued development after reviewing the documented risks and verifying that no public release or deployment is triggered.';
    expect(content).toContain(condDef);

    const ccByNdText =
      'CC BY-ND 3.0 TW permits commercial redistribution of unadapted licensed material, subject to the license conditions including attribution, but does not permit distribution of adapted material under that license. ND is not a NonCommercial restriction.';
    expect(content).toContain(ccByNdText);

    const unknownSourceText =
      'The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.';
    expect(content).toContain(unknownSourceText);

    expect(content).not.toContain('Status: Audited & Verified');
    expect(content).not.toContain('License: Permissive MIT / Public Domain Compatible');
    expect(content).not.toContain('All vocabulary entries originate strictly from open, permissive, and educational sources');
    expect(content).not.toContain('zero copyright risk');
    expect(content).not.toContain('100% verified');
    expect(content).not.toContain('file:///');

    // Required docs/vocabulary governance suite
    const vocabDir = path.resolve(__dirname, '../../docs/vocabulary');
    const requiredDocs = ['SOURCES.md', 'LICENSE_POLICY.md', 'PROVENANCE.md', 'REVIEW_CHECKLIST.md'];
    for (const doc of requiredDocs) {
      const p = path.join(vocabDir, doc);
      expect(fs.existsSync(p), `Missing docs/vocabulary/${doc}`).toBe(true);
      const docText = fs.readFileSync(p, 'utf8');
      expect(docText.length).toBeGreaterThan(100);
      expect(docText).not.toContain('file:///');
      expect(docText).toContain(unknownSourceText);
    }

    // Check 9 metadata fields in SOURCES.md
    const sourcesContent = fs.readFileSync(path.join(vocabDir, 'SOURCES.md'), 'utf8');
    const requiredMetadataFields = [
      'Source ID',
      'Source URL 或自行編寫紀錄',
      'Content Type',
      'License Type',
      'Attribution Requirement',
      'Commercial Use Eligibility',
      'Modification Permission',
      'Verification Date',
      'Review Status',
    ];
    for (const field of requiredMetadataFields) {
      expect(sourcesContent).toContain(field);
    }

    // Check merge clearance policy in LICENSE_POLICY.md
    const policyContent = fs.readFileSync(path.join(vocabDir, 'LICENSE_POLICY.md'), 'utf8');
    expect(policyContent).toContain('CLEARED_FOR_DEV_MERGE');
    expect(policyContent).toContain('BLOCKED_FROM_RELEASE');
    expect(policyContent).toContain(ccByNdText);
    expect(policyContent).toContain(condDef);
  });
});
