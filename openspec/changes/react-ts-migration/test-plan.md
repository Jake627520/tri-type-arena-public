# Test Plan — React + TypeScript Migration

| Requirement | Test Scenario | Expected Result |
|---|---|---|
| US-MIG-001 | Mock clock advancing by 15s | Session remaining time decreases by exactly 15s; WPM calculated from mock elapsed time. |
| US-MIG-002 | Shuffling lesson list with seed 12345 twice | Both shuffles yield identical prompt sequences. Different seeds yield different sequences. |
| US-MIG-003 | Attempting multi-character input jump (paste) | Input rejected or flag set; keystroke counter does not increment pasted chunk. |
| US-MIG-004 | Typing 5 correct characters in 0.5s | Raw WPM is dampened to 0 or clamped during initial 2 seconds. |
| US-MIG-005 | Typing incorrect key 'x' for expected 'c' | Typo log appends `{ expected: 'c', typed: 'x', word: 'cat' }`. |
| US-MIG-006 | State transitions: idle -> running -> paused -> running -> finished | Typing disabled while paused; timer resumes on resume; finished session cannot receive input. |
| US-MIG-007 | Compositionstart/end events | Interim composition text does not increment keystroke totals. |
