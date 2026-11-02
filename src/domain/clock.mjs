/**
 * Testable Monotonic Clock Interface & Implementations
 */

export class SystemClock {
  now() {
    return Date.now();
  }
}

export class MockClock {
  constructor(initialTime = 0) {
    this._time = initialTime;
  }

  now() {
    return this._time;
  }

  advance(ms) {
    this._time += ms;
  }

  set(time) {
    this._time = time;
  }
}

export function createMockClock(initialTime = 0) {
  return new MockClock(initialTime);
}

export function createSystemClock() {
  return new SystemClock();
}
