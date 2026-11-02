// Rebuild candidate data from independently selected words and CC-CEDICT only.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pinyinToBopomofo } from './data/chinese/pinyin-to-bopomofo.mjs';
const source = process.argv[2];
if (!source) throw Error('Usage: node scripts/match-chinese-sources.mjs CEDICT [--check]');
const data = readFileSync(source);
if (createHash('sha256').update(data).digest('hex') !== 'b4537f6bdd73fa33f94c07ceda3ce697da66bf32826167cce3b7ba42c0f3755e') throw Error('CC-CEDICT checksum mismatch');
const entries = new Map();
for (const line of data.toString('utf8').split('\n')) {
  const m = line.match(/^([^ ]+) ([^ ]+) \[([^\]]+)\]/);
  if (!m) continue;
  const key = m[1], item = `${m[2]}\t${m[3]}`;
  if (!entries.has(key)) entries.set(key, new Set());
  entries.get(key).add(item);
}
const result = ['traditional\tsimplified\tpinyin_source\tzhuyin_source'];
for (const word of readFileSync('scripts/data/chinese/seed.txt', 'utf8').trim().split(/\r?\n/)) {
  const matches = entries.get(word);
  if (!matches || matches.size !== 1) continue;
  const [simplified, reading] = [...matches][0].split('\t');
  const syllables = reading.split(' ');
  if (word.length !== simplified.length || word.length !== syllables.length || !syllables.every(x => /^[a-zA-ZüÜv:]+[1-5]$/.test(x))) continue;
  try {
    const zhuyin = syllables.map(x => pinyinToBopomofo(x.replace(/u:/g, 'ü').replace(/v/g, 'ü'), 'NUMBER')).join(' ');
    if (!zhuyin.split(' ').every(x => /^[ㄅ-ㄩ˙ˊˇˋ]+$/.test(x))) continue;
    result.push(`${word}\t${simplified}\t${reading}\t${zhuyin}`);
  } catch { /* Unsupported syllables do not enter the candidate set. */ }
}
const output = result.join('\n') + '\n';
const target = 'scripts/data/chinese/candidates.tsv';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw Error('Candidate table differs from source');
} else writeFileSync(target, output);
console.log(`${result.length - 1} CC-CEDICT matches`);
