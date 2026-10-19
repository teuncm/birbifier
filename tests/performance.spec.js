import { test, expect } from '@playwright/test'

test('audio renders share in-flight work, ignore repeat pause, and use a bounded cache', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { defaultSettings, renderSong } = await import('/src/audio.js')
    const Original = window.OfflineAudioContext
    let renders = 0
    window.OfflineAudioContext = class extends Original {
      constructor(...args) { super(...args); renders++ }
    }
    const settings = { ...defaultSettings, frequency: 1230, duration: 0.73 }
    const first = renderSong(settings)
    const shared = renderSong({ ...settings, pause: 1 })
    const samePromise = first === shared
    const buffer = await first
    const sameBuffer = buffer === await shared
    const afterShared = renders
    const changed = await renderSong({ ...settings, amplitude: 0 })
    const silent = changed.getChannelData(0).every(sample => sample === 0)
    for (const frequency of [1240, 1250, 1260, 1270]) await renderSong({ ...settings, frequency })
    const beforeEvictionCheck = renders
    await renderSong(settings)
    return { samePromise, sameBuffer, afterShared, silent, evictionRenders: renders - beforeEvictionCheck }
  })
  expect(result).toEqual({ samePromise: true, sameBuffer: true, afterShared: 1, silent: true, evictionRenders: 1 })
})

test('editing one sound parameter only schedules its own audio automation', async ({ page }) => {
  await page.goto('/')
  const counts = await page.evaluate(async () => {
    const { defaultSettings, createVoice } = await import('/src/audio.js')
    const context = new OfflineAudioContext(1, 4410, 44100)
    const original = AudioParam.prototype.setTargetAtTime
    let calls = 0
    AudioParam.prototype.setTargetAtTime = function (...args) { calls++; return original.apply(this, args) }
    try {
      const settings = { ...defaultSettings, duration: 0.1 }
      const voice = createVoice(context, settings)
      voice.update({ ...settings, frequency: 1230 })
      const frequency = calls
      voice.update({ ...settings, frequency: 1230 })
      const unchanged = calls
      voice.update({ ...settings, frequency: 1230, amplitude: 0.2 })
      const amplitude = calls
      await context.startRendering()
      return { frequency, unchanged, amplitude }
    } finally { AudioParam.prototype.setTargetAtTime = original }
  })
  expect(counts).toEqual({ frequency: 1, unchanged: 1, amplitude: 2 })
})

test('rapid edits queue only the latest waveform while a preview is rendering', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.OfflineAudioContext
    window.renderReleases = []
    window.previewRenders = 0
    window.OfflineAudioContext = class extends Original {
      constructor(...args) { super(...args); window.previewRenders++ }
      async startRendering() {
        const buffer = await super.startRendering()
        await new Promise(resolve => window.renderReleases.push(resolve))
        return buffer
      }
    }
  })
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => window.renderReleases.length)).toBe(1)
  for (const frequency of [1230, 4560]) {
    await page.locator('#frequency').evaluate((input, value) => {
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, frequency)
    // Let the 100 ms preview debounce run while the previous render is held.
    await page.waitForTimeout(150)
  }
  expect(await page.evaluate(() => window.previewRenders)).toBe(1)
  await page.evaluate(() => window.renderReleases[0]())
  await expect.poll(() => page.evaluate(() => window.renderReleases.length)).toBe(2)
  expect(await page.evaluate(() => window.previewRenders)).toBe(2)
  await page.evaluate(() => window.renderReleases[1]())
  await expect(page.locator('div[aria-busy]')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('svg[aria-label="Waveform preview of the current song"] line')).toHaveCount(180)
})
