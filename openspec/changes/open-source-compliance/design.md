# Design Decisions — License & Open Source Compliance

## ADR-LIC-01: Permissive MIT Baseline
- Context: TriType Arena is designed for open public engagement and educational use.
- Decision: Adopt standard MIT License for maximum developer friendliness and ease of embedding.

## ADR-LIC-02: Cleanroom Architecture Isolation
- Context: Popular typing games like Monkeytype are licensed under copyleft GPL-3.0.
- Decision: Enforce complete cleanroom architecture. Domain engine, state machines, styling, and game logic are designed from first principles with zero imported code from copyleft repositories.

## ADR-LIC-03: Provenance Documentation in Repo
- Context: Open-source users require transparency regarding dictionary sources and font assets.
- Decision: Maintain explicit `docs/ASSET_PROVENANCE.md` and `THIRD_PARTY_NOTICES.md` at repository root.
