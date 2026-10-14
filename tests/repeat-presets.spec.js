import { test, expect } from '@playwright/test'

async function setSlider(page, id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, String(value))
}

test('preset arrows autoplay, wrap, and browse from the last chosen preset after edits', async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext
    window.voiceCount = 0
    window.AudioContext = class extends OriginalContext {
      createOscillator() { window.voiceCount++; return super.createOscillator() }
    }
  })
  await page.goto('/')
  const select = page.getByRole('combobox', { name: 'Presets' })
  const names = await select.locator('option:not([disabled])').allTextContents()
  expect(names).toHaveLength(50)
  expect(new Set(names).size).toBe(50)
  expect(await page.evaluate(() => window.voiceCount)).toBe(0)
  await page.getByRole('button', { name: 'Previous preset' }).click()
  await expect(select).toHaveValue(names.at(-1))
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  expect(await page.evaluate(() => window.voiceCount)).toBe(3)
  await page.getByRole('button', { name: 'Next preset' }).click()
  await expect(select).toHaveValue(names[0])
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  expect(await page.evaluate(() => window.voiceCount)).toBe(6)
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await select.selectOption(names[12])
  await setSlider(page, 'frequency', 100)
  await expect(select).toHaveValue('')
  await page.getByRole('button', { name: 'Next preset' }).click()
  await expect(select).toHaveValue(names[13])
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await page.getByRole('button', { name: 'Previous preset' }).click()
  await expect(select).toHaveValue(names[12])
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  expect(await page.evaluate(() => window.voiceCount)).toBe(12)
  await page.getByRole('button', { name: 'Stop song' }).click()
})

test('rapid preset navigation plays only the latest request while audio is starting', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext
    window.resumeQueue = []
    window.voiceCount = 0
    window.AudioContext = class extends OriginalContext {
      createOscillator() { window.voiceCount++; return super.createOscillator() }
      async resume() {
        await super.resume()
        await new Promise(resolve => window.resumeQueue.push(resolve))
      }
    }
  })
  await page.goto('/')
  const next = page.getByRole('button', { name: 'Next preset' })
  await next.click()
  await expect.poll(() => page.evaluate(() => window.resumeQueue.length)).toBe(1)
  await next.click()
  await expect.poll(() => page.evaluate(() => window.resumeQueue.length)).toBe(2)
  await page.evaluate(() => window.resumeQueue[0]())
  await expect(page.getByRole('button', { name: 'Starting…' })).toBeVisible()
  expect(await page.evaluate(() => window.voiceCount)).toBe(0)
  await page.evaluate(() => window.resumeQueue[1]())
  await expect(page.getByRole('combobox', { name: 'Presets' })).toHaveValue('Soft coo')
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  expect(await page.evaluate(() => window.voiceCount)).toBe(3)
  await page.getByRole('button', { name: 'Stop song' }).click()
  expect(errors).toEqual([])
})

test('playback frames do not reset a preset choice before it is committed', async ({ page }) => {
  await page.goto('/')
  const select = page.getByRole('combobox', { name: 'Presets' })
  await select.selectOption('Night song')
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await expect(page.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false')
  await page.waitForFunction(() => Number(document.querySelector('line[stroke="#355a36"]')?.getAttribute('x1')) > 20)
  const pendingChoice = await select.evaluate(async element => {
    // A native picker may change its selection before firing the change event.
    element.selectedIndex = [...element.options].findIndex(option => option.value === 'Forest trill')
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame)
    return element.value
  })
  expect(pendingChoice).toBe('Forest trill')
  await select.dispatchEvent('change')
  await expect(page.locator('#frequency')).toHaveValue('3200')
  await page.getByRole('button', { name: 'Stop song' }).click()
  await setSlider(page, 'duration', 0.5)
  await setSlider(page, 'pause', 0.4)
  await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Stop song' })).toBeVisible()
  await select.evaluate(element => {
    element.selectedIndex = [...element.options].findIndex(option => option.value === 'Little chirp')
  })
  const status = page.getByRole('status', { name: 'Playback status' })
  await expect(status).toHaveText('Pause')
  await expect(select).toHaveValue('Little chirp')
  await expect(status).toHaveText('Playing')
  await expect(select).toHaveValue('Little chirp')
  await page.getByRole('button', { name: 'Stop song' }).click()
  await expect(select).toHaveValue('Little chirp')
  await select.dispatchEvent('change')
  await expect(page.locator('#frequency')).toHaveValue('2400')
})

test('every preset loads its controls and produces finite audible samples', async ({ page }) => {
  await page.goto('/')
  const presets = await page.evaluate(async () => (await import('/src/audio.js')).presets)
  for (const preset of presets) {
    await page.getByRole('combobox', { name: 'Presets' }).selectOption(preset.name)
    for (const [key, value] of Object.entries(preset.settings)) {
      if (key === 'shape') {
        const name = value === 'saw' ? 'Sawtooth' : value === 'sine' ? 'Sine' : 'Square'
        await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
      } else {
        const id = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        await expect(page.locator(`#${id}`)).toHaveValue(String(value))
      }
    }
  }
  const audio = await page.evaluate(async () => {
    const { presets, renderSong } = await import('/src/audio.js')
    const results = []
    for (const preset of presets) {
      const buffer = await renderSong(preset.settings)
      const samples = buffer.getChannelData(0)
      const energy = samples.reduce((sum, sample) => sum + sample * sample, 0)
      results.push({ name: preset.name, duration: buffer.duration, finite: samples.every(Number.isFinite), rms: Math.sqrt(energy / samples.length) })
    }
    return results
  })
  for (const result of audio) {
    expect(result.finite, result.name).toBe(true)
    expect(result.rms, result.name).toBeGreaterThan(0.01)
    expect(result.duration, result.name).toBeGreaterThanOrEqual(0.5)
    expect(result.duration, result.name).toBeLessThanOrEqual(5)
  }
})

test('tremolo stays centered at zero, partial, and full depth', async ({ page }) => {
  await page.goto('/')
  await setSlider(page, 'tremolo-speed', 6)
  for (const depth of [0, 0.45, 1]) {
    await setSlider(page, 'tremolo-depth', depth)
    const bounds = await page.locator('#tremolo-lfo path').last().evaluate(path => {
      const { y, height } = path.getBBox()
      return { center: y + height / 2, height }
    })
    expect(bounds.center).toBeCloseTo(52, 2)
    expect(bounds.height).toBeCloseTo(depth * 80, 1)
  }
})

test('repeat honors pause changes and cancels pending playback when disabled or stopped', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext
    window.voiceStarts = []
    window.AudioContext = class extends OriginalContext {
      createOscillator() {
        this.oscillators = (this.oscillators || 0) + 1
        if (this.oscillators % 3 === 1) window.voiceStarts.push(performance.now())
        return super.createOscillator()
      }
    }
  })
  await page.goto('/')
  await setSlider(page, 'duration', 0.5)
  await setSlider(page, 'pause', 0.6)
  const repeat = page.getByRole('button', { name: 'Repeat song', exact: true })
  const status = page.getByRole('status', { name: 'Playback status' })
  await repeat.click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(status).toHaveText('Pause')
  expect(await page.evaluate(() => window.voiceStarts.length)).toBe(1)
  await expect.poll(() => page.evaluate(() => window.voiceStarts.length)).toBe(2)
  const gap = await page.evaluate(() => window.voiceStarts[1] - window.voiceStarts[0])
  expect(gap).toBeGreaterThanOrEqual(1050)
  await expect(status).toHaveText('Pause')
  await setSlider(page, 'pause', 0)
  await expect.poll(() => page.evaluate(() => window.voiceStarts.length)).toBeGreaterThanOrEqual(3)
  await setSlider(page, 'pause', 0.6)
  await expect(status).toHaveText('Pause')
  await repeat.click()
  await expect(status).toHaveText('Ready')
  const cancelled = await page.evaluate(() => {
    window.cancelledAt = performance.now()
    return window.voiceStarts.length
  })
  await page.waitForFunction(() => performance.now() > window.cancelledAt + 700)
  expect(await page.evaluate(() => window.voiceStarts.length)).toBe(cancelled)
  await repeat.click()
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect(status).toHaveText('Pause')
  await page.getByRole('button', { name: 'Stop song' }).click()
  const stopped = await page.evaluate(() => {
    window.stoppedAt = performance.now()
    return window.voiceStarts.length
  })
  await page.waitForFunction(() => performance.now() > window.stoppedAt + 700)
  expect(await page.evaluate(() => window.voiceStarts.length)).toBe(stopped)
  await expect(status).toHaveText('Ready')
  expect(errors).toEqual([])
})
