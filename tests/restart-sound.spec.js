import { test, expect } from '@playwright/test'

test('Randomize always starts or restarts, and Reset always stops', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext
    window.voiceCount = 0
    window.AudioContext = class extends Original {
      createOscillator() { window.voiceCount++; return super.createOscillator() }
    }
  })
  await page.goto('/')
  const randomize = page.getByRole('button', { name: 'Randomize', exact: true })
  const reset = page.getByRole('button', { name: 'Reset', exact: true })
  const status = page.getByRole('status', { name: 'Playback status' })
  await randomize.click()
  await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(3)
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  await randomize.click()
  await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(6)
  await reset.click()
  await expect(status).toHaveText('Ready')
  await expect(page.locator('#frequency')).toHaveAttribute('aria-valuenow', '2400')
  await expect(page.getByRole('button', { name: 'Repeat song', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await randomize.click()
  await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(9)
  await page.locator('#duration').evaluate(input => { input.value = 0.5; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await page.locator('#pause').evaluate(input => { input.value = 1; input.dispatchEvent(new Event('input', { bubbles: true })) })
  await expect(status).toHaveText('Pause')
  await reset.click()
  await page.waitForTimeout(1100)
  await expect(status).toHaveText('Ready')
  expect(await page.evaluate(() => window.voiceCount)).toBe(9)
})

test('limits and concise labels apply to controls, presets, and randomization', async ({ page }) => {
  await page.goto('/')
  for (const [id, min, max, label] of [['frequency', '250', '8000', 'Frequency'], ['amplitude', String(10 ** (-10 / 20)), '1', 'Amplitude'], ['vibrato-frequency', '0', '30', 'Frequency'], ['tremolo-frequency', '0', '30', 'Frequency'], ['duration', '0.5', '2', 'Duration'], ['pause', '0', '1', 'Pause']]) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-valuemin', min)
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-valuemax', max)
    await expect(page.locator(`#${id}-label`)).toHaveText(label)
  }
  await expect(page.getByText('Applies to the next play.', { exact: true })).toHaveCount(0)
  await expect(page.locator('.range-control > div[aria-hidden="true"]')).toHaveCount(0)
  const valid = await page.evaluate(async () => {
    const { presets, defaultSettings } = await import('/src/audio.js')
    const { randomizeSettings } = await import('/src/randomize.js')
    return [...presets.map(preset => preset.settings), randomizeSettings(defaultSettings, {}, () => 0), randomizeSettings(defaultSettings, {}, () => 0.9999)]
      .every(s => s.frequency >= 250 && s.amplitude >= 10 ** (-10 / 20) && s.vibratoFrequency <= 30 && s.tremoloFrequency <= 30)
  })
  expect(valid).toBe(true)
})

for (const action of ['Preset']) {
  test(`${action} restarts active playback and repeat pauses but stays silent when stopped`, async ({ page }) => {
    await page.addInitScript(() => {
      const Original = window.AudioContext
      window.voiceCount = 0
      window.AudioContext = class extends Original {
        createOscillator() { window.voiceCount++; return super.createOscillator() }
      }
    })
    await page.goto('/')
    const changeSound = () => action === 'Preset'
      ? page.getByRole('combobox', { name: 'Presets' }).selectOption('001 Little chirp')
      : page.getByRole('button', { name: action === 'Reset' ? 'Reset' : 'Randomize', exact: true }).click()
    const status = page.getByRole('status', { name: 'Playback status' })
    const repeat = page.getByRole('button', { name: 'Repeat song', exact: true })
    await changeSound()
    await expect(status).toHaveText('Ready')
    expect(await page.evaluate(() => window.voiceCount)).toBe(0)
    await page.getByRole('combobox', { name: 'Presets' }).selectOption('025 Night song')
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await page.waitForFunction(() => Number(document.querySelector('line[data-playback-cursor]')?.getAttribute('x1')) > 60)
    await changeSound()
    await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(6)
    await expect(status).toHaveText('Playing')
    await expect(repeat).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Stop song', exact: true }).click()
    for (const [id, value] of [['duration', 0.5], ['pause', 1]]) {
      await page.locator(`#${id}`).evaluate((input, next) => {
        input.value = next
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
    }
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await expect(status).toHaveText('Pause')
    await changeSound()
    await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(12)
    await expect(status).toHaveText('Playing')
    await page.getByRole('button', { name: 'Stop song', exact: true }).click()
    await changeSound()
    await expect(status).toHaveText('Ready')
    expect(await page.evaluate(() => window.voiceCount)).toBe(12)
  })
}
