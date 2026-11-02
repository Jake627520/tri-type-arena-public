# Tasks — Security & License Audit Hardening (Round 4.1)

## 1. RED: TDD Tests for SPDX Strict Parsing & Security Fail-Closed
- [x] Add SPDX strict parser negative tests in `tests/license-audit.test.mjs`:
  - [x] Unmatched opening parenthesis: `(MIT`, `((MIT OR Apache-2.0)`
  - [x] Unmatched closing parenthesis: `MIT)`, `(MIT))`
  - [x] Trailing extra tokens: `MIT extra`, `(MIT) Apache-2.0`
  - [x] Missing operands: `MIT OR`, `OR MIT`, `MIT AND`, `AND Apache-2.0`, `MIT OR OR Apache-2.0`
  - [x] Illegal WITH exceptions: `MIT WITH`, `Apache-2.0 WITH`, `Apache-2.0 WITH InvalidException`
  - [x] Operator precedence: `MIT OR Apache-2.0 AND GPL-3.0` vs `(MIT OR Apache-2.0) AND GPL-3.0`
  - [x] Unparseable expressions return false (fail-closed)
- [x] Add Security Scanner fail-closed tests in `tests/security-audit.test.mjs`:
  - [x] Simulated git log execution failure registers finding
  - [x] Simulated npm audit unparseable / error registers finding
  - [x] Simulated missing Gitleaks in CI environment registers finding
  - [x] Redaction test ensuring sensitive strings are masked as `***REDACTED***`

## 2. GREEN: Implement Strict SPDX Parser & Fail-Closed Security Scanner
- [x] Update `scripts/spdx-evaluator.mjs` with full EBNF recursive descent parser
- [x] Update `scripts/security-audit.mjs`:
  - [x] Stream-based / unbounded Git history processing
  - [x] Path-based diff exclusion (eliminate `exclude` substring bypass)
  - [x] Fail-closed git log, npm audit, and CI Gitleaks checks
  - [x] Credential masking in log outputs
- [x] Verify all new and existing tests pass locally

## 3. REGRESSION & Quality Verification
- [x] Run `npm run typecheck`
- [x] Run `npm run lint`
- [x] Run `npm run test` (42 Node tests pass)
- [x] Run `npm run test:vitest` (11 Vitest tests pass)
- [x] Run `npm run test:e2e` (6 Playwright tests pass)
- [x] Run `npm run audit:licenses` (0 violations)
- [x] Run `npm run audit:security` (0 findings)
- [x] Run `npm run build` (Clean production bundle)
- [x] Run `gitleaks detect --source . --verbose` (0 leaks)

## 4. Documentation & Remote CI
- [x] Update `docs/SECURITY_AUDIT.md`
- [x] Update `docs/LICENSE_AUDIT.md`
- [x] Update `docs/TEST_RESULTS.md`
- [x] Update `docs/RELEASE_READINESS.md`
- [ ] Commit and push to `origin main`
- [ ] Monitor GitHub Actions remote workflow runs and record URLs & job results
