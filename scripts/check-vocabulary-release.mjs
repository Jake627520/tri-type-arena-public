import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Fail closed: this gate only accepts the current three dataset batches.
export function assertVocabularyReleaseAllowed(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length !== 4) throw new Error('Expected exactly three vocabulary batches.');
  const parse = (line) => {
    const fields = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (char === ',' && !quoted) { fields.push(field.trim()); field = ''; }
      else field += char;
    }
    if (quoted) throw new Error('Invalid CSV quoting.');
    fields.push(field.trim());
    return fields;
  };
  const headers = parse(lines[0]);
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV headers.');
  const rows = lines.slice(1).map((line) => {
    const fields = parse(line);
    if (fields.length !== headers.length) throw new Error('Invalid CSV row.');
    return Object.fromEntries(headers.map((name, i) => [name, fields[i]]));
  });
  const expected = new Map([['en', 'en-*'], ['pinyin', 'pi-*'], ['zhuyin', 'zh-*']]);
  for (const row of rows) {
    if (expected.get(row.mode) !== row.entry_id_pattern) throw new Error(`Unexpected batch: ${row.mode || '(missing)'}`);
    expected.delete(row.mode);
    if (row.release_decision !== 'CLEARED_FOR_PUBLIC_RELEASE' || !['VERIFIED', 'ORIGINAL'].includes(row.rights_status)) {
      throw new Error(`Vocabulary batch ${row.batch_id || row.mode} is not cleared for public release.`);
    }
  }
  if (expected.size) throw new Error('Vocabulary batch missing.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    assertVocabularyReleaseAllowed(readFileSync(new URL('../docs/VOCABULARY_SOURCE_REGISTER.csv', import.meta.url), 'utf8'));
    console.log('Vocabulary release status is cleared.');
  } catch (error) {
    console.error(`Release blocked: ${error.message}`);
    process.exitCode = 1;
  }
}
