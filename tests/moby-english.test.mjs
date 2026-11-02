import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('English lessons are reproducible from the pinned Moby source', () => {
  assert.match(execFileSync(process.execPath, ['scripts/generate-moby-english.mjs', '--check'], { encoding: 'utf8' }), /matches/);
  const source = readFileSync(new URL('../src/domain/vocabulary/en.ts', import.meta.url), 'utf8');
  const ids = [...source.matchAll(/"id":"([^"]+)"/g)].map((match) => match[1]);
  assert.match(source, /"display":"in"/); // The source entry has trailing whitespace.
  assert.equal(ids.length, 500);
  assert.equal(new Set(ids).size, 500);
  assert.ok(ids.every((id) => /^en-moby-(beg|int|adv)-\d{3}$/.test(id)));
});
