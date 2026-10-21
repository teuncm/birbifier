import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext
    window.liveContexts = []
    window.voiceCount = 0
    window.AudioContext = class extends OriginalContext {
      constructor(...args) {
        super(...args)
        window.liveContexts.push(this)
      }
      createOscillator() {
        window.voiceCount++
        return super.createOscillator()
      }
      async resume() {
        await super.resume()
        if (window.holdResume) await new Promise(resolve => { window.releaseResume = resolve })
      }
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.locator('#duration').fill('0.5')
  await page.locator('#pause').fill('1')
})

async function leavePage(page, reason) {
  await page.evaluate(reason => {
    if (reason === 'hidden') {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    } else if (reason === 'freeze') {
      document.dispatchEvent(new Event('freeze'))
    } else {
      window.dispatchEvent(new Event(reason))
    }
  }, reason)
}

async function returnToPage(page) {
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pageshow'))
    window.dispatchEvent(new Event('focus'))
  })
}

for (const reason of ['hidden', 'blur', 'pagehide', 'freeze']) {
  test(`${reason} stops audio and cancels repeats without resuming on return`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(3)
    // Cover both interruption of a live chirp and cancellation during its repeat pause.
    if (reason === 'pagehide' || reason === 'freeze') {
      await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Pause')
    }
    await leavePage(page, reason)
    await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Ready')
    await expect.poll(() => page.evaluate(() => window.liveContexts[0].state)).toBe('closed')
    await returnToPage(page)
    await page.waitForTimeout(1700)
    expect(await page.evaluate(() => window.voiceCount)).toBe(3)
    await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Play song', exact: true }).click()
    await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(6)
    expect(await page.evaluate(() => window.liveContexts.length)).toBe(2)
    await page.getByRole('button', { name: 'Stop song', exact: true }).click()
    expect(errors).toEqual([])
  })
}

test('losing focus while audio is starting prevents a late start', async ({ page }) => {
  await page.evaluate(() => { window.holdResume = true })
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await page.waitForFunction(() => typeof window.releaseResume === 'function')
  await leavePage(page, 'blur')
  await returnToPage(page)
  await page.evaluate(() => {
    window.holdResume = false
    window.releaseResume()
  })
  await expect(page.getByRole('status', { name: 'Playback status' })).toHaveText('Ready')
  expect(await page.evaluate(() => window.voiceCount)).toBe(0)
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.voiceCount)).toBe(3)
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
})

test('moving focus between controls does not stop playback', async ({ page }) => {
  await page.getByRole('button', { name: 'Play song', exact: true }).click()
  await page.locator('#frequency').focus()
  await page.locator('#vibrato-frequency').focus()
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.liveContexts[0].state)).toBe('running')
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
})
