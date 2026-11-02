# Technical Design — Security & Dependency Remediation

## 1. Dependency Remediation Architecture

### Upgrade Map
| Package | Previous Version | Target Version | Remediation Target | Major Breaking Risks & Mitigations |
|---|---|---|---|---|
| `vite` | `^5.4.11` | `^6.4.5` | Fixes GHSA-4w7w-66w2-5vf9, GHSA-v6wh-96g9-6wx3, GHSA-fx2h-pf6j-xcff, GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22 | Verified `@vitejs/plugin-react@4.3.4` supports `vite: ^6.0.0`. Verified production build output is identical. |
| `esbuild` | `0.21.5` | `^0.25.0` | Fixes GHSA-67mh-4wv8-2f99 (dev server CORS) | Transitive via Vite 6.4.5. Built-in bundler handles TSX syntax cleanly. |
| `vitest` | `^2.1.8` | `^4.1.12` | Fixes GHSA-5xrq-8626-4rwp, GHSA-82fw-gwwq-j7x9 | Eliminates `tinypool` dependency entirely; updates `@vitest/mocker` to 4.1.12. |
| `@vitest/mocker` | `2.1.8` | `4.1.12` | Fixes GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8 | Verified all RTL component tests execute without mock regressions. |
| `tinypool` | `2.1.1` | Removed | Fixes GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr | No longer a dependency in Vitest 4.x. |

### Verification Protocol
All updates are tested against the full test suite:
- TypeScript compiler (`tsc --noEmit`)
- ESLint (`eslint src`)
- Node.js test runner (`node --test tests/*.test.mjs`)
- Vitest suite (`vitest run`)
- Playwright E2E suite (`playwright test`)
- Vite production build (`vite build`)
- Direct `npm audit` check

## 2. SPDX License Evaluator Architecture

### Grammar & Evaluation Rules
1. **Atoms**: License identifiers (e.g. `MIT`, `Apache-2.0`, `BSD-3-Clause`). Must be explicitly present in `ALLOWED_LICENSES` and must not contain any `PROHIBITED_SUBSTRINGS`.
2. **WITH Clause**: `LicenseId WITH ExceptionId`. Validated if `LicenseId` is allowed and `ExceptionId` is in recognized exceptions (e.g., `LLVM-exception`).
3. **Compound Operators**:
   - `OR`: Dual-licensing choice. `evaluate(A OR B) = evaluate(A) || evaluate(B)`.
   - `AND`: Conjunctive obligations. `evaluate(A AND B) = evaluate(A) && evaluate(B)`.
4. **Strict Rejection**:
   - Any license not satisfying the above rules is marked as `isAllowed: false` and added to `violations`.
   - `UNKNOWN` or unresolvable licenses are immediately rejected.
5. **Separation of Concerns**:
   - Pure logic encapsulated in `scripts/spdx-evaluator.mjs`.
   - Exercised via unit tests in `tests/license-audit.test.mjs`.

## 3. Security Audit Integration
- Unit test coverage for `SECRET_PATTERNS` in `tests/security-audit.test.mjs`.
- Automated assertion that zero secrets match and zero npm vulnerabilities exist.
- Native invocation of `gitleaks detect --source . --verbose` across full history.
