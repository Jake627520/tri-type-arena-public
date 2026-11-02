# Design Decisions — React + TypeScript Migration

## ADR-MIG-01: Inverted Dependency Domain Core
- Context: Domain logic must be portable, resilient to React re-render cycles, and 100% testable without DOM.
- Decision: Place pure domain models and algorithms in `src/domain/` (zero React/DOM dependencies). React components interact through hooks (`useTypingSession`) that wrap the state machine.

## ADR-MIG-02: Mulberry32 Seedable PRNG
- Context: Need a lightweight, high-quality 32-bit pseudo-random number generator for reproducible word sequencing.
- Decision: Implement standard 32-bit Mulberry32 PRNG algorithm. It has zero external dependencies, 2^32 period, and deterministic state progression across all platforms.

## ADR-MIG-03: GameSession Finite State Machine
- Context: Managing timer intervals, pause states, and async user inputs with loose boolean flags causes state desynchronization.
- Decision: Model session status as an algebraic union:
  `type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';`
  All transitions are processed by a pure transition function `transition(state, event): state`.
