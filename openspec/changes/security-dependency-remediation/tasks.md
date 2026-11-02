# Tasks — Security & Dependency Remediation (Round 4)

## 1. RED: TDD Negative Tests for Security & SPDX License Scanner
- [x] Add negative tests for SPDX parser (`tests/license-audit.test.mjs`):
  - [x] Reject `(MIT AND GPL-3.0)`
  - [x] Reject `(GPL-2.0-only OR AGPL-3.0)`
  - [x] Reject unlisted licenses: `Proprietary`, `CC-BY-NC-4.0`, `UNKNOWN`
  - [x] Accept `(MIT OR GPL-3.0)`
  - [x] Accept `(MIT AND Apache-2.0)`
  - [x] Accept `Apache-2.0 WITH LLVM-exception`
- [x] Add unit tests for secret scanner (`tests/security-audit.test.mjs`):
  - [x] Assert detection of AWS keys, GitHub tokens, Private keys
  - [x] Assert clean source code produces 0 findings

## 2. GREEN: Implement SPDX Evaluator & Security Scanner Updates
- [x] Create `scripts/spdx-evaluator.mjs` with authoritative boolean expression evaluator
- [x] Refactor `scripts/license-audit.mjs` to use `spdx-evaluator.mjs`
- [x] Ensure `ALLOWED_LICENSES` covers all verified permissive licenses: `MIT`, `MIT-0`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `0BSD`, `CC0-1.0`, `CC-BY-4.0`, `Python-2.0`, `Unlicense`, `BlueOak-1.0.0`
- [x] Run `npm run audit:licenses` and verify 0 violations across all 338 dependencies
- [x] Update `scripts/security-audit.mjs` to also check `npm audit` exit code

## 3. Dependency Remediation & Lockfile Synchronization
- [x] Upgrade `vite` to `^6.4.5` and `vitest` to `^4.1.12`
- [x] Update `package.json` and sync `package-lock.json`
- [x] Verify `npm audit` reports 0 vulnerabilities
- [x] Verify `tinypool` and vulnerable `@vitest/mocker` / `esbuild` versions are eliminated

## 4. REGRESSION: Comprehensive Verification
- [x] Run `npm run typecheck` (TypeScript strict)
- [x] Run `npm run lint` (ESLint)
- [x] Run `npm run test` (All 31 Node unit tests)
- [x] Run `npm run test:vitest` (All 11 Vitest component tests)
- [x] Run `npm run test:e2e` (All 6 Playwright tests)
- [x] Run `npm run build` (Vite production bundle)
- [x] Run `gitleaks detect --source . --verbose` (Full Git history)

## 5. CI & Remote Verification
- [x] Update `.github/workflows/check.yml` to include `npm ci` before `npm run check`
- [ ] Commit and push to `origin main`
- [ ] Monitor GitHub Actions workflow runs and record run IDs, URLs, and job results
- [ ] Generate comprehensive Round 4 verification report
