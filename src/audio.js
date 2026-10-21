// Playback and offline preview/export share this small Web Audio graph.
export const PRESET_RMS = 0.05
export const defaultSettings = {
  shape: 'sine', frequency: 2400, amplitude: 0.45,
  vibratoFrequency: 8, vibratoDepth: 180,
  tremoloFrequency: 6, tremoloDepth: 0.45,
  duration: 0.8, cutoff: 8000, pause: 0.2,
  chorus: 0.3,
}
// Amplitudes calibrated over each active chirp at 44.1 kHz, with effects enabled,
// to PRESET_RMS; effect tails are excluded from the measurement.
// Keep these as editable amplitudes, so manual volume changes remain predictable.
export const presets = [
  { name: 'Little chirp', settings: defaultSettings },
  { name: 'Forest trill', settings: { ...defaultSettings, amplitude: 0.48, frequency: 3200, vibratoFrequency: 22, vibratoDepth: 420, tremoloFrequency: 18, tremoloDepth: 0.85, duration: 1.2, cutoff: 6000 } },
  { name: 'Soft coo', settings: { ...defaultSettings, amplitude: 0.43, frequency: 480, vibratoFrequency: 3, vibratoDepth: 90, tremoloFrequency: 2, tremoloDepth: 0.3, duration: 1.6, cutoff: 2200 } },
  { name: 'Bright whistle', settings: { ...defaultSettings, frequency: 3800, amplitude: 0.34, vibratoFrequency: 5, vibratoDepth: 60, tremoloFrequency: 0, tremoloDepth: 0, duration: 0.65, cutoff: 10000 } },
  { name: 'Warbling finch', settings: { ...defaultSettings, frequency: 1900, amplitude: 0.42, vibratoFrequency: 12, vibratoDepth: 600, tremoloFrequency: 9, tremoloDepth: 0.35, duration: 1.1, cutoff: 7000 } },
  { name: 'Evening dove', settings: { ...defaultSettings, frequency: 320, amplitude: 0.43, vibratoFrequency: 1.5, vibratoDepth: 140, tremoloFrequency: 1.5, tremoloDepth: 0.65, duration: 2, cutoff: 1200 } },
  { name: 'Chattering sparrow', settings: { ...defaultSettings, shape: 'square', frequency: 1600, amplitude: 0.49, vibratoFrequency: 28, vibratoDepth: 220, tremoloFrequency: 24, tremoloDepth: 0.95, duration: 0.75, cutoff: 3800 } },
  { name: 'Reedy call', settings: { ...defaultSettings, shape: 'saw', frequency: 1100, amplitude: 0.61, vibratoFrequency: 6, vibratoDepth: 120, tremoloFrequency: 4, tremoloDepth: 0.25, duration: 1.4, cutoff: 2800 } },
  { name: 'Tiny peep', settings: { ...defaultSettings, frequency: 5600, amplitude: 0.32, vibratoFrequency: 10, vibratoDepth: 80, tremoloFrequency: 8, tremoloDepth: 0.2, duration: 0.5, cutoff: 10000 } },
  { name: 'Meadow song', settings: { ...defaultSettings, frequency: 2800, amplitude: 0.52, vibratoFrequency: 16, vibratoDepth: 350, tremoloFrequency: 5, tremoloDepth: 0.8, duration: 2, cutoff: 9000 } },
  { name: 'Owl hoot', settings: { ...defaultSettings, frequency: 300, amplitude: 0.45, vibratoFrequency: 2, vibratoDepth: 60, tremoloFrequency: 1, tremoloDepth: 0.4, duration: 1.5, cutoff: 900, pause: 0.8 } },
  { name: 'Canary flutter', settings: { ...defaultSettings, frequency: 4200, amplitude: 0.46, vibratoFrequency: 30, vibratoDepth: 280, tremoloFrequency: 16, tremoloDepth: 0.7, duration: 1.8, cutoff: 10000, pause: 0.35 } },
  { name: 'Robin whistle', settings: { ...defaultSettings, frequency: 2100, amplitude: 0.38, vibratoFrequency: 4, vibratoDepth: 160, tremoloFrequency: 3, tremoloDepth: 0.15, duration: 0.9, cutoff: 8500, pause: 0.5 } },
  { name: 'Wren chatter', settings: { ...defaultSettings, shape: 'square', frequency: 2900, amplitude: 0.45, vibratoFrequency: 30, vibratoDepth: 500, tremoloFrequency: 27, tremoloDepth: 0.9, duration: 1.3, cutoff: 5000, pause: 0.25 } },
  { name: 'Blackbird warble', settings: { ...defaultSettings, frequency: 1400, amplitude: 0.48, vibratoFrequency: 7, vibratoDepth: 480, tremoloFrequency: 4.5, tremoloDepth: 0.55, duration: 2, cutoff: 6500, pause: 0.6 } },
  { name: 'Swallow twitter', settings: { ...defaultSettings, frequency: 4800, amplitude: 0.45, vibratoFrequency: 24, vibratoDepth: 700, tremoloFrequency: 20, tremoloDepth: 0.8, duration: 0.6, cutoff: 10000, pause: 0.15 } },
  { name: 'Cuckoo pulse', settings: { ...defaultSettings, frequency: 650, amplitude: 0.55, vibratoFrequency: 2.5, vibratoDepth: 240, tremoloFrequency: 2.5, tremoloDepth: 1, duration: 1.6, cutoff: 2400, pause: 0.7 } },
  { name: 'Lark trill', settings: { ...defaultSettings, frequency: 3500, amplitude: 0.45, vibratoFrequency: 18, vibratoDepth: 550, tremoloFrequency: 12, tremoloDepth: 0.6, duration: 2, cutoff: 10000, pause: 0.4 } },
  { name: 'Chickadee peep', settings: { ...defaultSettings, frequency: 5100, amplitude: 0.37, vibratoFrequency: 6, vibratoDepth: 40, tremoloFrequency: 5, tremoloDepth: 0.4, duration: 0.55, cutoff: 10000, pause: 0.3 } },
  { name: 'Crane call', settings: { ...defaultSettings, shape: 'saw', frequency: 780, amplitude: 0.65, vibratoFrequency: 4, vibratoDepth: 170, tremoloFrequency: 2, tremoloDepth: 0.35, duration: 2, cutoff: 2000, pause: 0.9 } },
  { name: 'Goldfinch ripple', settings: { ...defaultSettings, frequency: 2600, amplitude: 0.45, vibratoFrequency: 14, vibratoDepth: 800, tremoloFrequency: 7, tremoloDepth: 0.5, duration: 1.7, cutoff: 9500, pause: 0.25 } },
  { name: 'Woodland buzz', settings: { ...defaultSettings, shape: 'saw', frequency: 1800, amplitude: 0.64, vibratoFrequency: 30, vibratoDepth: 100, tremoloFrequency: 30, tremoloDepth: 0.3, duration: 1, cutoff: 3400, pause: 0.4 } },
  { name: 'Waterbird murmur', settings: { ...defaultSettings, frequency: 390, amplitude: 0.54, vibratoFrequency: 5.5, vibratoDepth: 200, tremoloFrequency: 3.5, tremoloDepth: 0.75, duration: 2, cutoff: 1400, pause: 0.65 } },
  { name: 'Dawn chorus', settings: { ...defaultSettings, frequency: 2300, amplitude: 0.53, vibratoFrequency: 9.5, vibratoDepth: 1000, tremoloFrequency: 6.5, tremoloDepth: 0.9, duration: 2, cutoff: 8000, pause: 0.5 } },
  { name: 'Night song', settings: { ...defaultSettings, frequency: 1200, amplitude: 0.47, vibratoFrequency: 3.5, vibratoDepth: 320, tremoloFrequency: 1.5, tremoloDepth: 0.5, duration: 2, cutoff: 4200, pause: 1 } },
  { name: 'Glasswing', settings: { ...defaultSettings, frequency: 6200, amplitude: 0.32, vibratoFrequency: 2.5, vibratoDepth: 30, tremoloFrequency: 4, tremoloDepth: 0.35, duration: 0.7, cutoff: 10000, pause: 0.45 } },
  { name: 'Bubblebird', settings: { ...defaultSettings, frequency: 850, amplitude: 0.52, vibratoFrequency: 8.5, vibratoDepth: 1100, tremoloFrequency: 8.5, tremoloDepth: 0.75, duration: 0.85, cutoff: 3800, pause: 0.15 } },
  { name: 'Copper finch', settings: { ...defaultSettings, shape: 'saw', frequency: 2250, amplitude: 0.7, vibratoFrequency: 11, vibratoDepth: 260, tremoloFrequency: 13, tremoloDepth: 0.55, duration: 1.15, cutoff: 5500, pause: 0.35 } },
  { name: 'Space gull', settings: { ...defaultSettings, frequency: 950, amplitude: 0.45, vibratoFrequency: 0.7, vibratoDepth: 1200, tremoloFrequency: 0.7, tremoloDepth: 0.65, duration: 2, cutoff: 5000, pause: 0.8 } },
  { name: 'Pixel robin', settings: { ...defaultSettings, shape: 'square', frequency: 3300, amplitude: 0.47, vibratoFrequency: 15, vibratoDepth: 60, tremoloFrequency: 10, tremoloDepth: 1, duration: 0.6, cutoff: 8000, pause: 0.2 } },
  { name: 'Moon owl', settings: { ...defaultSettings, frequency: 300, amplitude: 0.5, vibratoFrequency: 0.5, vibratoDepth: 350, tremoloFrequency: 0.5, tremoloDepth: 0.8, duration: 2, cutoff: 700, pause: 1 } },
  { name: 'Velvet thrush', settings: { ...defaultSettings, frequency: 1050, amplitude: 0.38, vibratoFrequency: 5, vibratoDepth: 70, tremoloFrequency: 0.8, tremoloDepth: 0.25, duration: 2, cutoff: 3000, pause: 0.7 } },
  { name: 'Rainforest ping', settings: { ...defaultSettings, frequency: 4500, amplitude: 0.47, vibratoFrequency: 2, vibratoDepth: 120, tremoloFrequency: 7, tremoloDepth: 0.8, duration: 0.5, cutoff: 10000, pause: 0.55 } },
  { name: 'Reedbed rattle', settings: { ...defaultSettings, shape: 'square', frequency: 720, amplitude: 0.5, vibratoFrequency: 17, vibratoDepth: 160, tremoloFrequency: 30, tremoloDepth: 1, duration: 1.9, cutoff: 2400, pause: 0.3 } },
  { name: 'Alpine echo', settings: { ...defaultSettings, frequency: 2700, amplitude: 0.55, vibratoFrequency: 1.2, vibratoDepth: 200, tremoloFrequency: 2, tremoloDepth: 1, duration: 2, cutoff: 9000, pause: 1 } },
  { name: 'Ruby hummingbird', settings: { ...defaultSettings, frequency: 5400, amplitude: 0.39, vibratoFrequency: 30, vibratoDepth: 200, tremoloFrequency: 29, tremoloDepth: 0.55, duration: 0.95, cutoff: 10000, pause: 0.1 } },
  { name: 'Pocket robot', settings: { ...defaultSettings, shape: 'square', frequency: 1250, amplitude: 0.47, vibratoFrequency: 20, vibratoDepth: 1200, tremoloFrequency: 15, tremoloDepth: 0.85, duration: 0.8, cutoff: 5000, pause: 0.2 } },
  { name: 'Cricket cousin', settings: { ...defaultSettings, shape: 'saw', frequency: 6800, amplitude: 0.76, vibratoFrequency: 30, vibratoDepth: 40, tremoloFrequency: 26, tremoloDepth: 0.95, duration: 1.25, cutoff: 10000, pause: 0.3 } },
  { name: 'Marsh tremble', settings: { ...defaultSettings, frequency: 570, amplitude: 0.51, vibratoFrequency: 13, vibratoDepth: 450, tremoloFrequency: 11, tremoloDepth: 0.7, duration: 1.45, cutoff: 1900, pause: 0.4 } },
  { name: 'Sea whistle', settings: { ...defaultSettings, frequency: 3100, amplitude: 0.36, vibratoFrequency: 0.4, vibratoDepth: 900, tremoloFrequency: 1.2, tremoloDepth: 0.2, duration: 2, cutoff: 10000, pause: 0.9 } },
  { name: 'Solar flare', settings: { ...defaultSettings, shape: 'saw', frequency: 4000, amplitude: 0.62, vibratoFrequency: 30, vibratoDepth: 650, tremoloFrequency: 22, tremoloDepth: 0.45, duration: 0.65, cutoff: 10000, pause: 0.25 } },
  { name: 'Mossy bass', settings: { ...defaultSettings, shape: 'saw', frequency: 300, amplitude: 0.82, vibratoFrequency: 2.2, vibratoDepth: 80, tremoloFrequency: 3, tremoloDepth: 0.6, duration: 2, cutoff: 600, pause: 0.6 } },
  { name: 'Helium canary', settings: { ...defaultSettings, frequency: 7400, amplitude: 0.33, vibratoFrequency: 19, vibratoDepth: 320, tremoloFrequency: 14, tremoloDepth: 0.6, duration: 0.75, cutoff: 10000, pause: 0.2 } },
  { name: 'Comet trill', settings: { ...defaultSettings, frequency: 3700, amplitude: 0.49, vibratoFrequency: 27, vibratoDepth: 950, tremoloFrequency: 9, tremoloDepth: 0.85, duration: 2, cutoff: 10000, pause: 0.45 } },
  { name: 'Silver bell', settings: { ...defaultSettings, frequency: 1750, amplitude: 0.52, vibratoFrequency: 0, vibratoDepth: 0, tremoloFrequency: 0.9, tremoloDepth: 0.9, duration: 1, cutoff: 7000, pause: 0.8 } },
  { name: 'Rusty gate', settings: { ...defaultSettings, shape: 'saw', frequency: 430, amplitude: 0.75, vibratoFrequency: 0.8, vibratoDepth: 1000, tremoloFrequency: 23, tremoloDepth: 0.65, duration: 2, cutoff: 1800, pause: 0.75 } },
  { name: 'Tiny UFO', settings: { ...defaultSettings, frequency: 4600, amplitude: 0.36, vibratoFrequency: 9, vibratoDepth: 1200, tremoloFrequency: 4.5, tremoloDepth: 0.5, duration: 1.35, cutoff: 10000, pause: 0.3 } },
  { name: 'Flute call', settings: { ...defaultSettings, frequency: 880, amplitude: 0.37, vibratoFrequency: 5.5, vibratoDepth: 40, tremoloFrequency: 5.5, tremoloDepth: 0.1, duration: 1.8, cutoff: 4000, pause: 0.55 } },
  { name: 'Electric flock', settings: { ...defaultSettings, shape: 'square', frequency: 2400, amplitude: 0.45, vibratoFrequency: 12.7, vibratoDepth: 700, tremoloFrequency: 17.3, tremoloDepth: 0.8, duration: 2, cutoff: 7500, pause: 0.35 } },
  { name: 'Radio birb', settings: { ...defaultSettings, shape: 'square', frequency: 2050, amplitude: 0.48, vibratoFrequency: 30, vibratoDepth: 110, tremoloFrequency: 6, tremoloDepth: 0.95, duration: 1.05, cutoff: 4500, pause: 0.25 } },
]
export const OUTPUT_CEILING = 0.25
const limiterCurve = Float32Array.from({ length: 4097 }, (_, i) => {
  const value = i / 2048 - 1
  const magnitude = Math.abs(value)
  // Unity gain below the knee, smoothly approaching the output ceiling above it.
  return Math.sign(value) * (magnitude <= 0.2 ? magnitude : 0.2 + 0.05 * Math.tanh((magnitude - 0.2) / 0.05))
})
const peakGuardCurve = Float32Array.from({ length: 4097 }, (_, i) => Math.max(-OUTPUT_CEILING, Math.min(OUTPUT_CEILING, i / 2048 - 1)))

export function createSafetyFilter(context) {
  // Fourth-order Butterworth: flat passband, with a steep rolloff ahead of
  // Nyquist. Adapt to lower sample rates rather than setting cutoff at Nyquist.
  const nodes = [0.5411961, 1.306563].map(q => {
    const node = context.createBiquadFilter()
    node.type = 'lowpass'
    node.frequency.value = Math.min(12000, context.sampleRate * 0.4)
    node.Q.value = q
    return node
  })
  nodes[0].connect(nodes[1])
  return { input: nodes[0], output: nodes[1], nodes }
}

export function createOutputLimiter(context) {
  const limiter = context.createWaveShaper()
  limiter.curve = limiterCurve
  return limiter
}

export function renderedDuration(settings) {
  return settings.duration + (settings.chorus > 0 ? 0.04 : 0)
}

const masterGraphs = new WeakMap()
function getMaster(context, destination, settings) {
  let outputs = masterGraphs.get(context)
  if (!outputs) { outputs = new Map(); masterGraphs.set(context, outputs) }
  if (outputs.has(destination)) return outputs.get(destination)
  const input = context.createGain()
  const dry = context.createGain()
  const chorusMix = context.createGain()
  const chorusWet = context.createGain()
  const chorusStereo = context.createChannelMerger(2)
  const chorusLeft = context.createDelay(0.05)
  const chorusRight = context.createDelay(0.05)
  chorusLeft.delayTime.value = 0.014
  chorusRight.delayTime.value = 0.021
  // A tiny looping control buffer avoids adding another audible oscillator.
  const lfo = context.createBufferSource()
  const cycle = context.createBuffer(1, 16000, 8000)
  const samples = cycle.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(2 * Math.PI * i / samples.length)
  lfo.buffer = cycle
  lfo.loop = true
  const modLeft = context.createGain()
  const modRight = context.createGain()
  modLeft.gain.value = 0.002
  modRight.gain.value = -0.002
  lfo.connect(modLeft).connect(chorusLeft.delayTime)
  lfo.connect(modRight).connect(chorusRight.delayTime)
  input.connect(dry).connect(chorusMix)
  input.connect(chorusLeft).connect(chorusStereo, 0, 0)
  input.connect(chorusRight).connect(chorusStereo, 0, 1)
  chorusStereo.connect(chorusWet).connect(chorusMix)

  const limiter = createOutputLimiter(context)
  limiter.oversample = '4x'
  const safety = createSafetyFilter(context)
  // Oversampling's reconstruction filter can overshoot slightly. This final
  // guard preserves the hard ceiling without filtering after it.
  const peakGuard = context.createWaveShaper()
  peakGuard.curve = peakGuardCurve
  const output = context.createGain()
  chorusMix.connect(safety.input)
  safety.output.connect(limiter).connect(peakGuard).connect(output).connect(destination)

  const nodes = [input, dry, chorusMix, chorusWet, chorusStereo, chorusLeft, chorusRight, lfo, modLeft, modRight, ...safety.nodes, limiter, peakGuard, output]
  let disposed = false
  const values = new Map()
  const master = {
    input,
    update(next, immediate = false) {
      const chorus = Math.max(0, Math.min(0.5, next.chorus ?? defaultSettings.chorus))
      for (const [param, value] of [[dry.gain, 1 - chorus], [chorusWet.gain, chorus]]) {
        if (values.get(param) === value) continue
        values.set(param, value)
        if (immediate) param.setValueAtTime(value, context.currentTime)
        else param.setTargetAtTime(value, context.currentTime, 0.015)
      }
    },
    fadeTail(end) {
      output.gain.cancelScheduledValues(context.currentTime)
      output.gain.setValueAtTime(1, context.currentTime)
      output.gain.setValueAtTime(1, Math.max(0, end - 0.025))
      output.gain.linearRampToValueAtTime(0, end)
    },
    stop() {
      if (disposed) return
      disposed = true
      outputs.delete(destination)
      const now = context.currentTime
      output.gain.cancelScheduledValues(now)
      output.gain.setTargetAtTime(0, now, 0.003)
      lfo.onended = () => nodes.forEach(node => node.disconnect())
      lfo.stop(now + 0.02)
    },
  }
  master.update(settings, true)
  lfo.start(context.currentTime)
  outputs.set(destination, master)
  return master
}

export function stopMasterEffects(context) {
  for (const master of masterGraphs.get(context)?.values() || []) master.stop()
}
export function updateMasterEffects(context, settings) {
  for (const master of masterGraphs.get(context)?.values() || []) master.update(settings)
}

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
  const master = getMaster(context, destination, settings)
  const nodes = [wave, vibrato, vibratoGain, tremolo, tremoloGain, amplitude, modulation, filter, envelope]
  const start = context.currentTime
  const end = start + settings.duration
  master.fadeTail(start + renderedDuration(settings))
  let stopping = false
  const parameterValues = new Map()
  wave.connect(amplitude).connect(modulation).connect(filter).connect(envelope).connect(master.input)
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
    master.update(next, immediate)
    const type = next.shape === 'saw' ? 'sawtooth' : next.shape
    if (wave.type !== type) wave.type = type
    const set = (param, value) => {
      // Do not restart unrelated automation whenever one slider changes.
      if (parameterValues.get(param) === value) return
      parameterValues.set(param, value)
      if (immediate) param.setValueAtTime(value, context.currentTime)
      else param.setTargetAtTime(value, context.currentTime, 0.015)
    }
    set(wave.frequency, next.frequency)
    set(amplitude.gain, next.amplitude)
    set(vibrato.frequency, next.vibratoFrequency)
    set(vibratoGain.gain, next.vibratoDepth)
    set(tremolo.frequency, next.tremoloFrequency)
    set(tremoloGain.gain, next.tremoloDepth / 2)
    set(modulation.gain, 1 - next.tremoloDepth / 2)
    set(filter.frequency, Math.min(next.cutoff, 15000, context.sampleRate * 0.4))
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
      master.stop()
      const now = context.currentTime
      const currentGain = envelope.gain.value
      envelope.gain.cancelScheduledValues(now)
      envelope.gain.setValueAtTime(currentGain, now)
      envelope.gain.linearRampToValueAtTime(0, now + 0.015)
      for (const oscillator of [wave, vibrato, tremolo]) oscillator.stop(Math.min(end, now + 0.02))
    },
  }
}
const renderCache = new Map()
const renderKeys = Object.keys(defaultSettings).filter(key => key !== 'pause')
const MAX_CACHED_RENDERS = 4

// Shared, read-only buffers: preview and WAV export reuse the same full-quality render.
export function renderSong(settings) {
  const snapshot = { ...settings }
  const key = JSON.stringify(renderKeys.map(key => snapshot[key]))
  if (renderCache.has(key)) {
    const cached = renderCache.get(key)
    renderCache.delete(key)
    renderCache.set(key, cached)
    return cached
  }
  const pending = renderUncached(snapshot).catch(error => {
    if (renderCache.get(key) === pending) renderCache.delete(key)
    throw error
  })
  renderCache.set(key, pending)
  if (renderCache.size > MAX_CACHED_RENDERS) renderCache.delete(renderCache.keys().next().value)
  return pending
}

async function renderUncached(settings) {
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  if (!OfflineContext) throw new Error('Audio preview is unavailable in this browser.')
  const duration = renderedDuration(settings)
  const context = new OfflineContext(2, Math.ceil(duration * 44100), 44100)
  createVoice(context, settings)
  return context.startRendering()
}
export function toWav(buffer) {
  const channels = buffer.numberOfChannels
  const samples = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel))
  const bytes = new ArrayBuffer(44 + buffer.length * channels * 2)
  const view = new DataView(bytes)
  const write = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, bytes.byteLength - 8, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, buffer.length * channels * 2, true)
  for (let frame = 0; frame < buffer.length; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = samples[channel][frame]
      view.setInt16(44 + (frame * channels + channel) * 2, Math.max(-1, Math.min(1, sample)) * 32767, true)
    }
  }
  return new Blob([bytes], { type: 'audio/wav' })
}
