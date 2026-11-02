# Proposal — Security & License Audit Hardening (Round 4.1)

## Context
Following the Round 4 dependency upgrade and SPDX evaluator implementation, all 6 GHSA vulnerabilities were eliminated and CI reached a passing baseline. However, pre-release review identified edge-case parser vulnerabilities in SPDX grammar handling and fail-open risks in the security audit scripts.

## Problem Statement
1. **SPDX Grammar Edge-Cases**:
   - The recursive-descent parser did not strictly validate unmatched parentheses (e.g. `(MIT` or `MIT)`).
   - Trailing tokens following a valid expression were ignored instead of throwing syntax errors (e.g. `MIT extra`).
   - Missing operands (e.g. `MIT OR` or `AND MIT`) were not strictly trapped.
   - Illegal `WITH` clauses (e.g. `MIT WITH` or `MIT WITH InvalidException`) could pass without error.
   - Expressions must follow standard SPDX operator precedence: `WITH > AND > OR`.
   - Any unparseable expression must fail closed (`isSpdxCompliant -> false`).
2. **Security Audit Fail-Closed Deficiencies**:
   - Git log execution failures logged errors to stderr but exited with code 0 instead of terminating with failure.
   - `npm audit` execution or JSON parsing errors were silently caught (`catch {}`) rather than failing.
   - CI environment did not mandate Gitleaks presence (`which gitleaks` missing did not fail in CI).
   - Diff filtering used coarse string checks (`line.includes('exclude')`) which could permit malicious evasion.
   - Fixed 10 MB buffer in `execSync` introduced truncation/failure risk on large repositories.
   - Actual detected secret characters could be echoed to logs.

## Goals
1. Implement strict, fail-closed SPDX expression parsing covering unmatched parens, trailing tokens, missing operands, invalid exceptions, and strict operator precedence.
2. Harden `scripts/security-audit.mjs` with stream-based unbounded Git history processing, file-scoped exclusions, fail-closed handling for git log / npm audit / CI Gitleaks, and credential redaction.
3. Provide comprehensive unit tests simulating scanner failure conditions and parser edge cases.
4. Verify remote GitHub Actions CI execution and update compliance documentation.
