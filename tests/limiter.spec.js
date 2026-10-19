import { test, expect } from '@playwright/test'

test('output limiter preserves quiet signals and bounds both polarities under overload', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const { createOutputLimiter, OUTPUT_CEILING } = await import('/src/audio.js')
    const levels = []
    for (const value of [0, 0.1, -0.1, 0.5, -0.5, 10, -10]) {
      const context = new OfflineAudioContext(1, 2048, 44100)
      const source = context.createConstantSource()
      source.offset.value = value
      source.connect(createOutputLimiter(context)).connect(context.destination)
      source.start()
      const samples = (await context.startRendering()).getChannelData(0)
      levels.push({ input: value, output: samples[1024], finite: samples.every(Number.isFinite) })
    }
    return { levels, ceiling: OUTPUT_CEILING }
  })
  for (const { input, output, finite } of results.levels) {
    expect(finite).toBe(true)
    expect(Math.abs(output)).toBeLessThanOrEqual(results.ceiling + 1e-7)
    if (Math.abs(input) <= 0.1) expect(output).toBeCloseTo(input, 6)
    else {
      expect(Math.sign(output)).toBe(Math.sign(input))
      expect(Math.abs(output)).toBeGreaterThan(0.2)
    }
  }
})

test('synthesis and WAV export stay bounded at extreme settings and excessive gain', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const { renderSong, defaultSettings, toWav } = await import('/src/audio.js')
    const results = []
    for (const shape of ['sine', 'square', 'saw']) {
      for (const amplitude of [1, 100]) {
        const buffer = await renderSong({ ...defaultSettings, shape, amplitude, frequency: 100, vibratoDepth: 1200, vibratoSpeed: 40, tremoloDepth: 1, tremoloSpeed: 30, cutoff: 20000, duration: 0.5 })
        const samples = buffer.getChannelData(0)
        const wav = new DataView(await toWav(buffer).arrayBuffer())
        let wavPeak = 0
        for (let i = 44; i < wav.byteLength; i += 2) wavPeak = Math.max(wavPeak, Math.abs(wav.getInt16(i, true)))
        results.push({ shape, amplitude, finite: samples.every(Number.isFinite), peak: samples.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0), wavPeak })
      }
    }
    return results
  })
  for (const result of results) {
    expect(result.finite).toBe(true)
    expect(result.peak).toBeGreaterThan(0.01)
    expect(result.peak).toBeLessThanOrEqual(0.250001)
    expect(result.wavPeak).toBeLessThanOrEqual(8192)
  }
})
