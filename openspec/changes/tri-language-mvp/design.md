# Design Decisions (ADR)
ADR-01: Offline static app for MVP; zero dependencies and small attack surface. Plan migration to React+TypeScript without changing domain contracts.
ADR-02: Separate mode-specific phonetic expected input from visible Hanzi; avoids conflating IME conversion with keyboard speed.
ADR-03: Track errors on each newly appended key; corrected mistakes still affect accuracy. Deletions do not reduce attempted count.
ADR-04: No code reuse from Monkeytype GPL or game assets. Original design and sample phrases.
ADR-05: UI state currently imperative, but engine is isolated ESM for deterministic testing and future hook adapter.
