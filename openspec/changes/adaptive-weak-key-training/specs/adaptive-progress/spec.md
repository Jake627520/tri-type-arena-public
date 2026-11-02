## Purpose

Defines historical baseline snapshot capture, in-practice target key performance tracking, improvement metric calculations in percentage points, data sufficiency thresholds, and non-causal evaluation constraints.

## ADDED Requirements

### Requirement: Historical Baseline Snapshot Capture
The system SHALL capture an immutable snapshot of the user's historical key statistics at the moment an adaptive practice session is initialized.

#### Scenario: Capturing pre-session baseline stats
- **WHEN** user initiates an adaptive practice session for identified weak keys in a specific mode
- **THEN** the system extracts current error rates, total attempts, and error counts for each target key from `tritype.weakkeys.v1.${mode}` and stores them as `baselineStats` within the active session state

#### Scenario: Zero history baseline fallback
- **WHEN** user initiates adaptive practice with a target key that has no prior history in `tritype.weakkeys.v1.${mode}`
- **THEN** the system initializes `baselineStats` for that key with 0 attempts, 0 errors, and null baseline error rate

### Requirement: In-Practice Target Key Telemetry
The system SHALL isolate and aggregate keystroke attempts and errors specifically committed during the active adaptive practice session using the in-memory session key tracking.

#### Scenario: Key attempt recording during practice
- **WHEN** user types a character matching or intended for a target weak key during an adaptive lesson
- **THEN** the system records an attempt for that key in `practiceStats` (derived from `session.keyAttempts`), marking it as correct or error based on whether the key matched the expected answer

#### Scenario: First-tone Space key telemetry
- **WHEN** user enters a Space key during a Zhuyin first-tone syllable
- **THEN** the Space key attempt and any accompanying errors are recorded under the `' '` key in `practiceStats`

### Requirement: Adaptive Improvement Delta Calculation
The system SHALL calculate improvement exclusively as percentage point differences between historical baseline error rate and practice session error rate.

#### Scenario: Significant improvement observed
- **WHEN** a target key had a baseline error rate of 35% (0.35) and user achieves an error rate of 15% (0.15) over >= 5 attempts during practice
- **THEN** the improvement metric is reported as +20.0 percentage points (+20.0 pp) reduction in error rate

#### Scenario: Performance regression observed
- **WHEN** a target key had a baseline error rate of 25% (0.25) and user records an error rate of 40% (0.40) over >= 5 attempts during practice
- **THEN** the improvement metric is reported as -15.0 percentage points (-15.0 pp) increase in error rate

### Requirement: Data Sufficiency Threshold and Non-Causal Framing
The system SHALL enforce a minimum attempt threshold of 5 attempts per key during practice before asserting improvement conclusions, and SHALL present results strictly as observational differences.

#### Scenario: Insufficient practice attempts
- **WHEN** a target key receives fewer than 5 attempts during an adaptive practice session
- **THEN** the system classifies the improvement status for that key as `INSUFFICIENT_DATA` and displays an informative prompt rather than a percentage delta

#### Scenario: Non-causal observation claim
- **WHEN** displaying post-practice improvement metrics to the user
- **THEN** the UI labels the metric as "Observed Session Change" (單次練習表現變化) rather than claiming permanent skill acquisition or mastery
