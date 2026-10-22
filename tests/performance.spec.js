import { test, expect } from '@playwright/test'

test('parameter edits reuse bird visibility without forcing layout', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.locator('.waveform-display')).toHaveAttribute('aria-busy', 'false')
  const reads = await page.evaluate(async () => {
    const { nextTick } = await import('/node_modules/.vite/deps/vue.js')
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const original = Element.prototype.getBoundingClientRect
    let reads = 0
    Element.prototype.getBoundingClientRect = function () { reads++; return original.call(this) }
    try {
      const input = document.getElementById('frequency')
      for (let i = 0; i < 25; i++) {
        input.value = 1230 + i * 10
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
      }
      return reads
    } finally { Element.prototype.getBoundingClientRect = original }
  })
  expect(reads).toBe(0)
  await expect(page.locator('.bird-reflection')).toHaveCount(0)
})

test('hidden previews defer audio work while exports and returning previews use the latest settings', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.addInitScript(() => {
    const Original = window.OfflineAudioContext
    window.previewRenders = 0
    window.OfflineAudioContext = class extends Original {
      constructor(...args) { super(...args); window.previewRenders++ }
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.locator('.waveform-display')).toHaveAttribute('aria-busy', 'false')
  await page.locator('#duration').scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  const before = await page.evaluate(() => window.previewRenders)
  for (const duration of [0.55, 0.6, 0.75]) {
    await page.locator('#duration').fill(String(duration))
    await page.waitForTimeout(150)
  }
  expect(await page.evaluate(() => window.previewRenders)).toBe(before)
  const pendingDownload = page.waitForEvent('download')
  // Keep the playback panel off-screen while requesting the export.
  await page.getByRole('button', { name: 'Download (WAV)', exact: true }).evaluate(button => button.click())
  const download = await pendingDownload
  const chunks = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk)
  expect(Buffer.concat(chunks).readUInt32LE(40)).toBe(Math.ceil((0.75 + 0.04) * 44100) * 4)
  expect(await page.evaluate(() => window.previewRenders)).toBe(before + 1)
  const expectedHeights = await page.evaluate(async () => {
    const { renderSong, defaultSettings } = await import('/src/audio.js')
    const { buildWaveform } = await import('/src/waveform.js')
    return buildWaveform(await renderSong({ ...defaultSettings, duration: 0.75 })).map(height => String(72 - height / 2))
  })
  await page.locator('.waveform-display').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('.waveform-display svg g line').evaluateAll(lines => lines.map(line => line.getAttribute('y1')))).toEqual(expectedHeights)
  expect(await page.evaluate(() => window.previewRenders)).toBe(before + 1)
})

test('off-screen bird animations pause and resume when scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.locator('#duration').fill('2')
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  const bird = page.getByRole('img', { name: 'Bird generated' })
  await page.locator('#duration').scrollIntoViewIfNeeded()
  for (const part of ['beak', 'wing', 'tail', 'body']) {
    await expect(bird.locator(`[data-${part}]`)).toHaveCSS('animation-play-state', 'paused', { timeout: 1000 })
  }
  await expect(bird).toHaveAttribute('data-singing', 'true')
  await bird.scrollIntoViewIfNeeded()
  for (const part of ['beak', 'wing', 'tail', 'body']) {
    await expect(bird.locator(`[data-${part}]`)).toHaveCSS('animation-play-state', 'running')
  }
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
})

test('held sliders keep orange feedback without restarting a timer on every input', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.waveform-display')).toHaveAttribute('aria-busy', 'false')
  const result = await page.evaluate(async () => {
    const { nextTick } = await import('/node_modules/.vite/deps/vue.js')
    const original = window.setTimeout
    let timers = 0
    window.setTimeout = function (callback, delay, ...args) {
      if (delay === 100) timers++
      return original.call(this, callback, delay, ...args)
    }
    const input = document.getElementById('frequency')
    try {
      input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0 }))
      for (let i = 0; i < 100; i++) {
        input.value = 1230 + i * 10
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      await nextTick()
      return { timers, active: input.classList.contains('is-interacting') }
    } finally {
      window.setTimeout = original
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }))
    }
  })
  expect(result.active).toBe(true)
  expect(result.timers).toBeLessThanOrEqual(1)
})

test('depth edits reuse the LFO path and transform its amplitude', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { nextTick } = await import('/node_modules/.vite/deps/vue.js')
    const path = document.querySelector('#tremolo-lfo path')
    const original = path.getAttribute('d')
    const input = document.getElementById('tremolo-depth')
    input.value = '0.91'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    return { unchanged: path.getAttribute('d') === original, transform: path.getAttribute('transform') }
  })
  expect(result.unchanged).toBe(true)
  expect(result.transform).toContain('scale(1 0.91)')
})

test('XY pointer bursts share layout measurements and commit the last point', async ({ page }) => {
  await page.goto('/')
  const pad = page.locator('#vibrato-lfo')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  const reads = await pad.evaluate(async element => {
    const original = element.getBoundingClientRect.bind(element)
    const rect = original()
    let reads = 0
    element.getBoundingClientRect = () => { reads++; return original() }
    for (let i = 0; i < 100; i++) element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: rect.right + i, clientY: rect.top - i, buttons: 1 }))
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    delete element.getBoundingClientRect
    return reads
  })
  expect(reads).toBeLessThanOrEqual(2)
  await expect(page.locator('#vibrato-frequency')).toHaveValue('30')
  await expect(page.locator('#vibrato-depth')).toHaveValue('1200')
  await page.mouse.up()
})

test('natural playback completion stops the chorus control source', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext
    window.activeControls = 0
    window.AudioContext = class extends Original {
      createBufferSource() {
        const source = super.createBufferSource()
        const start = source.start.bind(source)
        source.start = (...args) => { window.activeControls++; start(...args) }
        source.addEventListener('ended', () => window.activeControls--)
        return source
      }
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.activeControls)).toBe(1)
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.activeControls)).toBe(0)
})

test('off-screen waveform cursor pauses DOM writes and catches up when visible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.locator('#duration').evaluate(input => { input.value = 2; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  const cursor = page.locator('[data-playback-cursor]')
  await expect.poll(async () => Number(await cursor.getAttribute('x1'))).toBeGreaterThan(0)
  await page.locator('#pause').scrollIntoViewIfNeeded()
  const result = await cursor.evaluate(async cursor => {
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    let writes = 0
    const before = Number(cursor.getAttribute('x1'))
    const observer = new MutationObserver(events => { writes += events.length })
    observer.observe(cursor, { attributes: true })
    await new Promise(resolve => setTimeout(resolve, 150))
    observer.disconnect()
    return { writes, before }
  })
  expect(result.writes).toBe(0)
  await page.locator('.waveform-display').scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await cursor.getAttribute('x1'))).toBeGreaterThan(result.before)
})

test('audio renders share in-flight work, ignore repeat pause, and use a bounded cache', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { defaultSettings, renderSong, toWav } = await import('/src/audio.js')
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
    const sameWav = toWav(buffer) === toWav(buffer)
    const afterShared = renders
    const changed = await renderSong({ ...settings, amplitude: 0 })
    const silent = changed.getChannelData(0).every(sample => sample === 0)
    for (const frequency of [1240, 1250, 1260, 1270]) await renderSong({ ...settings, frequency })
    const beforeEvictionCheck = renders
    await renderSong(settings)
    return { samePromise, sameBuffer, sameWav, afterShared, silent, evictionRenders: renders - beforeEvictionCheck }
  })
  expect(result).toEqual({ samePromise: true, sameBuffer: true, sameWav: true, afterShared: 1, silent: true, evictionRenders: 1 })
})

test('chorus control audio is reused across contexts and repeated voices', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.waveform-display svg line')).toHaveCount(180)
  const result = await page.evaluate(async () => {
    const { createVoice, defaultSettings } = await import('/src/audio.js')
    const sources = []
    let allocations = 0
    for (let i = 0; i < 2; i++) {
      const context = new OfflineAudioContext(2, 4410, 44100)
      const originalBuffer = context.createBuffer.bind(context)
      const originalSource = context.createBufferSource.bind(context)
      context.createBuffer = (...args) => { allocations++; return originalBuffer(...args) }
      context.createBufferSource = () => { const source = originalSource(); sources.push(source); return source }
      createVoice(context, { ...defaultSettings, duration: 0.1 })
      await context.startRendering()
    }
    return { allocations, shared: sources[0].buffer === sources[1].buffer }
  })
  expect(result).toEqual({ allocations: 0, shared: true })
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
