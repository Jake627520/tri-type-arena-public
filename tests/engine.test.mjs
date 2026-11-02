import test from 'node:test';import assert from 'node:assert/strict';
import {LESSONS,ZHUYIN_KEYS,normalizeInput,evaluate,metrics,nextIndex,validateLesson} from '../src/engine.mjs';
test('three modes have validated words',()=>{for(const mode of ['en','pinyin','zhuyin']){assert.ok(LESSONS[mode].length>=10);for(const l of LESSONS[mode]) assert.ok(validateLesson(l,mode),`${mode}: ${l.display}`)}});
test('pinyin strips tones and case',()=>assert.equal(normalizeInput('NǏ Hǎo','pinyin'),'nihao'));
test('Daqian maps physical keystrokes to bopomofo',()=>{assert.equal(normalizeInput('su3cl3','zhuyin'),'ㄋㄧˇㄏㄠˇ');assert.equal(ZHUYIN_KEYS['6'],'ˊ');assert.equal(ZHUYIN_KEYS['4'],'ˋ');});
test('English comparison recognizes errors and completion',()=>{assert.deepEqual(evaluate('cat','cat'),{correct:3,errors:0,complete:true});assert.deepEqual(evaluate('cat','car'),{correct:2,errors:1,complete:false})});
test('metrics are deterministic with zero-time guard',()=>{assert.deepEqual(metrics({correctKeys:25,totalKeys:30,elapsedSeconds:30,words:3,streak:2}),{wpm:10,accuracy:83,score:320});assert.equal(metrics({correctKeys:4}).wpm,0)});
test('next lesson wraps around',()=>{assert.equal(nextIndex(11,12),0);assert.throws(()=>nextIndex(0,0))});
