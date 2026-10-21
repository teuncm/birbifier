import { test, expect } from '@playwright/test'

test('synth frequency uses equal spacing in Hz', async ({ page }) => {
  await page.goto('/')
  const frequency = page.locator('#frequency')
  await expect(frequency).toHaveAttribute('min', '250')
  await expect(frequency).toHaveAttribute('max', '8000')
  await expect(frequency).toHaveAttribute('step', '10')
  for (const [position, hz] of [[0, 250], [0.2, 1800], [0.4, 3350], [0.6, 4900], [0.8, 6450], [1, 8000]]) {
    await frequency.fill(String(hz))
    await expect(frequency).toHaveAttribute('aria-valuenow', String(hz))
    await expect(frequency).toHaveAttribute('aria-valuetext', /Hz$/)
    const fill = await frequency.evaluate(input => parseFloat(input.style.getPropertyValue('--fill')))
    expect(fill).toBeCloseTo(position * 100, 2)
  }
})

test('frequency keyboard controls use 10 Hz steps and respect endpoints', async ({ page }) => {
  await page.goto('/')
  const frequency = page.locator('#frequency')
  await frequency.focus()
  await page.keyboard.press('End')
  await expect(frequency).toHaveValue('8000')
  await page.keyboard.press('ArrowRight')
  await expect(frequency).toHaveValue('8000')
  await page.keyboard.press('ArrowLeft')
  await expect(frequency).toHaveValue('7990')
  await page.keyboard.press('Home')
  await expect(frequency).toHaveValue('250')
  await page.keyboard.press('ArrowLeft')
  await expect(frequency).toHaveValue('250')
  await page.keyboard.press('ArrowRight')
  await expect(frequency).toHaveValue('260')
})
