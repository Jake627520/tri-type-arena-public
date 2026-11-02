import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertVocabularyReleaseAllowed } from '../scripts/check-vocabulary-release.mjs';

const header = 'batch_id,mode,entry_id_pattern,rights_status,release_decision';
const cleared = [
  'en,en,en-*,VERIFIED,CLEARED_FOR_PUBLIC_RELEASE',
  'pi,pinyin,pi-*,ORIGINAL,CLEARED_FOR_PUBLIC_RELEASE',
  'zh,zhuyin,zh-*,VERIFIED,CLEARED_FOR_PUBLIC_RELEASE',
];

test('current vocabulary register is cleared for release', () => {
  assert.doesNotThrow(() => assertVocabularyReleaseAllowed(readFileSync(new URL('../docs/VOCABULARY_SOURCE_REGISTER.csv', import.meta.url), 'utf8')));
});

test('release gate accepts only three explicitly cleared batches', () => {
  const csv = (rows) => [header, ...rows].join('\n');
  assert.doesNotThrow(() => assertVocabularyReleaseAllowed(csv(cleared)));
  assert.throws(() => assertVocabularyReleaseAllowed(csv(cleared.slice(0, 2))));
  assert.throws(() => assertVocabularyReleaseAllowed(csv([cleared[0], cleared[0], cleared[2]])));
  assert.throws(() => assertVocabularyReleaseAllowed(csv([cleared[0].replace('VERIFIED', 'NEEDS_REVIEW'), ...cleared.slice(1)])));
  assert.throws(() => assertVocabularyReleaseAllowed(csv([cleared[0].replace('CLEARED_FOR_PUBLIC_RELEASE', 'BLOCKED_FROM_RELEASE'), ...cleared.slice(1)])));
});

test('release build rejects cleared records without license evidence', async () => {
  const { mkdtempSync, cpSync, readFileSync: read, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { spawnSync } = await import('node:child_process');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const temp = mkdtempSync(join(tmpdir(), 'vocabulary-release-test-'));
  try {
    for (const name of ['docs', 'src', 'scripts']) cpSync(join(root, name), join(temp, name), { recursive: true });
    cpSync(join(root, 'package.json'), join(temp, 'package.json'));
    const register = join(temp, 'docs/VOCABULARY_SOURCE_REGISTER.csv');
    const contents = read(register, 'utf8').replace('https://www.gutenberg.org/files/3201/3201-h/3201-h.htm,VERIFIED', 'N/A,VERIFIED');
    assert.notEqual(contents, read(register, 'utf8'));
    writeFileSync(register, contents);
    const result = spawnSync('npm', ['run', 'build:release'], { cwd: temp, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /PROV-004 FAIL/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
