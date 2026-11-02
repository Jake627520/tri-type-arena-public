## Purpose

Identifies confirmed weak keys using statistical thresholds and selects targeted lessons using deterministic, weighted sampling without replacement.

## ADDED Requirements

### Requirement: Weak-Key Eligibility Evaluation
The system SHALL evaluate accumulated key attempt statistics per input mode to determine eligibility as a confirmed weak key based on minimum sample size and error rate thresholds.

#### Scenario: Insufficient attempt sample size
- **WHEN** a key has fewer than 10 total keystroke attempts recorded in historical statistics
- **THEN** the system marks the key status as INSUFFICIENT_DATA and excludes it from confirmed weak keys regardless of error rate

#### Scenario: Error rate below threshold
- **WHEN** a key has 10 or more total attempts but an error rate strictly below 20% (0.20)
- **THEN** the system classifies the key as normal/mastered and excludes it from confirmed weak keys

#### Scenario: Confirmed weak key qualification
- **WHEN** a key has 10 or more total attempts and an error rate of 20% (0.20) or higher
- **THEN** the system designates the key as a confirmed weak key eligible for adaptive training prioritization

### Requirement: Deterministic Weak-Key Priority Ranking
The system SHALL compute a composite priority score for each confirmed weak key combining error rate, error frequency, sample volume, and recency, sorting primarily by composite score and applying explicit secondary tie-breakers only upon exact score ties.

#### Scenario: Primary sorting by composite priority score
- **WHEN** multiple keys qualify as confirmed weak keys
- **THEN** the system computes the composite priority score for each key ($\text{Priority} = 0.60 \times \text{ErrorRate} + 0.20 \times \text{NormAttempts} + 0.20 \times \text{Recency}$) and sorts all candidates strictly by composite priority score descending

#### Scenario: Identical composite score tie-breaking
- **WHEN** two or more confirmed weak keys produce identical composite priority scores under 6-decimal quantization ($\text{round}(\text{Priority} \times 10^6)$, ensuring mathematical transitivity and cycle-free total ordering)
- **THEN** the system resolves the tie using explicit deterministic criteria in order: (1) higher error rate descending (quantized to 6 decimal places), (2) higher total attempts descending, and (3) alphabetical Unicode code point ascending of the key character

#### Scenario: Zero attempts or corrupted metric protection
- **WHEN** a key entry contains zero attempts, negative numbers, or non-finite values
- **THEN** the system safely defaults errorRate to 0, prevents NaN or Infinity generation, and classifies the entry as INSUFFICIENT_DATA

### Requirement: Weighted Lesson Selection Without Replacement
The system SHALL dynamically assemble a 10-lesson practice sequence from the active mode and difficulty pool, weighting lessons by target weak-key coverage and recency without in-round duplication.

#### Scenario: Higher probability for high-priority weak keys
- **WHEN** selecting lessons for a confirmed weak-key set
- **THEN** lessons containing higher-priority weak keys receive strictly higher selection weight than lessons containing lower-priority or non-target keys

#### Scenario: Multi-key coverage bonus
- **WHEN** a candidate lesson contains two or more distinct target weak keys
- **THEN** the system increases the lesson selection weight proportionally to its cumulative weak-key coverage

#### Scenario: Seeded deterministic selection reproducibility
- **WHEN** weighted lesson selection is executed with a fixed pseudo-random number generator (PRNG) seed
- **THEN** the system produces an identical sequence of lessons across repeated executions with identical inputs

#### Scenario: In-round lesson deduplication
- **WHEN** a practice round is generated
- **THEN** candidate pool is deduplicated by unique lesson identity (first occurrence wins), and every lesson in the returned round possesses a distinct lesson ID with zero duplicates

#### Scenario: Graceful handling of small vocabulary pools
- **WHEN** the matching candidate lessons in the pool total fewer than 10 entries (e.g. only 3 matching words available)
- **THEN** the system returns all available unique matches and backfills from the general mode/difficulty pool without entering infinite loops or duplicating entries

#### Scenario: Cycle boundary deduplication
- **WHEN** consecutive practice rounds are generated and candidate pool size exceeds 1
- **THEN** the first lesson of the new cycle must not match the final lesson of the preceding cycle; boundary deduplication strictly takes precedence over first-lesson weak-key targeting preferences, while allowing the preceding final lesson to appear in subsequent slots

### Requirement: Input Mode Isolation and Difficulty Filtering
The system SHALL isolate weak-key statistics by Mode (`en`, `pinyin`, `zhuyin`), while filtering candidate practice lessons strictly by the active session's Difficulty tier and Mode.

#### Scenario: Mode-specific lesson pool filtering
- **WHEN** adaptive lessons are generated for English mode with intermediate difficulty
- **THEN** only lessons from the English intermediate vocabulary pool are evaluated, with zero intrusion of other modes or difficulty tiers

#### Scenario: Untagged or missing metadata lesson handling
- **WHEN** candidate practice lessons lack explicit mode or difficulty metadata
- **THEN** the system rejects untagged entries by default to prevent cross-mode pollution, unless the caller explicitly supplies a trusted fallback metadata context

#### Scenario: Mode-specific weak-key statistics isolation
- **WHEN** weak-key analysis is conducted for a given mode
- **THEN** key attempts and errors from other modes are strictly ignored; weak-key records are stored per mode in `tritype.weakkeys.v1.${mode}` and shared across difficulty levels within that mode

### Requirement: Zhuyin First-Tone Space Key Eligibility
The system SHALL treat the physical Space key (' ') representing the first tone (陰平) in Traditional Chinese Zhuyin as a first-class candidate for weak-key analysis and adaptive selection.

#### Scenario: Space key identified as weak key
- **WHEN** the physical Space key in Zhuyin mode exceeds 10 attempts and 20% error rate
- **THEN** the system flags Space (' ') as a confirmed weak key and selects Zhuyin lessons whose runtime derived answer requires first-tone Space

#### Scenario: Runtime answer derivation matching
- **WHEN** matching candidate Zhuyin lessons against target weak keys
- **THEN** the system evaluates matches against the runtime tone-derived answer (e.g. 'ㄓㄨㄥ ㄨˇ' for '中午') rather than unformatted raw vocabulary fields
