import { IClock } from './types';

export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }
}

export class MockClock implements IClock {
  private _time: number;

  constructor(initialTime = 0) {
    this._time = initialTime;
  }

  now(): number {
    return this._time;
  }

  advance(ms: number): void {
    this._time += ms;
  }

  set(time: number): void {
    this._time = time;
  }
}

export function createMockClock(initialTime = 0): MockClock {
  return new MockClock(initialTime);
}

export function createSystemClock(): SystemClock {
  return new SystemClock();
}
