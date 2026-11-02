# Specification — Game Session State Machine

## GS-001 State Space
The session SHALL exist in one of four states: `idle`, `running`, `paused`, `finished`.

## GS-002 Event Handling
- `START` SHALL transition from `idle` or `finished` to `running`.
- `PAUSE` SHALL transition from `running` to `paused` and record paused timestamp.
- `RESUME` SHALL transition from `paused` to `running` and accumulate paused duration.
- `RESTART` SHALL reset the session to `idle` and clear all session counters.
- `TYPE_CHAR` SHALL process keystrokes only when `status === 'running'`.
- `PASTE` SHALL be rejected in all states.
- `TICK` SHALL transition to `finished` when remaining time reaches 0.
