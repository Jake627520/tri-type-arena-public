import { LESSONS } from './legacy-lessons.mjs';
export { LESSONS };
// Taiwan standard Daqian layout. 1st tone is implicit; 2/3/4/light tones: 6/3/4/7.
export const ZHUYIN_KEYS = Object.freeze({
 '1':'ㄅ','q':'ㄆ','a':'ㄇ','z':'ㄈ','2':'ㄉ','w':'ㄊ','s':'ㄋ','x':'ㄌ',
 'e':'ㄍ','d':'ㄎ','c':'ㄏ','r':'ㄐ','f':'ㄑ','v':'ㄒ','5':'ㄓ','t':'ㄔ',
 'g':'ㄕ','b':'ㄖ','y':'ㄗ','h':'ㄘ','n':'ㄙ','u':'ㄧ','j':'ㄨ','m':'ㄩ',
 '8':'ㄚ','i':'ㄛ','k':'ㄜ',',':'ㄝ','9':'ㄞ','o':'ㄟ','l':'ㄠ','.':'ㄡ',
 '0':'ㄢ','p':'ㄣ',';':'ㄤ','/':'ㄥ','-':'ㄦ','6':'ˊ','3':'ˇ','4':'ˋ','7':'˙'
});
export function normalizeInput(input, mode) {
 if (mode === 'zhuyin') return [...input.toLowerCase()].map(c=>ZHUYIN_KEYS[c] ?? c).join('');
 if (mode === 'pinyin') return input.replace(/[üǖǘǚǜ]/gi, 'v').normalize('NFD').replace(/u\u0308/gi, 'v').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s']/g,'');
 return input.toLowerCase();
}
export function evaluate(expected, typed) {
 let correct=0; for(let i=0;i<typed.length;i++) if (expected[i] === typed[i]) correct++;
 return {correct, errors:typed.length-correct, complete:typed===expected};
}
export function metrics({correctKeys=0, totalKeys=0, elapsedSeconds=0, words=0, streak=0}) {
 return {
  wpm: elapsedSeconds>0 ? Math.round((correctKeys/5)/(elapsedSeconds/60)) : 0,
  accuracy:totalKeys ? Math.round(correctKeys/totalKeys*100) : 100,
  score:Math.max(0, words*100+streak*10),
 };
}
export function nextIndex(index, length) { if(length<1) throw new Error('No lessons'); return (index+1)%length; }
export function validateLesson(lesson,mode) {return !!(lesson?.display && lesson?.answer && normalizeInput(lesson.answer,mode)===lesson.answer)};
