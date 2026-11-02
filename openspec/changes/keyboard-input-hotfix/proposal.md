# Proposal: Keyboard Input & Focus Resiliency Hotfix

## Motivation
Following production deployment on Vercel, users on macOS (MacBook Pro) reported:
1. After clicking "Start Challenge" (開始挑戰), keystrokes are not registered in the input box.
2. In Traditional Chinese Zhuyin Daqian mode, pressing physical key `K` (which represents `ㄜ`) yields no visible reaction.
3. After restarting a session, input remains unresponsive.
4. Issue affects English, Pinyin, and Zhuyin modes due to lost input focus and IME composition handling nuances.

## Objective
Fix keyboard input handling across all three modes (English, Pinyin, Zhuyin) without regressions in anti-paste security, deterministic metrics, or i18n support.

## Scope
- Focus resilience: Synchronous gesture-driven auto-focus upon starting, restarting, resuming, or clicking the typing arena.
- Window-level key event forwarding: When the session is running and focus is not on another interactive control (modal/select/button), seamlessly route keystrokes to the active typing session.
- Physical keyboard mapping vs IME:
  - Support both `KeyboardEvent.key` and `KeyboardEvent.code` physical layout resolution for Daqian Zhuyin (`KeyK` -> `ㄜ`).
  - Distinguish interim IME composition (`isComposing`) from physical keystroke muscle training, preventing missing or duplicate key counts.
- Strict anti-paste preservation: paste events remain strictly prohibited (`PASTE_PROHIBITED`).
- Cross-browser validation: Verify on Chromium and WebKit browsers.
