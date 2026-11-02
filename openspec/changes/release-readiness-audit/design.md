# Design Decisions — Release Readiness Audit (Round 3)

## ADR-AUD-01: Single Authoritative Domain in TypeScript
- Context: Duplication between `src/engine.mjs`, `src/domain/*.mjs`, and `src/domain/*.ts` can lead to behavioral drift.
- Decision: Establish `src/domain/*.ts` as the sole authoritative implementation. Legacy `.mjs` wrappers or modules re-export from the compiled or unified domain to ensure 100% behavioral parity.

## ADR-AUD-02: Multi-Tier Test Pyramid
- Tier 1: Unit tests for pure domain algorithms (clock, Mulberry32, metrics, Zhuyin mapping) with Node test runner & Vitest.
- Tier 2: React Component & Integration tests with React Testing Library + JSDOM simulating user typing, composition, paste, and pause.
- Tier 3: Playwright E2E testing full browser rendering, keyboard event flow, and responsive layout.

## ADR-AUD-03: Full Git History Security Scan
- Context: Checking only current files (`HEAD`) can miss secrets committed in earlier revisions or branches.
- Decision: Execute an automated scanner traversing every commit in `git log -p` matching high-entropy credentials, private keys, and API tokens.
