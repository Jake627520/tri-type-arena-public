export interface MetricsInput {
  correctKeys?: number;
  totalKeys?: number;
  elapsedSeconds?: number;
  words?: number;
  streak?: number;
}

export interface MetricsResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  score: number;
}

export function calculateMetrics({
  correctKeys = 0,
  totalKeys = 0,
  elapsedSeconds = 0,
  words = 0,
  streak = 0,
}: MetricsInput): MetricsResult {
  if (elapsedSeconds <= 0) {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100,
      score: Math.max(0, words * 100 + streak * 10),
    };
  }

  const rawMinutes = elapsedSeconds / 60;
  const rawWpm = Math.round((correctKeys / 5) / rawMinutes);

  // Smooth ramp-up dampening for elapsedSeconds < 2.0 to avoid initial spikes
  let wpm = rawWpm;
  if (elapsedSeconds < 2.0) {
    const rampRatio = Math.max(0, elapsedSeconds / 2.0);
    const cappedBase = Math.round((correctKeys / 5) / (2.0 / 60));
    wpm = Math.round(cappedBase * rampRatio);
  }

  const accuracy = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;
  const score = Math.max(0, words * 100 + streak * 10);

  return {
    wpm,
    rawWpm,
    accuracy,
    score,
  };
}
