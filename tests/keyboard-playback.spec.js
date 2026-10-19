import { test, expect } from '@playwright/test'

test('Down downloads a WAV without scrolling or starting playback', async ({ page }) => {
  await page.goto('/')
  const downloads = []
  page.on('download', download => downloads.push(download))
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download (WAV)', exact: true }).evaluate(button => {
    window.downloadFeedbackSeen = false
    new MutationObserver(() => {
      if (button.classList.contains('keyboard-pressed')) window.downloadFeedbackSeen = true
    }).observe(button, { attributes: true, attributeFilter: ['class'] })
  })
  await page.keyboard.down('ArrowDown')
  await expect.poll(() => page.evaluate(() => window.downloadFeedbackSeen)).toBe(true)
  const download = await pending
  expect(download.suggestedFilename()).toBe('birbifier-song.wav')
  expect(await download.failure()).toBeNull()
  await page.keyboard.down('ArrowDown')
  await page.keyboard.up('ArrowDown')
  expect(downloads).toHaveLength(1)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await page.locator('#vibrato-lfo').focus()
  await page.keyboard.press('ArrowDown')
  expect(downloads).toHaveLength(1)
})

test('Left and Right browse, wrap, and play presets like the arrow buttons', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  const select = page.getByRole('combobox', { name: 'Presets' })
  const names = await select.locator('option:not([disabled])').allTextContents()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('button', { name: 'Previous preset', exact: true })).toHaveClass(/keyboard-pressed/)
  await expect(select).toHaveValue(names.at(-1))
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Next preset', exact: true })).toHaveClass(/keyboard-pressed/)
  await expect(select).toHaveValue(names[0])
  await page.keyboard.press('ArrowRight')
  await expect(select).toHaveValue(names[1])
  await expect(page.getByRole('button', { name: 'Repeat song', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Stop song', exact: true }).click()
})

test('arrow keys still edit focused sliders and XY controls without auditioning presets', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.locator('#frequency').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#frequency')).toHaveValue('2410')
  await page.locator('#vibrato-lfo').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#vibrato-speed')).toHaveValue('8.1')
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
})

test('Space toggles playback without scrolling or retriggering while held', async ({ page }) => {
  await page.goto('/')
  const scroll = await page.evaluate(() => window.scrollY)
  await page.keyboard.down('Space')
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  await page.keyboard.down('Space')
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  await page.keyboard.up('Space')
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
})

test('focused controls keep their native Space behavior', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Repeat song', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Repeat song', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Play song', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Stop song', exact: true })).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Play song', exact: true })).toBeVisible()
})
