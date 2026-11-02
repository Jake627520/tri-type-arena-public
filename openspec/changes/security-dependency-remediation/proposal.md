# Proposal — Security & Dependency Remediation (Round 4)

## Context
Following the Round 3 audit, the repository achieved zero production dependency vulnerabilities, but automated dependency audits identified 6 devDependency vulnerabilities across `@vitest/mocker`, `esbuild`, `tinypool`, `vite`, `vite-node`, and `vitest`. Furthermore, the existing license auditor contained flawed SPDX expression logic where compound `AND` expressions and non-whitelisted licenses could escape detection.

## Problem Statement
1. **Dependency Vulnerabilities (6 CVE/GHSA advisories)**:
   - `tinypool` (Critical): Prototype pollution RCE (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) via Vitest 2.x/3.x.
   - `vitest` (Critical / Moderate): Arbitrary file read & execution (GHSA-5xrq-8626-4rwp, GHSA-82fw-gwwq-j7x9).
   - `@vitest/mocker` (Moderate): Path traversal & code injection (GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8).
   - `esbuild` (Moderate): Dev server CORS bypass (GHSA-67mh-4wv8-2f99) via Vite 5.x.
   - `vite` (High / Moderate): Path traversal & command execution in launch-editor (GHSA-4w7w-66w2-5vf9, GHSA-fx2h-pf6j-xcff, GHSA-587h-7wmj-h5pm, etc.).
   - `vite-node` (Moderate): Transitive vulnerability through Vite.
2. **License Scanner SPDX Evaluation Defects**:
   - `(MIT AND GPL-3.0)` was previously treated as compliant because `tokens.some()` matched `MIT`, despite `AND` imposing GPL obligations.
   - Any license not explicitly `"UNKNOWN"` or containing `"GPL"` bypassed violation reporting even when not present in `ALLOWED_LICENSES`.
3. **CI Pipeline Robustness**:
   - Redundant/unconfigured workflow (`check.yml`) failed due to missing `npm ci`.

## Goals
1. Remediate 100% of devDependency vulnerabilities (`npm audit` reporting 0 vulnerabilities).
2. Upgrade Vite (`>=6.4.5`) and Vitest (`>=4.1.12`) without breaking any existing test or build behavior.
3. Fix the SPDX license parser to accurately enforce boolean logic (`AND` vs `OR`) and strict allowlists with negative tests.
4. Verify Git history with Gitleaks and enforce secret-free repository status.
5. Ensure all GitHub Actions workflows execute and pass on remote CI.

## Out of Scope
- Making the repository public without explicit user confirmation.
- Destructive Git operations (`push -f`, rewriting history).
