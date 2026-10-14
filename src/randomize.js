export const parameterRanges = {
  frequency: [100, 8000, 10], amplitude: [0, 1, 0.01],
  vibratoSpeed: [0, 40, 0.1], vibratoDepth: [0, 1200, 10],
  tremoloSpeed: [0, 30, 0.1], tremoloDepth: [0, 1, 0.01],
  duration: [0.5, 5, 0.05], cutoff: [200, 20000, 100],
  pause: [0, 3, 0.05],
}

export function randomizeSettings(settings, locks, random = Math.random) {
  const next = { ...settings }
  if (!locks.shape) next.shape = ['sine', 'square', 'saw'][Math.floor(random() * 3)]
  for (const [key, [min, max, step]] of Object.entries(parameterRanges)) {
    if (locks[key]) continue
    const steps = Math.round((max - min) / step)
    next[key] = Number((min + Math.floor(random() * (steps + 1)) * step).toFixed(2))
  }
  return next
}
