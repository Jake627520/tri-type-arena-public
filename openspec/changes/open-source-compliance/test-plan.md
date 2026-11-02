# Test Plan — Open Source Compliance

| Requirement | Verification Method | Evidence |
|---|---|---|
| US-LIC-001 | Automated file existence & content check | `tests/license-audit.test.mjs` |
| US-LIC-002 | Dependency license inspection against allowlist | `tests/license-audit.test.mjs` |
| US-LIC-003 | Cleanroom review against `docs/RESEARCH.md` | Document review & inspection |
| US-LIC-004 | Asset provenance documentation inspection | `docs/ASSET_PROVENANCE.md` |
| US-LIC-005 | Regex-based secret scanning | CI `license-check.yml` & local test |
| US-LIC-006 | Public release gate checklist | Maintained in `docs/LICENSE_AUDIT.md` |
