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
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  const main = page.getByRole('img', { name: 'Bird generated' })
  const ghost = page.locator('.bird-reflection')
  await page.locator('#duration').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => document.querySelector('svg[aria-label="Bird generated from the current sound parameters"]').getBoundingClientRect().bottom < 0)
  await change(page, 'duration', 1.9)
  await expect(ghost).toBeVisible()
  const before = await ghost.locator('[data-head]').getAttribute('transform')
  await change(page, 'duration', 0.5)
  await expect(ghost.locator('[data-head]')).not.toHaveAttribute('transform', before)
  expect(await ghost.locator('[data-head]').getAttribute('transform')).toBe(await main.locator('[data-head]').getAttribute('transform'))
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

test('stale off-screen observer notifications cannot show a bubble beside a visible bird', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super((entries, observer) => callback(entries.map(entry => entry.target.matches('[data-bird-perch]')
          ? { target: entry.target, isIntersecting: false } : entry), observer), options)
      }
    }
  })
  await page.goto('/')
  await expect(page.getByRole('img', { name: 'Bird generated' })).toBeInViewport()
  await change(page, 'frequency', 2100)
  await expect(page.locator('.bird-reflection')).toHaveCount(0)
  await page.getByRole('button', { name: 'Next preset' }).click()
  await change(page, 'vibrato-depth', 500)
  await expect(page.locator('.bird-reflection')).toHaveCount(0)
})

test('a dragged bird on screen suppresses the bubble even when its perch is off screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const box = await bird.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 + 50)
  await page.evaluate(() => document.querySelector('#duration').scrollIntoView())
  await expect(bird).toBeInViewport()
  await change(page, 'duration', 1.7)
  await expect(page.locator('.bird-reflection')).toHaveCount(0)
  await page.mouse.up()
})
