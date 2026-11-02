import test from 'node:test';
import assert from 'node:assert/strict';
import { pinyinToBopomofo } from '../scripts/data/chinese/pinyin-to-bopomofo.mjs';

test('pinyin to bopomofo preserves syllables and tone marks', () => {
  for (const [pinyin, expected] of [
    ['zhong1', 'ㄓㄨㄥ'], ['guo2', 'ㄍㄨㄛˊ'], ['ma3', 'ㄇㄚˇ'],
    ['lü4', 'ㄌㄩˋ'], ['ma5', '˙ㄇㄚ'], ['xue2', 'ㄒㄩㄝˊ'], ['yuan2', 'ㄩㄢˊ'],
  ]) assert.equal(pinyinToBopomofo(pinyin, 'NUMBER'), expected, pinyin);
});
