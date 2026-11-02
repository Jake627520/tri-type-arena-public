import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadTsVocabulary(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Vocabulary file not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const entries = [];
  for (const line of lines) {
    const trimmed = line.trim().replace(/,$/, '');
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        entries.push(JSON.parse(trimmed));
      } catch (err) {
        throw new Error(`Failed to parse line in ${relativePath}: ${trimmed} - ${err.message}`);
      }
    }
  }
  return entries;
}

function parseCsv(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`CSV file not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error(`CSV has no data rows: ${fullPath}`);
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = [];
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
    const row = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

console.log('--- Validating Vocabulary Provenance & Data Integrity ---');

// Load datasets
const enEntries = loadTsVocabulary('src/domain/vocabulary/en.ts');
const piEntries = loadTsVocabulary('src/domain/vocabulary/pinyin.ts');
const zhEntries = loadTsVocabulary('src/domain/vocabulary/zhuyin.ts');
const allEntries = [...enEntries, ...piEntries, ...zhEntries];
const registerRows = parseCsv('docs/VOCABULARY_SOURCE_REGISTER.csv');
const provenanceMd = fs.readFileSync(path.join(rootDir, 'docs/VOCABULARY_PROVENANCE.md'), 'utf8');

// PROV-001: All vocabulary entries have valid, unique, and traceable IDs
const idPattern = /^(en-moby|pi-cedict2|zh-cedict2)-(beg|int|adv)-\d{3}$/;
const idSet = new Set();
for (const entry of allEntries) {
  if (!idPattern.test(entry.id)) {
    throw new Error(`[PROV-001 FAIL] Invalid ID format: ${entry.id}`);
  }
  if (idSet.has(entry.id)) {
    throw new Error(`[PROV-001 FAIL] Duplicate ID detected: ${entry.id}`);
  }
  idSet.add(entry.id);
}
if (allEntries.length !== 1100 || idSet.size !== 1100) {
  throw new Error(`[PROV-001 FAIL] Expected exactly 1100 unique entries, found ${idSet.size}`);
}
console.log('✔ PROV-001: 1,100 vocabulary entries possess valid, unique, and traceable IDs.');

// PROV-002: Source register batches correspond fully to 1,100 dataset entries
if (registerRows.length !== 3) {
  throw new Error(`[PROV-002 FAIL] Expected exactly 3 batch rows in register, found ${registerRows.length}`);
}
const batchEn = registerRows.find((r) => r.mode === 'en' && r.entry_id_pattern === 'en-*');
const batchPi = registerRows.find((r) => r.mode === 'pinyin' && r.entry_id_pattern === 'pi-*');
const batchZh = registerRows.find((r) => r.mode === 'zhuyin' && r.entry_id_pattern === 'zh-*');

if (!batchEn || Number(batchEn.entry_count) !== 500) {
  throw new Error('[PROV-002 FAIL] Batch en-* must exist with entry_count 500');
}
if (!batchPi || Number(batchPi.entry_count) !== 300) {
  throw new Error('[PROV-002 FAIL] Batch pi-* must exist with entry_count 300');
}
if (!batchZh || Number(batchZh.entry_count) !== 300) {
  throw new Error('[PROV-002 FAIL] Batch zh-* must exist with entry_count 300');
}
console.log('✔ PROV-002: Register batches correspond strictly to 1,100 dataset entries.');

// PROV-003: Allowed origin types, rights statuses, usage classifications, and release decisions
const allowedOriginTypes = new Set(['UNVERIFIED_COMPILATION', 'ORIGINAL_SELECTION', 'EXTERNAL_REFERENCE', 'COMMON_LEXICON']);
const allowedRightsStatuses = new Set(['NEEDS_REVIEW', 'ORIGINAL', 'VERIFIED', 'REPLACE_REQUIRED']);
const allowedUsageClassifications = new Set(['fact_check_only', 'licensed_content_reuse', 'pending_review']);
const allowedReleaseDecisions = new Set(['CLEARED_FOR_DEV_MERGE', 'BLOCKED_FROM_RELEASE', 'EXCLUDED_FROM_DATASET', 'CLEARED_FOR_PUBLIC_RELEASE']);

for (const row of registerRows) {
  if (!allowedOriginTypes.has(row.origin_type)) {
    throw new Error(`[PROV-003 FAIL] Invalid origin_type: ${row.origin_type} in batch ${row.batch_id}`);
  }
  if (!allowedRightsStatuses.has(row.rights_status)) {
    throw new Error(`[PROV-003 FAIL] Invalid rights_status: ${row.rights_status} in batch ${row.batch_id}`);
  }
  if (row.usage_classification && !allowedUsageClassifications.has(row.usage_classification)) {
    throw new Error(`[PROV-003 FAIL] Invalid usage_classification: ${row.usage_classification} in batch ${row.batch_id}`);
  }
  if (row.release_decision && !allowedReleaseDecisions.has(row.release_decision)) {
    throw new Error(`[PROV-003 FAIL] Invalid release_decision: ${row.release_decision} in batch ${row.batch_id}`);
  }
  if (row.release_decision === 'CLEARED_FOR_PUBLIC_RELEASE' && !['VERIFIED', 'ORIGINAL'].includes(row.rights_status)) {
    throw new Error(`[PROV-003 FAIL] Released batch ${row.batch_id} needs source evidence.`);
  }
}
console.log('✔ PROV-003: Provenance origin classification, rights status, usage classification, and release decision verified.');

// PROV-004: VERIFIED third-party content requires verifiable source and license evidence contract
for (const row of registerRows) {
  if (row.rights_status === 'VERIFIED' || row.usage_classification === 'licensed_content_reuse') {
    if (!row.source_name || row.source_name === 'N/A') {
      throw new Error(`[PROV-004 FAIL] VERIFIED/licensed_content_reuse source requires concrete source_name in batch ${row.batch_id}`);
    }
    if (!row.source_url || !row.source_url.startsWith('http')) {
      throw new Error(`[PROV-004 FAIL] VERIFIED/licensed_content_reuse source requires valid HTTP source_url in batch ${row.batch_id}`);
    }
    if (!row.license_spdx || row.license_spdx === 'NOASSERTION' || row.license_spdx === 'N/A') {
      throw new Error(`[PROV-004 FAIL] VERIFIED/licensed_content_reuse source requires concrete license_spdx in batch ${row.batch_id}`);
    }
    if (!row.license_evidence_url || !row.license_evidence_url.startsWith('http')) {
      throw new Error(`[PROV-004 FAIL] VERIFIED/licensed_content_reuse source requires valid license_evidence_url in batch ${row.batch_id}`);
    }
  }
}
console.log('✔ PROV-004: Evidence contract for VERIFIED/licensed_content_reuse content strictly enforced.');

// PROV-005: Dataset quotas and difficulty distribution maintained
const countDifficulty = (entries, diff) => entries.filter((e) => e.difficulty === diff).length;

if (enEntries.length !== 500 || countDifficulty(enEntries, 'beginner') !== 200 || countDifficulty(enEntries, 'intermediate') !== 200 || countDifficulty(enEntries, 'advanced') !== 100) {
  throw new Error('[PROV-005 FAIL] English dataset distribution mismatch (200/200/100).');
}
if (piEntries.length !== 300 || countDifficulty(piEntries, 'beginner') !== 120 || countDifficulty(piEntries, 'intermediate') !== 120 || countDifficulty(piEntries, 'advanced') !== 60) {
  throw new Error('[PROV-005 FAIL] Pinyin dataset distribution mismatch (120/120/60).');
}
if (zhEntries.length !== 300 || countDifficulty(zhEntries, 'beginner') !== 120 || countDifficulty(zhEntries, 'intermediate') !== 120 || countDifficulty(zhEntries, 'advanced') !== 60) {
  throw new Error('[PROV-005 FAIL] Zhuyin dataset distribution mismatch (120/120/60).');
}
console.log('✔ PROV-005: Dataset quotas (500 / 300 / 300) and difficulty distribution strictly maintained.');

// PROV-006: Structural format validation (distinct from human linguistic review)
for (const entry of allEntries) {
  if (!entry.display || !entry.answer) {
    throw new Error(`[PROV-006 FAIL] Missing display or answer in ${entry.id}`);
  }
  if (entry.mode === 'en') {
    if (!/^[a-z]+$/.test(entry.answer)) {
      throw new Error(`[PROV-006 FAIL] English answer must be lowercase letters: ${entry.id} (${entry.answer})`);
    }
  } else if (entry.mode === 'pinyin') {
    if (!/^[a-z]+$/.test(entry.answer)) {
      throw new Error(`[PROV-006 FAIL] Pinyin answer must be tone-free lowercase: ${entry.id} (${entry.answer})`);
    }
    if (entry.hint) {
      const syls = entry.hint.split(' ');
      if (syls.length !== entry.display.length) {
        throw new Error(`[PROV-006 FAIL] Pinyin syllable count mismatch: ${entry.id}`);
      }
    }
  } else if (entry.mode === 'zhuyin') {
    if (entry.hint) {
      const syls = entry.hint.split(' ');
      if (syls.length !== entry.display.length) {
        throw new Error(`[PROV-006 FAIL] Zhuyin syllable count mismatch: ${entry.id}`);
      }
    }
  }
}
console.log('✔ PROV-006: Structural format and syllable alignment verified (NOTE: Automated formatting checks are explicitly distinguished from human linguistic and dialectal pronunciation review).');

// PROV-007: Complete 1,100 ID snapshot regression check & historical compatibility audit
const pad3 = (n) => String(n).padStart(3, '0');
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
if (allEntries.length !== expectedIdSnapshot.length) {
  throw new Error(`[PROV-007 FAIL] Total entries (${allEntries.length}) does not match expected snapshot (${expectedIdSnapshot.length})`);
}
for (let i = 0; i < expectedIdSnapshot.length; i++) {
  if (allEntries[i].id !== expectedIdSnapshot[i]) {
    throw new Error(`[PROV-007 FAIL] ID snapshot regression mismatch at index ${i}: expected ${expectedIdSnapshot[i]}, got ${allEntries[i].id}`);
  }
}

// Verify that historical compatibility is truthfully marked NOT VERIFIABLE with mandatory statement
const mandatoryHistoricalStmt = 'Current vocabulary IDs and data structures are internally consistent. No trustworthy prior-release baseline was available to prove that historical entries remain unchanged.';
if (!provenanceMd.includes('Historical Compatibility: `NOT VERIFIABLE`') && !provenanceMd.includes('Historical Compatibility:** `NOT VERIFIABLE`')) {
  throw new Error('[PROV-007 FAIL] VOCABULARY_PROVENANCE.md must state Historical Compatibility: NOT VERIFIABLE');
}
if (!provenanceMd.includes(mandatoryHistoricalStmt)) {
  throw new Error('[PROV-007 FAIL] VOCABULARY_PROVENANCE.md missing mandatory historical statement: ' + mandatoryHistoricalStmt);
}
console.log('✔ PROV-007: Complete 1,100 ID internal consistency verified; Historical Compatibility truthfully documented as NOT VERIFIABLE (no fake PASS).');

// PROV-008: Documentation, CSV, and test results consistency check
const requiredSections = [
  '1. Dataset Overview',
  '2. Dataset Creation Methodology',
  '3. Copyright & Linguistic Facts',
  '4. Source Evidence',
  '5. Automated Validation',
  '6. Pronunciation Quality',
  '7. Outstanding Limitations',
  '8. License Clearance Decision',
];
for (const section of requiredSections) {
  if (!provenanceMd.includes(section)) {
    throw new Error(`[PROV-008 FAIL] Missing required section in VOCABULARY_PROVENANCE.md: ${section}`);
  }
}
if (!provenanceMd.includes('CONDITIONAL — Structurally validated; original compilation provenance not fully reconstructed.')) {
  throw new Error('[PROV-008 FAIL] Missing conditional status string in VOCABULARY_PROVENANCE.md');
}

// Assert CONDITIONAL definition
const mandatoryConditionalDef = 'CONDITIONAL is a technical development-merge assessment, not a copyright license clearance. The repository owner may approve the merge for continued development after reviewing the documented risks and verifying that no public release or deployment is triggered.';
if (!provenanceMd.includes(mandatoryConditionalDef)) {
  throw new Error('[PROV-008 FAIL] Missing mandatory CONDITIONAL definition in VOCABULARY_PROVENANCE.md');
}

// Assert CC BY-ND 3.0 TW wording
const mandatoryCcByNd = 'CC BY-ND 3.0 TW permits commercial redistribution of unadapted licensed material, subject to the license conditions including attribution, but does not permit distribution of adapted material under that license. ND is not a NonCommercial restriction.';
if (!provenanceMd.includes(mandatoryCcByNd)) {
  throw new Error('[PROV-008 FAIL] Missing mandatory CC BY-ND 3.0 TW text in VOCABULARY_PROVENANCE.md');
}

// Assert unknown-source statement
const mandatoryUnknownSourceStmt = 'The initial vocabulary sources and whether protected material was copied are unknown; rights and public release remain under review.';
if (!provenanceMd.includes(mandatoryUnknownSourceStmt)) {
  throw new Error('[PROV-008 FAIL] Missing mandatory unknown-source statement in VOCABULARY_PROVENANCE.md');
}

// Assert Dual Governance terms
if (!provenanceMd.includes('CLEARED_FOR_DEV_MERGE') || !provenanceMd.includes('BLOCKED_FROM_RELEASE')) {
  throw new Error('[PROV-008 FAIL] Missing dual governance terms CLEARED_FOR_DEV_MERGE or BLOCKED_FROM_RELEASE in VOCABULARY_PROVENANCE.md');
}

// Prohibit unsupported claims
const prohibitedClaims = ['zero copyright risk', '100% verified', 'Completely eliminate copyright liabilities'];
for (const claim of prohibitedClaims) {
  if (provenanceMd.includes(claim)) {
    throw new Error(`[PROV-008 FAIL] Prohibited claim found in VOCABULARY_PROVENANCE.md: ${claim}`);
  }
}

// Check required docs/vocabulary governance suite
const requiredVocabDocs = [
  'docs/vocabulary/SOURCES.md',
  'docs/vocabulary/LICENSE_POLICY.md',
  'docs/vocabulary/PROVENANCE.md',
  'docs/vocabulary/REVIEW_CHECKLIST.md',
];
for (const docFile of requiredVocabDocs) {
  const fullPath = path.join(rootDir, docFile);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`[PROV-008 FAIL] Missing required governance document: ${docFile}`);
  }
  const docContent = fs.readFileSync(fullPath, 'utf8');
  if (docContent.includes('file:///')) {
    throw new Error(`[PROV-008 FAIL] Prohibited local file:// URI detected in ${docFile}`);
  }
  for (const claim of prohibitedClaims) {
    if (docContent.includes(claim)) {
      throw new Error(`[PROV-008 FAIL] Prohibited claim "${claim}" found in ${docFile}`);
    }
  }
  if (!docContent.includes(mandatoryUnknownSourceStmt)) {
    throw new Error(`[PROV-008 FAIL] Missing mandatory unknown-source statement in ${docFile}`);
  }
}
if (provenanceMd.includes('file:///')) {
  throw new Error('[PROV-008 FAIL] Prohibited local file:// URI detected in VOCABULARY_PROVENANCE.md');
}

// Check that SOURCES.md includes all 9 required metadata fields and usage classifications
const sourcesMd = fs.readFileSync(path.join(rootDir, 'docs/vocabulary/SOURCES.md'), 'utf8');
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
  if (!sourcesMd.includes(field)) {
    throw new Error(`[PROV-008 FAIL] docs/vocabulary/SOURCES.md missing required field: ${field}`);
  }
}
if (!sourcesMd.includes('fact_check_only') || !sourcesMd.includes('pending_review')) {
  throw new Error('[PROV-008 FAIL] docs/vocabulary/SOURCES.md missing usage classifications');
}

// Check LICENSE_POLICY.md defines CLEARED_FOR_DEV_MERGE, BLOCKED_FROM_RELEASE, CC BY-ND 3.0 TW, and CONDITIONAL definition
const policyMd = fs.readFileSync(path.join(rootDir, 'docs/vocabulary/LICENSE_POLICY.md'), 'utf8');
if (!policyMd.includes('CLEARED_FOR_DEV_MERGE') || !policyMd.includes('BLOCKED_FROM_RELEASE')) {
  throw new Error('[PROV-008 FAIL] docs/vocabulary/LICENSE_POLICY.md missing CLEARED_FOR_DEV_MERGE/BLOCKED_FROM_RELEASE');
}
if (!policyMd.includes(mandatoryCcByNd)) {
  throw new Error('[PROV-008 FAIL] docs/vocabulary/LICENSE_POLICY.md missing CC BY-ND 3.0 TW definition');
}
if (!policyMd.includes(mandatoryConditionalDef)) {
  throw new Error('[PROV-008 FAIL] docs/vocabulary/LICENSE_POLICY.md missing CONDITIONAL definition');
}

console.log('✔ PROV-008: Markdown documentation, docs/vocabulary suite, dual governance, and CSV register strictly align.');

console.log('--- All Provenance (PROV-001..PROV-008) Validations PASSED ---');
