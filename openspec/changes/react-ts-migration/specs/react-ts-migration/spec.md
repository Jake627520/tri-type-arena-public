# Normative Specification — React + TypeScript Migration

## US-MIG-001 Injected Clock & Determinism
The domain engine SHALL accept an injected `Clock` provider with method `now(): number`. All time elapsed, timer deadlines, and WPM rates SHALL derive strictly from the clock provider.

## US-MIG-002 Seedable PRNG & Reproducible Prompt Ordering
Given an identical random seed, the lesson prompt shuffler SHALL produce the exact same sequence of words. When no seed is provided, a randomized session SHALL be initialized.

## US-MIG-003 Anti-Cheat & Keystroke Integrity
The application SHALL reject pasted text into the typing arena. Only sequential single-character additions or backspace corrections SHALL be processed.

## US-MIG-004 WPM Spike Dampening
For sessions with elapsed time less than 2.0 seconds, raw WPM spikes SHALL be clamped or dampened to avoid transient values (e.g. >200 WPM on a single 3-letter word).

## US-MIG-005 Typo Tracking & Review
Every mistyped character SHALL be recorded with `{ expected: string, typed: string, word: string, timestamp: number }`. Upon session completion, the application SHALL display a review of erroneous keys.

## US-MIG-006 GameSession State Machine & Pause/Resume
The game session SHALL implement finite states: `idle`, `running`, `paused`, `finished`.
- In `idle`, user may switch language mode, duration, or seed.
- In `running`, typing events advance progress and record metrics.
- In `paused`, clock countdown halts and typing input is blocked.
- In `finished`, input is permanently disabled and score is finalized.

## US-MIG-007 Separation of Phonetic Keystroke Trainer vs OS IME
The application SHALL explicitly document and visually distinguish Daqian/Pinyin key-sequence practice from native OS IME candidate selection.
Interim composition events (`compositionstart`, `compositionupdate`) SHALL NOT be scored as raw keystrokes.
