# Normative Specification — License & Open Source Compliance

## US-LIC-001 Primary Licensing
The repository SHALL be licensed under the MIT License. A top-level `LICENSE` file containing standard MIT terms SHALL exist.

## US-LIC-002 Third-Party Dependency Compatibility
All runtime and build dependencies SHALL be licensed under permissive licenses: MIT, Apache-2.0, BSD-2/3-Clause, or ISC.
Dependencies under GPL-1.0/2.0/3.0, AGPL, SSPL, or unapproved custom commercial licenses SHALL NOT be incorporated.

## US-LIC-003 Cleanroom Asset Authorship
UI designs, components, layout styling, and gameplay code SHALL be cleanroom implementations. No source code or assets from Monkeytype, TypeRacer, Nitro Type, or ZType SHALL be copied into this repository.

## US-LIC-004 Vocabulary & Prompt Provenance
All prompt text, English words, Chinese Pinyin pairs, and Zhuyin Daqian transcriptions SHALL be independently verified and recorded in `docs/ASSET_PROVENANCE.md`.

## US-LIC-005 Secret & Sensitive Data Prohibition
No API keys, OAuth secrets, authentication tokens, credentials, or private personal data SHALL be committed to Git history.

## US-LIC-006 Automated Audit & Public Release Gate
CI workflows SHALL execute license validation and secret scanning. The repository SHALL NOT be toggled to public until all items in the Public Release Gate checklist are formally approved.
