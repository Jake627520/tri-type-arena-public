## Purpose

Governs persistent storage of adaptive training records under dedicated key `tritype.adaptive.v1`, schema versioning, single-write completion idempotency, backward compatibility with existing storage keys, storage quota limits, and data clearing integration.

## ADDED Requirements

### Requirement: Dedicated Storage Key and Schema Versioning
The system SHALL persist all adaptive training records in browser LocalStorage under the dedicated storage key `tritype.adaptive.v1` with explicit schema versioning.

#### Scenario: Schema validation on save
- **WHEN** an adaptive practice session completes successfully
- **THEN** the system serializes a record containing `id`, `schemaVersion: 1`, `mode`, `difficulty`, `targetWeakKeys`, `seed`, `startedAt`, `completedAt`, `baselineStats`, `practiceStats`, and `status: 'COMPLETED'` into the `tritype.adaptive.v1` collection

#### Scenario: Corrupted JSON recovery and overwrite protection
- **WHEN** reading `tritype.adaptive.v1` encounters malformed or non-array JSON data
- **THEN** the system logs a diagnostic warning, gracefully falls back to an empty record list `[]` for UI inspection, and strictly fails closed on write operations to prevent destructively overwriting raw unverified storage

### Requirement: Idempotent Single-Write Guarantee
The system SHALL ensure that each adaptive practice session is written to persistent storage exactly once upon completion, preventing duplicate entries.

#### Scenario: Double completion prevention
- **WHEN** a completion event is dispatched multiple times (e.g. rapid key repeat or double UI click) for the same session ID
- **THEN** the system identifies the existing session ID in storage and ignores subsequent write operations without creating duplicate records

#### Scenario: Persistence failure and decoupled retry
- **WHEN** persistent storage write fails upon completion (e.g., storage corruption or temporary quota failure)
- **THEN** the system records weak keys exactly once, holds the pending session record with stable ID in memory, reports persist failure status, and allows explicit retry without re-accumulating weak keys or re-computing baseline metrics

#### Scenario: Abandoned session exclusion
- **WHEN** a session terminates in an ABANDONED state (user left early)
- **THEN** the system strictly avoids writing the session into the completed `tritype.adaptive.v1` log

### Requirement: Storage Backward Compatibility and Coexistence
The system SHALL maintain total coexistence with existing storage keys `tritype.learning.v1`, `tritype.weakkeys.v1.*`, and `tritype.best.v2` without modifying their data schemas.

#### Scenario: Coexistence without side effects
- **WHEN** adaptive sessions are recorded, retrieved, or updated
- **THEN** existing data in `tritype.learning.v1`, `tritype.weakkeys.v1.en`, `tritype.weakkeys.v1.pinyin`, `tritype.weakkeys.v1.zhuyin`, and `tritype.best.v2` remains completely unaltered and valid

### Requirement: Storage Quota and Graceful Degradation
The system SHALL enforce record history boundaries (maximum 50 historical sessions) and handle browser storage quota exhaustion gracefully.

#### Scenario: Storage history boundary trimming and record preservation
- **WHEN** total saved adaptive sessions exceed 50 records
- **THEN** the oldest completed sessions among existing history are pruned to keep the stored collection at or below 50 entries (FIFO retention), guaranteeing that the newly saved session is never evicted upon insertion even if its timestamp is chronologically older

#### Scenario: QuotaExceededError handling
- **WHEN** saving an adaptive session triggers browser `QuotaExceededError`
- **THEN** the system captures the error, attempts to prune the oldest 10 existing records, retries the write while preserving the new session, and reports failure reason QUOTA if storage remains exhausted

### Requirement: Integrated History Clearing
The system SHALL remove all adaptive training data when the user executes a global "Clear All Data" or "Reset Stats" action.

#### Scenario: Global history reset
- **WHEN** user clicks "Reset All Data" in settings or dev panel
- **THEN** `tritype.adaptive.v1` is removed from localStorage alongside `tritype.learning.v1` and `tritype.weakkeys.v1.*`
