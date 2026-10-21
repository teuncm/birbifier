export const MIN_AMPLITUDE = 10 ** (-10 / 20)
export const parameterRanges = {
  frequency: [300, 8000, 10], amplitude: [MIN_AMPLITUDE, 1, 0.01],
  vibratoFrequency: [0, 30, 0.1], vibratoDepth: [0, 1200, 10],
  tremoloFrequency: [0, 30, 0.1], tremoloDepth: [0, 1, 0.01],
  duration: [0.5, 2, 0.05], cutoff: [300, 15000, 100],
  pause: [0, 1, 0.05],
  chorus: [0.3, 0.5, 0.01],
}

export function randomizeSettings(settings, locks, random = Math.random) {
  const next = { ...settings }
  if (!locks.shape) next.shape = ['sine', 'square', 'saw'][Math.floor(random() * 3)]
  for (const [key, [lower, upper, step]] of Object.entries(parameterRanges)) {
    if (locks[key]) continue
    // Respect a locked cutoff by keeping new pitches below it. Otherwise,
    // sample the cutoff above the newly chosen (or locked) wave frequency.
    const min = key === 'cutoff' ? Math.max(lower, Math.ceil(next.frequency / step) * step) : lower
    const max = key === 'frequency' && locks.cutoff ? Math.max(min, Math.min(upper, next.cutoff)) : upper
    const steps = Math.floor((max - min) / step + 1e-9)
    next[key] = Number((min + Math.floor(random() * (steps + 1)) * step).toFixed(2))
  }
  return next
}
