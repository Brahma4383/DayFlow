// Number of steps on a chart's value axis (0, 25, 50, 75, 100 = 4 steps)
export const TICK_COUNT = 4

// A round number at or above the largest value, so the axis reads 0, 15, 30, 45, 60 and not 0, 13, 27...
export function niceMax(largest, fallback = 100) {
  if (largest <= 0) return fallback
  const rough = largest / TICK_COUNT
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough)
  return step * TICK_COUNT
}
