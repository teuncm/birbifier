import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'

test('Download exports exactly the current wet render including master effects', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  for (const [id, value] of [['chorus', 0.5], ['cutoff', 1000], ['duration', 0.5]]) {
    await page.locator(`#${id}`).evaluate((input, value) => {
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, value)
  }
  const expectedHash = await page.evaluate(async () => {
    const { defaultSettings, renderSong, toWav } = await import('/src/audio.js')
    const buffer = await renderSong({ ...defaultSettings, chorus: 0.5, cutoff: 1000, duration: 0.5 })
    const digest = await crypto.subtle.digest('SHA-256', await toWav(buffer).arrayBuffer())
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  })
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download (WAV)', exact: true }).click(),
  ])
  const hash = createHash('sha256')
  for await (const chunk of await download.createReadStream()) hash.update(chunk)
  expect(hash.digest('hex')).toBe(expectedHash)
})

test('chorus is 30% and locked on every preset, with a 50% upper limit', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.8 })
  await page.goto('/')
  expect(await page.evaluate(async () => (await import('/src/audio.js')).presets.every(preset => preset.settings.chorus === 0.3))).toBe(true)
  const chorus = page.locator('#chorus')
  await expect(chorus).toHaveValue('0.3')
  await expect(chorus).toHaveAttribute('min', '0.3')
  await expect(chorus).toHaveAttribute('max', '0.5')
  await expect(page.locator('#cutoff')).toHaveAttribute('max', '15000')
  expect(await page.evaluate(async () => (await import('/src/audio.js')).presets.every(preset => preset.settings.cutoff <= 15000))).toBe(true)
  await expect(page.getByRole('button', { name: 'Unlock Chorus', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect(chorus).toHaveValue('0.3')
  await page.getByRole('button', { name: 'Unlock Chorus', exact: true }).click()
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect(chorus).toHaveValue('0.46')
  await page.getByRole('combobox', { name: 'Presets' }).selectOption('Little chirp')
  await expect(chorus).toHaveValue('0.3')
  await expect(page.getByRole('button', { name: 'Unlock Chorus', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await chorus.evaluate(input => { input.value = 0.5; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await expect(chorus).toHaveValue('0.5')
})

test('stereo WAV includes the short chorus tail with correctly interleaved channels', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { defaultSettings, renderSong, toWav, renderedDuration } = await import('/src/audio.js')
    const settings = { ...defaultSettings, frequency: 1000, amplitude: 0.5, vibratoDepth: 0, tremoloDepth: 0, chorus: 0.3, duration: 0.5, cutoff: 10000 }
    const buffer = await renderSong(settings)
    const wav = new DataView(await toWav(buffer).arrayBuffer())
    const frame = Math.round(0.145 * buffer.sampleRate)
    return {
      duration: buffer.duration, expectedDuration: renderedDuration(settings),
      channels: wav.getUint16(22, true), alignment: wav.getUint16(32, true), rate: wav.getUint32(28, true),
      leftPcm: wav.getInt16(44 + frame * 4, true), rightPcm: wav.getInt16(46 + frame * 4, true),
      expectedLeft: Math.trunc(buffer.getChannelData(0)[frame] * 32767),
      expectedRight: Math.trunc(buffer.getChannelData(1)[frame] * 32767),
    }
  })
  expect(result.duration).toBeCloseTo(result.expectedDuration, 4)
  expect(result.channels).toBe(2)
  expect(result.alignment).toBe(4)
  expect(result.rate).toBe(44100 * 4)
  expect(result.leftPcm).toBe(result.expectedLeft)
  expect(result.rightPcm).toBe(result.expectedRight)
})

test('chorus widens the stereo image and can be bypassed', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { defaultSettings, renderSong } = await import('/src/audio.js')
    const settings = { ...defaultSettings, frequency: 1200, vibratoDepth: 0, tremoloDepth: 0, duration: 0.5 }
    const compare = async chorus => {
      const buffer = await renderSong({ ...settings, chorus })
      const left = buffer.getChannelData(0), right = buffer.getChannelData(1)
      return {
        difference: Math.sqrt(left.reduce((sum, value, i) => sum + (value - right[i]) ** 2, 0) / left.length),
        peak: Math.max(...[left, right].map(samples => samples.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0))),
        duration: buffer.duration,
      }
    }
    return { dry: await compare(0), chorus: await compare(0.5) }
  })
  expect(result.dry.difference).toBe(0)
  expect(result.dry.duration).toBe(0.5)
  expect(result.chorus.difference).toBeGreaterThan(0.002)
  expect(result.chorus.duration).toBeCloseTo(0.54, 4)
  expect(result.chorus.peak).toBeLessThanOrEqual(0.250001)
})

test('stopping the master silences both the dry voice and chorus', async ({ page }) => {
  await page.goto('/')
  const peak = await page.evaluate(async () => {
    const { defaultSettings, createVoice, stopMasterEffects } = await import('/src/audio.js')
    const context = new OfflineAudioContext(2, 44100, 44100)
    createVoice(context, { ...defaultSettings, duration: 0.1, chorus: 0.15 })
    const suspended = context.suspend(0.05)
    const rendering = context.startRendering()
    await suspended
    stopMasterEffects(context)
    await context.resume()
    const buffer = await rendering
    return Math.max(...[0, 1].map(channel => buffer.getChannelData(channel).subarray(13230).reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0)))
  })
  expect(peak).toBeLessThan(1e-6)
})
