// Playback and offline preview/export share this small Web Audio graph.
export const defaultSettings = {
  shape: 'sine', frequency: 2400, amplitude: 0.5,
  vibratoSpeed: 8, vibratoDepth: 180,
  tremoloSpeed: 6, tremoloDepth: 0.45,
  duration: 0.8, cutoff: 8000, pause: 0.2,
}
export const presets = [
  { name: 'Little chirp', settings: defaultSettings },
  { name: 'Forest trill', settings: { ...defaultSettings, frequency: 3200, vibratoSpeed: 22, vibratoDepth: 420, tremoloSpeed: 18, tremoloDepth: 0.85, duration: 1.2, cutoff: 6000 } },
  { name: 'Soft coo', settings: { ...defaultSettings, frequency: 480, vibratoSpeed: 3, vibratoDepth: 90, tremoloSpeed: 2, tremoloDepth: 0.3, duration: 1.6, cutoff: 2200 } },
  { name: 'Bright whistle', settings: { ...defaultSettings, frequency: 3800, amplitude: 0.4, vibratoSpeed: 5, vibratoDepth: 60, tremoloSpeed: 0, tremoloDepth: 0, duration: 0.65, cutoff: 12000 } },
  { name: 'Warbling finch', settings: { ...defaultSettings, frequency: 1900, amplitude: 0.45, vibratoSpeed: 12, vibratoDepth: 600, tremoloSpeed: 9, tremoloDepth: 0.35, duration: 1.1, cutoff: 7000 } },
  { name: 'Evening dove', settings: { ...defaultSettings, frequency: 320, amplitude: 0.6, vibratoSpeed: 1.5, vibratoDepth: 140, tremoloSpeed: 1.5, tremoloDepth: 0.65, duration: 2.5, cutoff: 1200 } },
  { name: 'Chattering sparrow', settings: { ...defaultSettings, shape: 'square', frequency: 1600, amplitude: 0.3, vibratoSpeed: 28, vibratoDepth: 220, tremoloSpeed: 24, tremoloDepth: 0.95, duration: 0.75, cutoff: 3800 } },
  { name: 'Reedy call', settings: { ...defaultSettings, shape: 'saw', frequency: 1100, amplitude: 0.4, vibratoSpeed: 6, vibratoDepth: 120, tremoloSpeed: 4, tremoloDepth: 0.25, duration: 1.4, cutoff: 2800 } },
  { name: 'Tiny peep', settings: { ...defaultSettings, frequency: 5600, amplitude: 0.3, vibratoSpeed: 10, vibratoDepth: 80, tremoloSpeed: 8, tremoloDepth: 0.2, duration: 0.5, cutoff: 16000 } },
  { name: 'Meadow song', settings: { ...defaultSettings, frequency: 2800, amplitude: 0.45, vibratoSpeed: 16, vibratoDepth: 350, tremoloSpeed: 5, tremoloDepth: 0.8, duration: 3.2, cutoff: 9000 } },
  { name: 'Owl hoot', settings: { ...defaultSettings, frequency: 220, amplitude: 0.65, vibratoSpeed: 2, vibratoDepth: 60, tremoloSpeed: 1, tremoloDepth: 0.4, duration: 1.5, cutoff: 900, pause: 0.8 } },
  { name: 'Canary flutter', settings: { ...defaultSettings, frequency: 4200, amplitude: 0.35, vibratoSpeed: 32, vibratoDepth: 280, tremoloSpeed: 16, tremoloDepth: 0.7, duration: 1.8, cutoff: 11000, pause: 0.35 } },
  { name: 'Robin whistle', settings: { ...defaultSettings, frequency: 2100, amplitude: 0.5, vibratoSpeed: 4, vibratoDepth: 160, tremoloSpeed: 3, tremoloDepth: 0.15, duration: 0.9, cutoff: 8500, pause: 0.5 } },
  { name: 'Wren chatter', settings: { ...defaultSettings, shape: 'square', frequency: 2900, amplitude: 0.25, vibratoSpeed: 35, vibratoDepth: 500, tremoloSpeed: 27, tremoloDepth: 0.9, duration: 1.3, cutoff: 5000, pause: 0.25 } },
  { name: 'Blackbird warble', settings: { ...defaultSettings, frequency: 1400, amplitude: 0.55, vibratoSpeed: 7, vibratoDepth: 480, tremoloSpeed: 4.5, tremoloDepth: 0.55, duration: 2.2, cutoff: 6500, pause: 0.6 } },
  { name: 'Swallow twitter', settings: { ...defaultSettings, frequency: 4800, amplitude: 0.3, vibratoSpeed: 24, vibratoDepth: 700, tremoloSpeed: 20, tremoloDepth: 0.8, duration: 0.6, cutoff: 14000, pause: 0.15 } },
  { name: 'Cuckoo pulse', settings: { ...defaultSettings, frequency: 650, amplitude: 0.55, vibratoSpeed: 2.5, vibratoDepth: 240, tremoloSpeed: 2.5, tremoloDepth: 1, duration: 1.6, cutoff: 2400, pause: 0.7 } },
  { name: 'Lark trill', settings: { ...defaultSettings, frequency: 3500, amplitude: 0.4, vibratoSpeed: 18, vibratoDepth: 550, tremoloSpeed: 12, tremoloDepth: 0.6, duration: 2.8, cutoff: 10000, pause: 0.4 } },
  { name: 'Chickadee peep', settings: { ...defaultSettings, frequency: 5100, amplitude: 0.35, vibratoSpeed: 6, vibratoDepth: 40, tremoloSpeed: 5, tremoloDepth: 0.4, duration: 0.55, cutoff: 15000, pause: 0.3 } },
  { name: 'Crane call', settings: { ...defaultSettings, shape: 'saw', frequency: 780, amplitude: 0.4, vibratoSpeed: 4, vibratoDepth: 170, tremoloSpeed: 2, tremoloDepth: 0.35, duration: 2, cutoff: 2000, pause: 0.9 } },
  { name: 'Goldfinch ripple', settings: { ...defaultSettings, frequency: 2600, amplitude: 0.45, vibratoSpeed: 14, vibratoDepth: 800, tremoloSpeed: 7, tremoloDepth: 0.5, duration: 1.7, cutoff: 9500, pause: 0.25 } },
  { name: 'Woodland buzz', settings: { ...defaultSettings, shape: 'saw', frequency: 1800, amplitude: 0.3, vibratoSpeed: 40, vibratoDepth: 100, tremoloSpeed: 30, tremoloDepth: 0.3, duration: 1, cutoff: 3400, pause: 0.4 } },
  { name: 'Waterbird murmur', settings: { ...defaultSettings, frequency: 390, amplitude: 0.6, vibratoSpeed: 5.5, vibratoDepth: 200, tremoloSpeed: 3.5, tremoloDepth: 0.75, duration: 2.4, cutoff: 1400, pause: 0.65 } },
  { name: 'Dawn chorus', settings: { ...defaultSettings, frequency: 2300, amplitude: 0.5, vibratoSpeed: 9.5, vibratoDepth: 1000, tremoloSpeed: 6.5, tremoloDepth: 0.9, duration: 4, cutoff: 8000, pause: 0.5 } },
  { name: 'Night song', settings: { ...defaultSettings, frequency: 1200, amplitude: 0.45, vibratoSpeed: 3.5, vibratoDepth: 320, tremoloSpeed: 1.5, tremoloDepth: 0.5, duration: 3.5, cutoff: 4200, pause: 1.2 } },
  { name: 'Glasswing', settings: { ...defaultSettings, frequency: 6200, amplitude: 0.3, vibratoSpeed: 2.5, vibratoDepth: 30, tremoloSpeed: 4, tremoloDepth: 0.35, duration: 0.7, cutoff: 18000, pause: 0.45 } },
  { name: 'Bubblebird', settings: { ...defaultSettings, frequency: 850, amplitude: 0.55, vibratoSpeed: 8.5, vibratoDepth: 1100, tremoloSpeed: 8.5, tremoloDepth: 0.75, duration: 0.85, cutoff: 3800, pause: 0.15 } },
  { name: 'Copper finch', settings: { ...defaultSettings, shape: 'saw', frequency: 2250, amplitude: 0.4, vibratoSpeed: 11, vibratoDepth: 260, tremoloSpeed: 13, tremoloDepth: 0.55, duration: 1.15, cutoff: 5500, pause: 0.35 } },
  { name: 'Space gull', settings: { ...defaultSettings, frequency: 950, amplitude: 0.5, vibratoSpeed: 0.7, vibratoDepth: 1200, tremoloSpeed: 0.7, tremoloDepth: 0.65, duration: 3, cutoff: 5000, pause: 0.8 } },
  { name: 'Pixel robin', settings: { ...defaultSettings, shape: 'square', frequency: 3300, amplitude: 0.25, vibratoSpeed: 15, vibratoDepth: 60, tremoloSpeed: 10, tremoloDepth: 1, duration: 0.6, cutoff: 8000, pause: 0.2 } },
  { name: 'Moon owl', settings: { ...defaultSettings, frequency: 150, amplitude: 0.7, vibratoSpeed: 0.5, vibratoDepth: 350, tremoloSpeed: 0.5, tremoloDepth: 0.8, duration: 4.5, cutoff: 700, pause: 1.5 } },
  { name: 'Velvet thrush', settings: { ...defaultSettings, frequency: 1050, amplitude: 0.55, vibratoSpeed: 5, vibratoDepth: 70, tremoloSpeed: 0.8, tremoloDepth: 0.25, duration: 2.6, cutoff: 3000, pause: 0.7 } },
  { name: 'Rainforest ping', settings: { ...defaultSettings, frequency: 4500, amplitude: 0.35, vibratoSpeed: 2, vibratoDepth: 120, tremoloSpeed: 7, tremoloDepth: 0.8, duration: 0.5, cutoff: 13000, pause: 0.55 } },
  { name: 'Reedbed rattle', settings: { ...defaultSettings, shape: 'square', frequency: 720, amplitude: 0.35, vibratoSpeed: 17, vibratoDepth: 160, tremoloSpeed: 30, tremoloDepth: 1, duration: 1.9, cutoff: 2400, pause: 0.3 } },
  { name: 'Alpine echo', settings: { ...defaultSettings, frequency: 2700, amplitude: 0.5, vibratoSpeed: 1.2, vibratoDepth: 200, tremoloSpeed: 2, tremoloDepth: 1, duration: 2, cutoff: 9000, pause: 1 } },
  { name: 'Ruby hummingbird', settings: { ...defaultSettings, frequency: 5400, amplitude: 0.3, vibratoSpeed: 38, vibratoDepth: 200, tremoloSpeed: 29, tremoloDepth: 0.55, duration: 0.95, cutoff: 17000, pause: 0.1 } },
  { name: 'Pocket robot', settings: { ...defaultSettings, shape: 'square', frequency: 1250, amplitude: 0.3, vibratoSpeed: 20, vibratoDepth: 1200, tremoloSpeed: 15, tremoloDepth: 0.85, duration: 0.8, cutoff: 5000, pause: 0.2 } },
  { name: 'Cricket cousin', settings: { ...defaultSettings, shape: 'saw', frequency: 6800, amplitude: 0.35, vibratoSpeed: 36, vibratoDepth: 40, tremoloSpeed: 26, tremoloDepth: 0.95, duration: 1.25, cutoff: 19000, pause: 0.3 } },
  { name: 'Marsh tremble', settings: { ...defaultSettings, frequency: 570, amplitude: 0.6, vibratoSpeed: 13, vibratoDepth: 450, tremoloSpeed: 11, tremoloDepth: 0.7, duration: 1.45, cutoff: 1900, pause: 0.4 } },
  { name: 'Sea whistle', settings: { ...defaultSettings, frequency: 3100, amplitude: 0.4, vibratoSpeed: 0.4, vibratoDepth: 900, tremoloSpeed: 1.2, tremoloDepth: 0.2, duration: 4.2, cutoff: 11000, pause: 0.9 } },
  { name: 'Solar flare', settings: { ...defaultSettings, shape: 'saw', frequency: 4000, amplitude: 0.35, vibratoSpeed: 30, vibratoDepth: 650, tremoloSpeed: 22, tremoloDepth: 0.45, duration: 0.65, cutoff: 14000, pause: 0.25 } },
  { name: 'Mossy bass', settings: { ...defaultSettings, shape: 'saw', frequency: 180, amplitude: 0.65, vibratoSpeed: 2.2, vibratoDepth: 80, tremoloSpeed: 3, tremoloDepth: 0.6, duration: 2.1, cutoff: 600, pause: 0.6 } },
  { name: 'Helium canary', settings: { ...defaultSettings, frequency: 7400, amplitude: 0.3, vibratoSpeed: 19, vibratoDepth: 320, tremoloSpeed: 14, tremoloDepth: 0.6, duration: 0.75, cutoff: 20000, pause: 0.2 } },
  { name: 'Comet trill', settings: { ...defaultSettings, frequency: 3700, amplitude: 0.4, vibratoSpeed: 27, vibratoDepth: 950, tremoloSpeed: 9, tremoloDepth: 0.85, duration: 2.3, cutoff: 15000, pause: 0.45 } },
  { name: 'Silver bell', settings: { ...defaultSettings, frequency: 1750, amplitude: 0.5, vibratoSpeed: 0, vibratoDepth: 0, tremoloSpeed: 0.9, tremoloDepth: 0.9, duration: 1, cutoff: 7000, pause: 0.8 } },
  { name: 'Rusty gate', settings: { ...defaultSettings, shape: 'saw', frequency: 430, amplitude: 0.4, vibratoSpeed: 0.8, vibratoDepth: 1000, tremoloSpeed: 23, tremoloDepth: 0.65, duration: 2.75, cutoff: 1800, pause: 0.75 } },
  { name: 'Tiny UFO', settings: { ...defaultSettings, frequency: 4600, amplitude: 0.35, vibratoSpeed: 9, vibratoDepth: 1200, tremoloSpeed: 4.5, tremoloDepth: 0.5, duration: 1.35, cutoff: 16000, pause: 0.3 } },
  { name: 'Flute call', settings: { ...defaultSettings, frequency: 880, amplitude: 0.6, vibratoSpeed: 5.5, vibratoDepth: 40, tremoloSpeed: 5.5, tremoloDepth: 0.1, duration: 1.8, cutoff: 4000, pause: 0.55 } },
  { name: 'Electric flock', settings: { ...defaultSettings, shape: 'square', frequency: 2400, amplitude: 0.3, vibratoSpeed: 12.7, vibratoDepth: 700, tremoloSpeed: 17.3, tremoloDepth: 0.8, duration: 2.65, cutoff: 7500, pause: 0.35 } },
  { name: 'Radio birb', settings: { ...defaultSettings, shape: 'square', frequency: 2050, amplitude: 0.3, vibratoSpeed: 39, vibratoDepth: 110, tremoloSpeed: 6, tremoloDepth: 0.95, duration: 1.05, cutoff: 4500, pause: 0.25 } },
]
export function createVoice(context, settings, destination = context.destination, onEnded = () => {}) {
  const wave = context.createOscillator()
  const vibrato = context.createOscillator()
  const vibratoGain = context.createGain()
  const tremolo = context.createOscillator()
  const tremoloGain = context.createGain()
  const amplitude = context.createGain()
  const modulation = context.createGain()
  const filter = context.createBiquadFilter()
  const envelope = context.createGain()
  const nodes = [wave, vibrato, vibratoGain, tremolo, tremoloGain, amplitude, modulation, filter, envelope]
  const start = context.currentTime
  const end = start + settings.duration
  let stopping = false
  wave.connect(amplitude).connect(modulation).connect(filter).connect(envelope).connect(destination)
  vibrato.connect(vibratoGain).connect(wave.detune)
  tremolo.connect(tremoloGain).connect(modulation.gain)
  filter.type = 'lowpass'
  filter.Q.value = 0.707
  // Short fades avoid clicks; fixed headroom keeps playback gentle.
  envelope.gain.setValueAtTime(0, start)
  envelope.gain.linearRampToValueAtTime(0.25, start + 0.015)
  envelope.gain.setValueAtTime(0.25, end - 0.035)
  envelope.gain.linearRampToValueAtTime(0, end)
  function update(next, immediate = false) {
    wave.type = next.shape === 'saw' ? 'sawtooth' : next.shape
    const set = (param, value) => immediate
      ? param.setValueAtTime(value, context.currentTime)
      : param.setTargetAtTime(value, context.currentTime, 0.015)
    set(wave.frequency, next.frequency)
    set(amplitude.gain, next.amplitude)
    set(vibrato.frequency, next.vibratoSpeed)
    set(vibratoGain.gain, next.vibratoDepth)
    set(tremolo.frequency, next.tremoloSpeed)
    set(tremoloGain.gain, next.tremoloDepth / 2)
    set(modulation.gain, 1 - next.tremoloDepth / 2)
    set(filter.frequency, Math.min(next.cutoff, context.sampleRate / 2))
  }
  update(settings, true)
  wave.onended = () => {
    nodes.forEach(node => node.disconnect())
    onEnded()
  }
  for (const oscillator of [wave, vibrato, tremolo]) {
    oscillator.start(start)
    oscillator.stop(end)
  }
  return {
    update,
    stop() {
      if (stopping) return
      stopping = true
      const now = context.currentTime
      const currentGain = envelope.gain.value
      envelope.gain.cancelScheduledValues(now)
      envelope.gain.setValueAtTime(currentGain, now)
      envelope.gain.linearRampToValueAtTime(0, now + 0.015)
      for (const oscillator of [wave, vibrato, tremolo]) oscillator.stop(Math.min(end, now + 0.02))
    },
  }
}
export async function renderSong(settings) {
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  if (!OfflineContext) throw new Error('Audio preview is unavailable in this browser.')
  const context = new OfflineContext(1, Math.ceil(settings.duration * 44100), 44100)
  createVoice(context, settings)
  return context.startRendering()
}
export function toWav(buffer) {
  const samples = buffer.getChannelData(0)
  const bytes = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(bytes)
  const write = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, bytes.byteLength - 8, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true))
  return new Blob([bytes], { type: 'audio/wav' })
}
