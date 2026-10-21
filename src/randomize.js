export const MIN_AMPLITUDE = 10 ** (-10 / 20)
export const parameterRanges = {
  frequency: [250, 8000, 10], amplitude: [MIN_AMPLITUDE, 1, 0.01],
  vibratoFrequency: [0, 30, 0.1], vibratoDepth: [0, 1200, 10],
  tremoloFrequency: [0, 30, 0.1], tremoloDepth: [0, 1, 0.01],
  duration: [0.5, 2, 0.05], cutoff: [250, 15000, 50],
  pause: [0, 1, 0.05],
  chorus: [0, 1, 0.01],
}
// Pick vibrato depth before pitch, then choose the cutoff from their combined range.
const randomizeKeys = [...Object.keys(parameterRanges).filter(key => key !== 'frequency' && key !== 'cutoff'), 'frequency', 'cutoff']

export function randomizeSettings(settings, locks, random = Math.random) {
  const next = { ...settings }
  if (!locks.shape) next.shape = ['sine', 'square', 'saw'][Math.floor(random() * 3)]
  for (const key of randomizeKeys) {
    if (locks[key]) continue
    const [lower, upper, step] = parameterRanges[key]
    const pitchRatio = 2 ** (-next.vibratoDepth / 1200)
    let min = key === 'cutoff' ? Math.max(lower, Math.ceil(next.frequency * pitchRatio / step) * step) : lower
    if (key === 'vibratoDepth' && locks.frequency && locks.cutoff) {
      const needed = Math.max(0, 1200 * Math.log2(next.frequency / next.cutoff))
      min = Math.min(upper, Math.ceil(needed / step) * step)
    }
    const max = key === 'frequency' && locks.cutoff ? Math.max(min, Math.min(upper, next.cutoff / pitchRatio)) : upper
    const steps = Math.floor((max - min) / step + 1e-9)
    next[key] = Number((min + Math.floor(random() * (steps + 1)) * step).toFixed(2))
  }
  return next
}
