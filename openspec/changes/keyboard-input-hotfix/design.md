# Technical Design: Keyboard Input & Focus Architecture

## 1. Focus Management
### Problem
Relying solely on `useEffect` to call `inputRef.current?.focus()` fails on WebKit / Safari when the start button is clicked and unmounted, as Safari treats asynchronous focus outside an active gesture stack as untrusted or blurs to `document.body`.

### Solution
1. **Synchronous Focus in Gesture Handlers**:
   In `onStart`, `onResume`, and `onRestart` handlers in `TypingArena`, invoke `inputRef.current?.focus()` synchronously before state transition, in addition to retaining the `useEffect([state.status])` hook.
2. **Click-to-Focus Container**:
   Add an `onClick` handler on `.typing-arena` / `.target-display-card` that refocuses `#typing` if the user clicks anywhere in the arena during an active session (`status === 'running'`).
3. **Global Keystroke Redirection**:
   When `state.status === 'running'`, attach a `window.addEventListener('keydown')` listener. If the active element is not an interactive input/textarea/select/modal button, focus `#typing` and process the keystroke.

## 2. KeyboardEvent.key vs KeyboardEvent.code Contract
### Physical Layout Resolution for Zhuyin Daqian
- Standard US English keyboards report:
  - `key: 'k'`, `code: 'KeyK'`
- When macOS Zhuyin IME is selected:
  - `key: 'Process'`, `code: 'KeyK'`, `isComposing: true`
- Resolution strategy:
  In Daqian mode (`mode === 'zhuyin'`):
  - If `e.key` is a single character (`k`, `K`, `ㄜ`), resolve via `normalizeInput(e.key, 'zhuyin')`.
  - If `e.key === 'Process'` or during IME composition:
    If `e.code` matches a known Daqian key code (e.g. `'KeyK'` -> `'k'`, `'Digit3'` -> `'3'`, `'KeyS'` -> `'s'`), resolve from `e.code` so that physical blind typing training succeeds even if the user has an active CJK input source on their operating system.
  - On `compositionend`, if committed `e.data` is received, pass committed characters through `onTypeChar`.

## 3. Anti-Paste & Security
- `paste` events continue to be intercepted via `handlePaste` with `e.preventDefault()`, dispatching `{ type: 'PASTE' }` which returns `{ accepted: false, reason: 'PASTE_PROHIBITED' }`.
- User typed characters are never logged to `console.log` in production bundles.
