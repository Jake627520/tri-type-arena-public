#!/usr/bin/env python3
"""Generate candidate pools from recorded independent selections and source matches.
Pronunciations remain subject to human review; these are not frequency rankings.
"""
import csv, json, pathlib, re, sys, unicodedata
root = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader((root / 'scripts/data/chinese/candidates.tsv').open(encoding='utf8'), delimiter='\t'))
rows = [r for r in rows if len(r['traditional']) == len(r['simplified']) == len(r['pinyin_source'].split()) == len(r['zhuyin_source'].split()) and all(re.fullmatch(r'[a-zA-ZüÜv:]+[1-5]', s) for s in r['pinyin_source'].split()) and all(re.fullmatch(r'[ㄅ-ㄩ˙ˊˇˋ]+', s) for s in r['zhuyin_source'].split())][:300]
if len(rows) != 300: raise ValueError('Insufficient valid candidates')
def pinyin(s):
    tone = int(s[-1]); word = s[:-1].lower().replace('u:', 'ü').replace('v','ü')
    if tone == 5: return word
    vowels = [i for i, c in enumerate(word) if c in 'aeiouü']
    if not vowels: raise ValueError(s)
    i = next((word.index(c) for c in 'ae' if c in word), None)
    if i is None: i = word.index('o') if 'ou' in word else vowels[-1]
    return unicodedata.normalize('NFC', word[:i+1] + '\u0304\u0301\u030c\u0300'[tone-1] + word[i+1:])
for mode, name, var in [('pinyin','pinyin','PINYIN_VOCABULARY'),('zhuyin','zhuyin','ZHUYIN_VOCABULARY')]:
    entries=[]
    for n,r in enumerate(rows):
        tier = 'beg' if n < 120 else 'int' if n < 240 else 'adv'; ordinal = n+1 if n < 120 else n-119 if n < 240 else n-239
        syllables = r['pinyin_source'].split() if mode == 'pinyin' else r['zhuyin_source'].split()
        if mode == 'pinyin':
            hint=' '.join(map(pinyin,syllables)); answer=''.join(re.sub('[1-5]', '', x).lower().replace('u:', 'v').replace('ü','v') for x in syllables)
        else:
            # The game stores a neutral tone at the end of its syllable.
            syllables=[s[1:]+'˙' if s.startswith('˙') else s for s in syllables]; hint=' '.join(syllables); answer=''.join(syllables)
        entries.append(dict(id=f'{"pi" if mode=="pinyin" else "zh"}-cedict2-{tier}-{ordinal:03}',mode=mode,display=r['simplified' if mode=='pinyin' else 'traditional'],answer=answer,hint=hint,difficulty={'beg':'beginner','int':'intermediate','adv':'advanced'}[tier],category='daily'))
    out='import { VocabularyEntry } from "./types";\n\n// Generated candidate data; see docs/vocabulary/CHINESE_CANDIDATES.md.\nexport const '+var+': readonly VocabularyEntry[] = Object.freeze([\n'+''.join('  '+json.dumps(e,ensure_ascii=False)+',\n' for e in entries)+']);\n'
    path=root/f'src/domain/vocabulary/{name}.ts'
    if '--check' in sys.argv:
        if path.read_text()!=out: raise SystemExit(f'{path} differs')
    else: path.write_text(out)
