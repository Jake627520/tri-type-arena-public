# Test Plan: Keyboard Input & Focus Resiliency

## Scope
Validate keyboard input behavior under all operating conditions:
1. Normal typing in English, Pinyin, and Zhuyin modes.
2. Focus acquisition on click (#start), Enter key, Restart (#restart), Pause/Resume, and click-to-focus on arena.
3. Daqian Zhuyin physical key mapping (`KeyK` -> `ㄜ`, `KeyS` -> `ㄋ`, `Digit3` -> `ˇ`).
4. Typing errors, backspace correction, and streak reset.
5. Rejection of pasted content.
6. Graceful behavior during and after IME composition.
7. Unblocked typing after closing the onboarding modal.
8. UI locale switching without breaking active game inputs.

## Test Matrix
| ID | Area | Target Condition | Expected Result |
|---|---|---|---|
| GAME-INPUT-001 | Focus | Click `#start` or press Enter in idle | `#typing` is `document.activeElement` |
| GAME-INPUT-002 | Typing | English characters typed sequentially | DOM target status updates, WPM updates |
| GAME-INPUT-003 | Typing | Pinyin characters (`n`, `i`, `h`, `a`, `o`) | Target characters marked correct, word completes |
| GAME-INPUT-004 | Zhuyin | Physical key `K` pressed in Zhuyin mode | Evaluated as `ㄜ` |
| GAME-INPUT-005 | Typo | Mistyped key followed by Backspace | `typedValue` appended then truncated |
| GAME-INPUT-006 | Session | Click `#restart` then start again | Input is focused and accepts keys |
| GAME-INPUT-007 | Pause | Press Escape to pause, click Resume | Input disabled on pause, enabled & focused on resume |
| GAME-INPUT-008 | Onboarding | Dismiss onboarding dialog | All background keyboard traps removed |
| GAME-INPUT-009 | Anti-paste | Paste clipboard text | Input value unchanged, paste rejected |
| GAME-INPUT-010 | IME | Compositionstart + interim keys + compositionend | No duplicate keys counted |
| GAME-INPUT-011 | i18n | Switch UI language from zh-TW to en | Active typing unaffected |
| GAME-INPUT-012 | Activation | Mouse click vs Enter key | Both start running session with focus |
| GAME-HARDEN-001 | Deduplication | Enter key pressed on focused input | Start session triggered exactly once |
| GAME-HARDEN-002 | IME Dedup | Zhuyin mode KeyK followed by compositionend | Single 'ㄜ' recorded, no duplicate 'ㄜㄜ' |
| GAME-HARDEN-003 | Virtual Keys | Dead, Unidentified, or Process keys | Ignored unless mapped physical key |
| GAME-HARDEN-004 | Focus Recovery | Typing when activeElement is BODY | Input refocused and character accepted |
| GAME-HARDEN-005 | Form Control | Interacting with UI locale select | Focus not hijacked, Arrow/Space preserved |
| GAME-HARDEN-006 | Control Keys | Backspace, Escape, and Resume keystrokes | Executed exactly once per keystroke |
| GAME-HARDEN-007 | Shortcuts | Cmd+C, Cmd+R, Cmd+L, Ctrl+C | Native browser behavior not prevented |
| GAME-HARDEN-008 | Full IME Sequence | `compositionstart` -> `keydown [Process]` -> `compositionend` | Exactly one 'ㄜ' committed, zero duplication |
| GAME-HARDEN-009 | Anti-paste Check | Direct clipboard paste event | Rejected, zero changes to typedValue |
| GAME-HARDEN-010 | Event Count | Single keypress count before vs after | Reduced from 2 events to exactly 1 event |
