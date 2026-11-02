# Traceability Matrix
| Requirement | Test | Status |
|--|--|--|
| US-001 | browser switch language / validateLesson | scripted browser/manual + unit |
| US-002 | browser timer/start/reset | smoke test |
| US-003 | evaluate exact/prefix; browser advancement | unit + smoke |
| US-004 | normalizeInput pinyin/zhuyin | unit |
| US-005 | metrics and localStorage | unit + browser |
| US-006 | static review of no fetch | inspected |

Next: write failing Vitest tests before porting engine to TS; then run `npm run typecheck`, `npm run test`, `npm run build`, `npx playwright test`. Require 100% branch coverage for phonetic mapping and scoring, >=85% for domain module.
