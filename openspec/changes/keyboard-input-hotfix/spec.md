# Specification: Keyboard Input & Focus Resiliency (GAME-INPUT)

## Acceptance Criteria

- **GAME-INPUT-001 (Auto-Focus on Start)**:
  When the user starts the challenge (via mouse click or keyboard Enter), `#typing` must acquire `document.activeElement`.

- **GAME-INPUT-002 (English Mode Responsiveness)**:
  In English mode, valid single-key inputs must immediately update `typedValue` and the target character DOM status.

- **GAME-INPUT-003 (Pinyin Mode Responsiveness)**:
  In Pinyin mode, valid single-key inputs (e.g. `n`, `i`, `h`, `a`, `o`) must immediately update `typedValue` and target characters.

- **GAME-INPUT-004 (Daqian Zhuyin K -> ㄜ)**:
  In Zhuyin mode, striking physical key `K` (`e.code === 'KeyK'` or `e.key === 'k'`) must map to `ㄜ` and be evaluated against the current lesson.

- **GAME-INPUT-005 (Error Display & Backspace Correction)**:
  Invalid / mistyped characters must be appended to `typedValue`, highlighted with error styling, recorded as typos, and be removable via `Backspace`.

- **GAME-INPUT-006 (Restart Flow Resiliency)**:
  Restarting a session (via `#restart`) resets state cleanly and allows immediate typing after starting again.

- **GAME-INPUT-007 (Pause and Resume)**:
  Pressing `Escape` pauses the session and disables input; resuming (via Resume button, Space, or Enter) restores focus and typing capability.

- **GAME-INPUT-008 (Onboarding Unblocking)**:
  When the onboarding guide is dismissed (via Skip, Finish, or Backdrop click), background keyboard event traps must be completely removed.

- **GAME-INPUT-009 (Strict Anti-Cheat Paste Rejection)**:
  Clipboard paste attempts into the typing input must remain strictly rejected with zero state modification.

- **GAME-INPUT-010 (IME Composition Handling)**:
  During IME composition (`isComposing === true`), interim non-finalized keystrokes must not produce spurious duplicate keys or corrupt session metrics.

- **GAME-INPUT-011 (Locale Independence)**:
  Switching UI language (`zh-TW`, `zh-CN`, `en`) must not interfere with typing input, mode configurations, or keyboard listeners.

- **GAME-INPUT-012 (Dual Trigger Activation)**:
  Both mouse click on `#start` and pressing `Enter` in idle state must successfully start the challenge and focus `#typing`.

- **GAME-HARDEN-001 (Start Trigger Deduplication)**:
  Pressing Enter on `#typing` in idle state triggers start exactly once without duplicate event dispatch.

- **GAME-HARDEN-002 (IME Composition Deduplication)**:
  In Zhuyin mode, physical keystrokes (`KeyK` -> `ㄜ`) processed on `keydown` must NOT be duplicated when macOS CJK IME subsequently emits `compositionend`.

- **GAME-HARDEN-003 (Invalid Key Filtering)**:
  Virtual keys `Process`, `Dead`, and `Unidentified` must never be evaluated as valid characters in English, Pinyin, or Zhuyin modes unless mapped by physical key code.

- **GAME-HARDEN-004 (Focus Recovery on Lost Focus)**:
  During an active running session, if focus moves to `BODY` (e.g. background click), typing a key on the window recovers input focus and records the keystroke.

- **GAME-HARDEN-005 (Form Control Non-Interference)**:
  Interacting with `<select>` (UI locale selector), `<textarea>`, or other non-game inputs must not be intercepted or hijacked by global window keydown listeners.

- **GAME-HARDEN-006 (Control Key Deduplication)**:
  `Backspace`, `Escape` (pause), and `Enter`/`Space` (resume) must execute strictly once per physical keystroke without bubbling duplication.

- **GAME-HARDEN-007 (Browser Shortcut Bypass)**:
  Browser shortcuts (`Cmd+C`, `Cmd+R`, `Cmd+L`, `Ctrl+C`, etc.) must not be intercepted or default-prevented by the game.

- **GAME-HARDEN-008 (Full IME Lifecycle in Zhuyin Mode)**:
  The complete IME event sequence (`compositionstart` -> `keydown [Process/KeyK]` -> `compositionend [ㄜ]`) in Zhuyin mode emits exactly one character without duplication or session corruption.

- **GAME-HARDEN-009 (Anti-Paste Integrity)**:
  Anti-cheat paste rejection must remain strictly non-degraded, ensuring multi-character paste attempts are blocked with zero session modification.

- **GAME-HARDEN-010 (Event Count Invariant 1:1)**:
  Each single physical keystroke produces strictly one game input event across all modes, eliminating the 2-event duplication flaw previously observed.
