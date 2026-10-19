import { test, expect } from '@playwright/test'

async function setSlider(page, id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, String(value))
}

test('controls, presets, waveform, export, and narrow mobile layout', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Birdsong synthesizer')
  await expect(page.locator('svg[role="img"] line')).toHaveCount(180)
  await page.getByRole('button', { name: 'Square', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Square', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await setSlider(page, 'amplitude', 0)
  await expect.poll(() => page.locator('svg[role="img"] line').evaluateAll(lines => lines.every(line => Number(line.getAttribute('y2')) - Number(line.getAttribute('y1')) === 1))).toBe(true)
  const presetSelect = page.getByRole('combobox', { name: 'Presets' })
  await expect(presetSelect.locator('option:not([disabled])')).toHaveCount(50)
  await expect(presetSelect).toHaveValue('')
  await expect(presetSelect.locator('option:checked')).toHaveText('Custom')
  await presetSelect.selectOption('Soft coo')
  await expect(page.locator('#frequency')).toHaveValue('480')
  await page.getByRole('button', { name: 'Reset sound' }).click()
  await expect(page.locator('#frequency')).toHaveValue('2400')
  await expect(presetSelect).toHaveValue('Little chirp')
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download (WAV)', exact: true }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toBe('birbifier-song.wav')
  expect(await download.failure()).toBeNull()
  await page.screenshot({ path: test.info().outputPath('desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 320, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Collapse all', exact: true }).click()
  await expect(page.locator('input[type="range"]')).toHaveCount(0)
  await expect(page.locator('.lfo-pad')).toHaveCount(0)
  await expect(page.locator('.shape-button')).toHaveCount(0)
  await expect(page.locator('output[data-parameter]')).toHaveCount(10)
  await expect(page.getByRole('button', { name: /^Lock / })).toHaveCount(10)
  await expect(page.locator('output[data-parameter="frequency"]')).toHaveText(await page.evaluate(() => `${(2400).toLocaleString()} Hz`))
  await expect(page.locator('output[data-parameter="shape"]')).toHaveText('Sine')
  await page.getByRole('button', { name: 'Lock Wave speed', exact: true }).click()
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect(page.locator('output[data-parameter="frequency"]')).toHaveText(await page.evaluate(() => `${(2400).toLocaleString()} Hz`))
  await expect(page.getByRole('button', { name: 'Unlock Wave speed', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const compactValues = await page.locator('output[data-parameter]').evaluateAll(outputs => Object.fromEntries(outputs.map(output => [output.dataset.parameter, output.textContent])))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('mobile-collapsed.png'), fullPage: true })
  await page.getByRole('button', { name: 'Expand all', exact: true }).click()
  await expect(page.locator('input[type="range"]')).toHaveCount(9)
  await expect(page.locator('.lfo-pad')).toHaveCount(2)
  await expect(page.locator('.shape-button')).toHaveCount(3)
  for (const [id, value] of Object.entries(compactValues)) {
    if (id === 'shape') await expect(page.locator('.shape-button.selected')).toHaveText(value)
    else await expect(page.locator(`output[data-parameter="${id}"]`)).toHaveText(value)
  }
  const waveToggle = page.getByRole('button', { name: 'Wave controls', exact: true })
  await waveToggle.focus()
  await page.keyboard.press('Enter')
  await expect(waveToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#wave-controls input')).toHaveCount(0)
  await expect(page.locator('#vibrato-controls input')).toHaveCount(2)
  await expect(page.locator('#tremolo-controls input')).toHaveCount(2)
  await waveToggle.click()
  await expect(waveToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#frequency')).toHaveValue('2400')
  expect(errors).toEqual([])
})

test('playback finishes, loops, stops, and survives immediate replay', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext
    window.voiceCount = 0
    window.AudioContext = class extends OriginalContext {
      constructor(...args) { super(...args); window.liveContext = this }
      createOscillator() { window.voiceCount++; return super.createOscillator() }
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.voiceCount)).toBeGreaterThanOrEqual(9)
  await page.getByRole('button', { name: 'Stop song' }).click()
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await setSlider(page, 'duration', 1.6)
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await page.evaluate(() => {
    const play = document.querySelector('.button-primary')
    play.click()
    play.click()
    window.replayedAt = window.liveContext.currentTime
  })
  await page.waitForFunction(() => window.liveContext.currentTime > window.replayedAt + 0.15)
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await setSlider(page, 'frequency', 1000)
  await page.getByRole('button', { name: 'Stop song' }).click()
  expect(errors).toEqual([])
})

test('actual audio has working wave shapes, modulation, gain, filter, fades, and WAV encoding', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  const result = await page.evaluate(async () => {
    const { renderSong, defaultSettings, toWav } = await import('/src/audio.js')
    const base = { ...defaultSettings, amplitude: 0.5, duration: 0.4, vibratoDepth: 0, tremoloDepth: 0, cutoff: 20000 }
    const render = async overrides => (await renderSong({ ...base, ...overrides })).getChannelData(0)
    const rms = samples => Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length)
    const difference = (a, b) => rms(a.map((sample, i) => sample - b[i]))
    const sine = await render({})
    const square = await render({ shape: 'square' })
    const saw = await render({ shape: 'saw' })
    const quiet = await render({ amplitude: 0.25 })
    const silent = await render({ amplitude: 0 })
    const filtered = await render({ cutoff: 200 })
    const vibrato = await render({ vibratoDepth: 600 })
    const tremolo = await render({ tremoloDepth: 1, tremoloSpeed: 10 })
    const buffer = await renderSong(base)
    const wav = new DataView(await toWav(buffer).arrayBuffer())
    const chars = (from, count) => Array.from({ length: count }, (_, i) => String.fromCharCode(wav.getUint8(from + i))).join('')
    return {
      sineRms: rms(sine), squareDifference: difference(sine, square), sawDifference: difference(sine, saw),
      gainRatio: rms(quiet) / rms(sine), silence: rms(silent),
      filterRatio: rms(filtered) / rms(sine), vibratoDifference: difference(sine, vibrato),
      tremoloRatio: rms(tremolo.slice(2800, 3500)) / rms(tremolo.slice(700, 1400)),
      first: sine[0], last: sine.at(-1), length: sine.length,
      riff: chars(0, 4), wave: chars(8, 4), sampleRate: wav.getUint32(24, true),
      wavLength: wav.byteLength, dataLength: wav.getUint32(40, true),
    }
  })
  expect(result.sineRms).toBeGreaterThan(0.05)
  expect(result.squareDifference).toBeGreaterThan(0.01)
  expect(result.sawDifference).toBeGreaterThan(0.01)
  expect(result.gainRatio).toBeCloseTo(0.5, 3)
  expect(result.silence).toBe(0)
  expect(result.filterRatio).toBeLessThan(0.05)
  expect(result.vibratoDifference).toBeGreaterThan(0.05)
  expect(result.tremoloRatio).toBeLessThan(0.15)
  expect(result.first).toBe(0)
  expect(Math.abs(result.last)).toBeLessThan(0.001)
  expect(result.length).toBe(17640)
  expect(result.riff).toBe('RIFF')
  expect(result.wave).toBe('WAVE')
  expect(result.sampleRate).toBe(44100)
  expect(result.wavLength).toBe(44 + result.length * 2)
  expect(result.dataLength).toBe(result.length * 2)
})

test('a browser without Web Audio shows a useful error', async ({ page }) => {
  await page.addInitScript(() => {
    window.AudioContext = undefined
    window.webkitAudioContext = undefined
    window.OfflineAudioContext = undefined
    window.webkitOfflineAudioContext = undefined
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('does not support audio synthesis')
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeEnabled()
})

test('randomization respects each parameter lock and the duration bounds', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.8 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  const parameters = [
    ['shape', 'Wave shape'], ['frequency', 'Wave speed'], ['amplitude', 'Amplitude'],
    ['vibratoSpeed', 'Vibrato speed'], ['vibratoDepth', 'Vibrato depth'],
    ['tremoloSpeed', 'Tremolo speed'], ['tremoloDepth', 'Tremolo depth'],
    ['duration', 'Chirp duration'], ['cutoff', 'Cutoff'], ['pause', 'Repeat pause'],
  ]
  const values = () => page.evaluate(() => ({
    shape: document.querySelector('.shape-button.selected').textContent.trim(),
    ...Object.fromEntries([...document.querySelectorAll('input[type="range"]')].map(input => [input.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), Number(input.value)])),
  }))
  const defaults = await values()
  await expect(page.locator('#duration')).toHaveAttribute('min', '0.5')
  await expect(page.locator('#duration')).toHaveAttribute('max', '2')
  for (const [key, label] of parameters) {
    await page.getByRole('button', { name: 'Reset sound' }).click()
    await page.getByRole('button', { name: `Lock ${label}`, exact: true }).click()
    await page.getByRole('button', { name: 'Randomize', exact: true }).click()
    expect((await values())[key]).toBe(defaults[key])
    await page.getByRole('button', { name: `Unlock ${label}`, exact: true }).click()
    await page.getByRole('button', { name: 'Randomize', exact: true }).click()
    expect((await values())[key]).not.toBe(defaults[key])
  }
  for (const [, label] of parameters) await page.getByRole('button', { name: `Lock ${label}`, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Randomize', exact: true })).toBeDisabled()
  await setSlider(page, 'frequency', 1000)
  await expect(page.locator('#frequency')).toHaveValue('1000')
  const boundaries = await page.evaluate(async () => {
    const { randomizeSettings } = await import('/src/randomize.js')
    const { defaultSettings } = await import('/src/audio.js')
    return [randomizeSettings(defaultSettings, {}, () => 0), randomizeSettings(defaultSettings, {}, () => 0.999999)]
  })
  expect(boundaries[0].duration).toBe(0.5)
  expect(boundaries[1].duration).toBe(2)
  expect(boundaries[0].pause).toBe(0)
  expect(boundaries[1].pause).toBe(1)
})

test.describe('LFO interaction', () => {
test.use({ hasTouch: true })
test('LFO visualizers respond to sliders, pointer drag, touch, and keyboard', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  for (const [id, maxSpeed, maxDepth] of [['vibrato', 40, 1200], ['tremolo', 30, 1]]) {
    const pad = page.locator(`#${id}-lfo`)
    const path = pad.locator('path').last()
    const initialPath = await path.getAttribute('d')
    await setSlider(page, `${id}-speed`, 0)
    await setSlider(page, `${id}-depth`, 0)
    await expect(path).not.toHaveAttribute('d', initialPath)
    await pad.scrollIntoViewIfNeeded()
    const box = await pad.boundingBox()
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.75)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.mouse.up()
    await expect(page.locator(`#${id}-speed`)).toHaveValue(String(maxSpeed / 2))
    await expect(page.locator(`#${id}-depth`)).toHaveValue(String(maxDepth / 2))
    await pad.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator(`#${id}-speed`)).toHaveValue(String(maxSpeed / 2 + 0.1))
    await page.keyboard.press('ArrowUp')
    await expect(page.locator(`#${id}-depth`)).toHaveValue(String(maxDepth / 2 + (id === 'vibrato' ? 10 : 0.01)))
    await page.touchscreen.tap(box.x + box.width - 2, box.y + 2)
    await expect(page.locator(`#${id}-speed`)).toHaveValue(String(maxSpeed))
    await expect(page.locator(`#${id}-depth`)).toHaveValue(String(maxDepth))
  }
})
})

test('WAV export preserves both duration endpoints', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset sound', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  const lengths = await page.evaluate(async () => {
    const { defaultSettings, renderSong, toWav } = await import('/src/audio.js')
    const results = []
    for (const duration of [0.5, 2]) {
      const buffer = await renderSong({ ...defaultSettings, duration })
      results.push({ duration: buffer.duration, samples: buffer.length, wavSize: toWav(buffer).size })
    }
    return results
  })
  expect(lengths).toEqual([
    { duration: 0.5, samples: 22050, wavSize: 44144 },
    { duration: 2, samples: 88200, wavSize: 176444 },
  ])
})
