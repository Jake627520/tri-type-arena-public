# Third-Party License Audit & Provenance Report

Date: 2026-10-26  
Status: **PASSED (100% Permissive Open Source, Zero Copyleft, Strict EBNF Validated)**  
Audited Scope: All direct and transitive dependencies (`package-lock.json`)  
Evaluator: `scripts/spdx-evaluator.mjs` (Authoritative SPDX 2.x/3.x Strict Parser)  

---

## 1. Compliance Policy & Allowlist

TriType Arena is released under the permissive **MIT License**. All dependencies must be compatible with commercial and non-commercial redistribution without copyleft triggers.

### Allowed Licenses
- `MIT`, `MIT-0`
- `Apache-2.0`
- `BSD-2-Clause`, `BSD-3-Clause`
- `ISC`, `0BSD`, `CC0-1.0`
- `CC-BY-4.0` (Attribution retained in `THIRD_PARTY_NOTICES.md`)
- `Python-2.0`, `Unlicense`, `BlueOak-1.0.0`

### Permissible Exceptions
- `LLVM-exception`
- `Classpath-exception-2.0`
- `Universal-FOSS-exception-1.0`

### Prohibited Licenses
- Strong Copyleft: `GPL-2.0`, `GPL-3.0`, `AGPL-3.0`
- Source-Available / Non-Open-Source: `SSPL`, `Commons Clause`, `BSL-1.1`
- Non-Commercial restrictions: `CC-BY-NC-4.0`
- `UNKNOWN` or unresolvable proprietary licenses

---

## 2. Strict SPDX Parser Specification (Round 4.1 Hardening)

The evaluator implements an EBNF recursive descent parser enforcing full grammar compliance:
1. **Unmatched Parentheses**: Strictly trapped; unclosed `(` or unopened `)` immediately throws `SyntaxError`.
2. **Trailing Tokens**: Any tokens remaining after expression parsing are rejected.
3. **Missing Operands**: Incomplete binary operations (`OR`, `AND`) are rejected.
4. **Illegal Exceptions**: `WITH` clauses require a valid base license and an approved exception identifier.
5. **Operator Precedence**: Enforces standard precedence: `WITH > AND > OR`.
6. **Fail-Closed Guarantee**: Any parse error or unparseable input strictly returns `false`.

---

## 3. Dependency Inventory Summary

| License | Total Package Occurrences | Permissibility Status |
|---|---|---|
| `MIT` | 285 | Permissive (Allowed) |
| `Apache-2.0` | 22 | Permissive (Allowed) |
| `ISC` | 16 | Permissive (Allowed) |
| `BSD-2-Clause` | 8 | Permissive (Allowed) |
| `BSD-3-Clause` | 3 | Permissive (Allowed) |
| `MIT-0` | 1 (`@csstools/color-helpers`) | Permissive (Allowed) |
| `CC-BY-4.0` | 1 (`caniuse-lite`) | Permissive with attribution (Allowed) |
| `Python-2.0` | 1 (`argparse`) | Permissive (Allowed) |
| `BlueOak-1.0.0` | 1 (`minimatch`) | Permissive (Allowed) |
| **Total Audited** | **338 packages** | **100% Permissive** |

---

## 4. Execution Evidence

```bash
$ npm run audit:licenses

> tritype-arena@0.2.0 audit:licenses
> node scripts/license-audit.mjs && node --test tests/license-audit.test.mjs

Audited 338 total direct and transitive packages.
Violations / Copyleft / Unknown: 0
All packages verified permissive and compatible with MIT public release!
✔ compliance: root license and community files exist and are non-empty
✔ compliance: LICENSE contains valid MIT text and no copyleft mention
✔ compliance: package.json declares MIT license
✔ compliance: no committed secrets found in source and config files
✔ license: SPDX evaluator rejects prohibited copyleft even when paired with MIT in AND expression
✔ license: SPDX evaluator rejects unapproved proprietary or unknown licenses
✔ license: SPDX evaluator accepts dual-licensed OR expression where at least one choice is permissive
✔ license: SPDX evaluator accepts multiple permissible licenses in AND expression
✔ license: SPDX evaluator accepts permissible license with standard exception
✔ license: strict parser rejects unmatched opening or closing parentheses
✔ license: strict parser rejects trailing unexpected tokens
✔ license: strict parser rejects missing operands in expressions
✔ license: strict parser rejects illegal or unapproved WITH exceptions
✔ license: strict parser enforces operator precedence: WITH > AND > OR
✔ license: strict parser fails closed on empty or invalid expressions
ℹ tests 15, pass 15, fail 0
```
