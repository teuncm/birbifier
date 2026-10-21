// Preserve the strongest peak in either stereo channel without phase cancellation.
const waveformCache = new WeakMap()
export function buildWaveform(buffer, count = 180) {
  let cached = waveformCache.get(buffer)
  if (cached?.has(count)) return cached.get(count)
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel))
  const bars = Array.from({ length: count }, (_, bar) => {
    const from = Math.floor(bar * buffer.length / count)
    const to = Math.floor((bar + 1) * buffer.length / count)
    let peak = 0
    for (const channel of channels) {
      for (let i = from; i < to; i++) {
        const magnitude = Math.abs(channel[i])
        if (magnitude > peak) peak = magnitude
      }
    }
    return Math.max(1, peak * 600)
  })
  if (!cached) { cached = new Map(); waveformCache.set(buffer, cached) }
  if (cached.size >= 2) cached.delete(cached.keys().next().value)
  cached.set(count, bars)
  return bars
}
