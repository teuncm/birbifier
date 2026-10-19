// Preserve the strongest peak in either stereo channel without phase cancellation.
export function buildWaveform(buffer, count = 180) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel))
  return Array.from({ length: count }, (_, bar) => {
    const from = Math.floor(bar * buffer.length / count)
    const to = Math.floor((bar + 1) * buffer.length / count)
    let peak = 0
    for (const channel of channels) {
      for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(channel[i]))
    }
    return Math.max(1, peak * 600)
  })
}
