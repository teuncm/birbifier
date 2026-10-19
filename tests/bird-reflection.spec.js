import { test, expect } from '@playwright/test'

async function change(page, id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = next
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

test('off-screen bird appears beside an edited control and follows current settings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/')
  const main = page.getByRole('img', { name: 'Bird generated' })
  const ghost = page.locator('.bird-reflection')
  await page.locator('#duration').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => document.querySelector('svg[aria-label="Bird generated from the current sound parameters"]').getBoundingClientRect().bottom < 0)
  await change(page, 'duration', 1.9)
  await expect(ghost).toBeVisible()
  const before = await ghost.locator('[data-torso]').getAttribute('d')
  await change(page, 'duration', 0.5)
  await expect(ghost.locator('[data-torso]')).not.toHaveAttribute('d', before)
  expect(await ghost.locator('[data-torso]').getAttribute('d')).toBe(await main.locator('[data-torso]').getAttribute('d'))
  await expect(ghost).toHaveCSS('pointer-events', 'none')
  const box = await ghost.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(box.y + box.height).toBeLessThanOrEqual(740)
  expect(await page.locator('clipPath').evaluateAll(elements => new Set(elements.map(el => el.id)).size === elements.length)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('reflection-mobile.png') })
  await expect(ghost).toHaveCount(0, { timeout: 3000 })
  await change(page, 'pause', 0.9)
  await expect(ghost).toBeVisible()
  await main.scrollIntoViewIfNeeded()
  await expect(ghost).toHaveCount(0)
})

test('editing with the main bird visible does not show a reflection', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('img', { name: 'Bird generated' })).toBeInViewport()
  await change(page, 'frequency', 2000)
  await expect(page.locator('.bird-reflection')).toHaveCount(0)
})
