import { test, expect } from '@playwright/test'

test('safety filter preserves low frequencies and attenuates near Nyquist across sample rates', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const { createSafetyFilter } = await import('/src/audio.js')
    return [24000, 44100, 48000, 96000].map(sampleRate => {
      const context = new OfflineAudioContext(2, 1024, sampleRate)
      const { nodes } = createSafetyFilter(context)
      const frequencies = new Float32Array([1000, sampleRate * 0.48])
      const magnitude = new Float32Array([1, 1])
      for (const node of nodes) {
        const response = new Float32Array(2)
        node.getFrequencyResponse(frequencies, response, new Float32Array(2))
        magnitude[0] *= response[0]
        magnitude[1] *= response[1]
      }
      return { sampleRate, low: magnitude[0], nearNyquist: magnitude[1], cutoff: nodes[0].frequency.value }
    })
  })
  for (const result of results) {
    expect(result.low).toBeGreaterThan(0.99)
    expect(result.nearNyquist).toBeLessThan(0.01)
    expect(result.cutoff).toBeLessThan(result.sampleRate / 2)
  }
})

test('master oversamples soft limiting and keeps a final peak guard', async ({ page }) => {
  await page.goto('/')
  const modes = await page.evaluate(async () => {
    const { createVoice, defaultSettings } = await import('/src/audio.js')
    const context = new OfflineAudioContext(2, 4410, 44100)
    const shapers = []
    const original = context.createWaveShaper.bind(context)
    context.createWaveShaper = () => { const node = original(); shapers.push(node); return node }
    createVoice(context, { ...defaultSettings, duration: 0.1 })
    await context.startRendering()
    return shapers.map(node => node.oversample)
  })
  expect(modes).toEqual(['4x', 'none'])
})
