# Proposal — Open Source & License Compliance

## Problem
Open-source typing applications and web games frequently encounter legal and copyright pitfalls, such as unintentional inclusion of copyleft GPL code (e.g. from Monkeytype), proprietary UI assets from commercial games, unvetted word corpora, or accidental secret leakage.

## Goal
Establish rigorous open source and copyright compliance standards for TriType Arena to ensure an untainted MIT-licensed public repository with full provenance tracking.

## Scope
- License determination (MIT)
- Inbound third-party license audit policy (prohibit GPL/AGPL copyleft)
- Asset and prompt provenance verification
- Secret scanning & CI license audit gate
- Formal documentation: LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, THIRD_PARTY_NOTICES, ASSET_PROVENANCE, LICENSE_AUDIT
- Public release gate checklist

## Risks & Mitigations
- **Risk**: Third-party NPM packages introducing transitively contaminated GPL licenses.
  - **Mitigation**: Automated license audit script executed in CI and pre-commit checks.
- **Risk**: Unverified Chinese dictionaries containing copyrighted literary extracts.
  - **Mitigation**: Restrict prompts to curated high-frequency vocabulary and independently composed sentences.
