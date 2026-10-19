import { test, expect } from '@playwright/test'

for (const action of ['Reset', 'Randomize', 'Preset']) {
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
      ? page.getByRole('combobox', { name: 'Presets' }).selectOption('Little chirp')
      : page.getByRole('button', { name: action === 'Reset' ? 'Reset sound' : 'Randomize', exact: true }).click()
    const status = page.getByRole('status', { name: 'Playback status' })
    const repeat = page.getByRole('button', { name: 'Repeat song', exact: true })
    await changeSound()
    await expect(status).toHaveText('Ready')
    expect(await page.evaluate(() => window.voiceCount)).toBe(0)
    await page.getByRole('combobox', { name: 'Presets' }).selectOption('Night song')
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await page.waitForFunction(() => Number(document.querySelector('line[stroke="#355a36"]')?.getAttribute('x1')) > 60)
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
