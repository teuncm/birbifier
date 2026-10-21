import { test, expect } from '@playwright/test'

for (const chorus of [0.3, 0.5]) {
  test(`cursor completes the full waveform with chorus ${chorus}`, async ({ page }) => {
    await page.addInitScript(() => {
      const OriginalContext = window.AudioContext
      window.AudioContext = class extends OriginalContext {
        constructor(...args) { super(...args); window.liveContext = this }
        createOscillator() {
          const oscillator = super.createOscillator()
          const start = oscillator.start.bind(oscillator)
          oscillator.start = when => { window.voiceStartedAt = when; start(when) }
          return oscillator
        }
      }
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    for (const [id, value] of [['duration', 0.5], ['pause', 0.5], ['chorus', chorus]]) {
      await page.locator(`#${id}`).evaluate((input, value) => {
        input.value = value
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, value)
    }
    await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.querySelector('[aria-label="Playback status"]').textContent === 'Ready' && window.voiceStartedAt !== undefined) {
          window.finishedAfter = window.liveContext.currentTime - window.voiceStartedAt
        }
      }).observe(document.querySelector('[aria-label="Playback status"]'), { subtree: true, childList: true, characterData: true })
    })
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    const cursor = page.locator('[data-playback-cursor]')
    await expect(cursor).toBeAttached()
    await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
    await expect(cursor).toHaveAttribute('x1', '720')
    expect(await page.evaluate(() => window.finishedAfter)).toBeGreaterThanOrEqual(0.5 + (chorus ? 0.04 : 0))
    await page.getByRole('button', { name: 'Repeat song', exact: true }).click()
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Pause')
    await expect(cursor).toHaveAttribute('x1', '720')
    await page.getByRole('button', { name: 'Stop song', exact: true }).click()
    await expect(cursor).toHaveCount(0)
  })
}
