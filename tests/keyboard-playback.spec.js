import { test, expect } from '@playwright/test'

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
