## Purpose

Governs the adaptive practice session lifecycle, session state machine transitions, score isolation, and Daqian keyboard first-tone Space mechanics.

## ADDED Requirements

### Requirement: Adaptive Practice Lifecycle Management
The system SHALL govern adaptive practice sessions through explicit lifecycle states: IDLE, READY, RUNNING, PAUSED, COMPLETED, and ABANDONED.

#### Scenario: Session initialization to READY
- **WHEN** user initiates adaptive practice from the dashboard with confirmed weak keys
- **THEN** the system prepares target lessons, captures the historical baseline snapshot, and transitions state to READY awaiting typing start

#### Scenario: Active typing transition to RUNNING
- **WHEN** user types the first character or clicks start in READY state
- **THEN** the session timer begins, metrics begin accumulating, and status transitions to RUNNING

#### Scenario: Pause and resume transitions
- **WHEN** user triggers pause (Escape key or pause button) during RUNNING state
- **THEN** elapsed time calculation suspends, status transitions to PAUSED, and resumes to RUNNING upon unpause

#### Scenario: Natural completion
- **WHEN** user successfully types all target lessons in the adaptive round
- **THEN** the session status transitions to COMPLETED, final outcome metrics are compiled, and results are persisted exactly once

#### Scenario: User abandonment
- **WHEN** user navigates away, exits review, or reloads before completing all lessons
- **THEN** the session is marked as ABANDONED and is strictly prevented from being recorded as a completed session

### Requirement: Challenge Best Score Isolation
The system SHALL prevent adaptive practice sessions from modifying, overwriting, or registering records against standard Challenge Best Scores.

#### Scenario: High score achieved in adaptive practice
- **WHEN** user achieves an WPM or score in adaptive practice that exceeds their existing challenge Best Score
- **THEN** the system records the achievement solely within adaptive history and leaves `tritype.best.v2` completely unaltered

#### Scenario: Session type designation
- **WHEN** an adaptive session is instantiated
- **THEN** `sessionType` is set to 'adaptive' throughout all session events, telemetry records, and completion payloads

### Requirement: Daqian Keyboard First-Tone Space Key Mechanics
The system SHALL enforce standard Taiwan Daqian layout input rules for first tone (陰平) requiring explicit physical Space key presses during adaptive training.

#### Scenario: First-tone Space key requirement
- **WHEN** the current target syllable is first tone without tone marks (e.g. 'ㄓㄨㄥ' in '中午')
- **THEN** the user MUST press physical Space (' ') to complete the syllable and advance to subsequent syllables

#### Scenario: Daqian virtual keyboard spacebar highlighting
- **WHEN** the next expected character in the active lesson is physical Space (' ')
- **THEN** the virtual keyboard spacebar element (`#daqian-space-key`) displays the `.key-active` visual highlight class

#### Scenario: Open box visual symbol rendering
- **WHEN** rendering target characters where the expected character is ASCII Space (' ')
- **THEN** the UI displays the open box symbol `␣` (U+2423) with class `target-char-space` while maintaining ASCII Space (' ') in underlying input validation

#### Scenario: Non-first tone tone mark isolation
- **WHEN** typing syllables with second (ˊ / 6), third (ˇ / 3), fourth (ˋ / 4), or light (˙ / 7) tones
- **THEN** the system strictly forbids extra Space keystrokes and advances immediately upon pressing the designated tone key

### Requirement: Existing Typing Rules Compatibility
The system SHALL maintain 100% compatibility with V0.4.1 typing rules across all three input modes without adding new input constraints to English or Pinyin.

#### Scenario: English typing rule preservation
- **WHEN** adaptive practice is conducted in English mode
- **THEN** keystrokes strictly follow standard English alphanumeric characters and inter-word spaces without any artificial tone or syllable constraints

#### Scenario: Pinyin typing rule preservation
- **WHEN** adaptive practice is conducted in Pinyin mode
- **THEN** keystrokes strictly follow existing Pinyin answer strings without requiring trailing space keys or non-existent tone keys

### Requirement: Idempotent Single-Write Completion Guarantee
The system SHALL ensure that completion callbacks, component re-renders, or window focus shifts execute adaptive session storage persistence exactly once per session.

#### Scenario: Multiple re-renders in completed state
- **WHEN** a session enters COMPLETED status and subsequent React re-renders occur
- **THEN** the persistence pipeline executes storage writes on the first invocation and discards all subsequent duplicate calls
