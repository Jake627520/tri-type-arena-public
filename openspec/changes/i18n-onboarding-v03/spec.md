# Requirements
- I18N-001: UI locale is independent of practice mode; 3x3 mode matrix is supported.
- I18N-002: browser language determines first use, persisted explicit selection takes priority.
- I18N-003: every visible UI string, aria-label, placeholder, result and statistics label is localized.
- I18N-004: unsupported locale falls back to English; zh-Hans and zh-CN map to simplified, other zh to traditional.
- GUIDE-001: first visit presents three-step keyboard-accessible guide, skip and replay available.
- GUIDE-002: no account required; locale and guide state stored locally and gracefully tolerate denied storage.
- GUIDE-003: guide must manage keyboard focus, return focus to opener, and block background interaction while open.
- REG-001: all existing 59 tests remain passing; add coverage for locale persistence, 3x3 matrix, guide, errors, and accessibility.
