# Technical Design — Security & License Audit Hardening (Round 4.1)

## 1. SPDX Strict Grammar Specification

### Grammar
```ebnf
Expression   := OrExpression EOF ;
OrExpression := AndExpression ( "OR" AndExpression )* ;
AndExpression:= PrimaryExpression ( "AND" PrimaryExpression )* ;
PrimaryExpression := "(" Expression ")"
                   | Identifier ( "WITH" ExceptionIdentifier )? ;
```

### Constraints & Edge Handling
1. **Unmatched Parentheses**:
   - Encountering `(` without a matching `)` before EOF raises `SyntaxError: Unclosed parenthesis`.
   - Encountering `)` without a preceding `(` raises `SyntaxError: Unexpected closing parenthesis`.
2. **Trailing Tokens**:
   - After parsing the root `OrExpression`, if `index < tokens.length`, raises `SyntaxError: Unexpected trailing tokens: ...`.
3. **Missing Operands**:
   - `AND` or `OR` without left/right expressions raises `SyntaxError: Missing operand`.
4. **Illegal `WITH` Clauses**:
   - `WITH` without a preceding license identifier or without a subsequent exception identifier raises `SyntaxError`.
   - Exceptions must be members of `PERMISSIBLE_EXCEPTIONS` (`LLVM-exception`, `Classpath-exception-2.0`, `Universal-FOSS-exception-1.0`).
5. **Operator Precedence**:
   - `WITH > AND > OR`.
   - `A OR B AND C` parses as `A OR (B AND C)`.
6. **Fail-Closed Guarantee**:
   - Any thrown syntax or parsing error in `isSpdxCompliant` immediately returns `false`.

## 2. Security Audit Fail-Closed Architecture

### Git History Processing
- Replace fixed-buffer `execSync('git log ...', { maxBuffer: 10MB })` with stream-based line reading (`readline` on child process `stdout`) or chunked processing.
- Error event or non-zero exit from `git log` registers an immediate fatal finding.

### File-Level Exclusion Mechanism
- Replace fragile `line.includes('exclude')` content checks with path-scoped diff tracking:
  - Track current diff file header (`diff --git a/... b/...`).
  - Only bypass line checking if the diff file matches explicit relative paths (`scripts/security-audit.mjs`, `tests/security-audit.test.mjs`, `tests/license-audit.test.mjs`).

### Fail-Closed CI & Tool Audits
- **npm audit**:
  - If process fails or JSON cannot be parsed with valid metadata, register fatal finding.
  - Vulnerability count must be 0.
- **Gitleaks in CI**:
  - When `process.env.CI === 'true'`, if `which gitleaks` is not found or fails, register fatal finding.
- **Secret Redaction**:
  - All log entries sanitize detected strings with `***REDACTED***` to avoid leaking true credential values into build logs.
