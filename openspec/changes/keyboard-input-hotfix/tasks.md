# Tasks: Keyboard Input & Focus Resiliency Hotfix

- [x] Phase 1: Root Cause Investigation (document focus unmounting, IME composition, keydown routing)
- [x] Phase 2: TDD RED — Author failing unit and component tests (`tests/components/keyboard-input.test.tsx`) covering GAME-INPUT-001 through GAME-INPUT-012
- [x] Phase 2: TDD RED — Author failing Playwright E2E tests (`tests/e2e/keyboard-input.spec.ts`)
- [x] Phase 3: GREEN — Implement focus resiliency in `TypingArena.tsx` (synchronous focus on start/resume, click-to-focus arena, window key forwarding)
- [x] Phase 3: GREEN — Implement physical key code resolution in `TypingArena.tsx` / `zhuyin-map.ts`
- [x] Phase 3: GREEN — Verify IME composition handling with zero double-counting
- [x] Phase 4: Verification — Run `npm ci`, `npm run check`, `npm test`, `npm audit`, `npx playwright test` (Chromium + WebKit: 30/30 passed)
- [x] Phase 5: Delivery — Commit changes, push branch `fix/vercel-keyboard-input`, create PR, provide Vercel deployment verification plan
- [x] Phase 6: Final Keyboard Event Hardening — Deduplicate IME compositionend in Zhuyin mode (GAME-HARDEN-002)
- [x] Phase 6: Final Keyboard Event Hardening — Deduplicate window and input keydown bubbling across idle/running/paused (GAME-HARDEN-001, 006)
- [x] Phase 6: Final Keyboard Event Hardening — Filter virtual keys Process, Dead, Unidentified (GAME-HARDEN-003)
- [x] Phase 6: Final Keyboard Event Hardening — Protect form controls and browser shortcuts Cmd+C, Cmd+R, Cmd+L (GAME-HARDEN-005, 007)
- [x] Phase 7: Verification & Push — Run check, e2e, audit, push to PR #3, and await green CI
