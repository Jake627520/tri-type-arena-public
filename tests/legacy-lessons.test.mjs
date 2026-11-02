import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('legacy engine lessons match the current candidate vocabulary', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/generate-legacy-lessons.mjs', import.meta.url)), '--check']);
});
