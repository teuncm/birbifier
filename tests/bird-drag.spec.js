import { test, expect } from '@playwright/test'

test('bird drags outside its card and glides home without moving the layout', async ({ page }) => {
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.boundingBox()
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const x = original.x + original.width / 2
  const y = original.y + original.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 90, y + 90)
  await expect(bird.locator('[data-facing]')).toHaveAttribute('transform', /scale\(-1 1\)/)
  await page.mouse.move(x - 240, y + 90, { steps: 5 })
  await expect(bird.locator('[data-facing]')).not.toHaveAttribute('transform')
  await expect(bird.locator('[data-gaze]')).toHaveAttribute('transform', /rotate\(-/)
  const moved = await bird.boundingBox()
  expect(moved.x).toBeCloseTo(original.x - 240, 1)
  expect(moved.y).toBeCloseTo(original.y + 90, 1)
  expect(await bird.evaluate((svg, point) => svg.contains(document.elementFromPoint(point.x, point.y)), { x: x - 240, y: y + 90 })).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(pageHeight)
  await page.mouse.up()
  await expect(bird).toHaveClass(/bird-returning/)
  await expect(bird.locator('[data-ground]')).toHaveCSS('visibility', 'hidden')
  await expect(bird.locator('[data-legs]')).toHaveCSS('animation-name', 'bird-leg-wiggle')
  await expect(bird.locator('[data-wing]')).toHaveCSS('animation-name', 'bird-flight-flap')
  await expect(bird.locator('[data-wing]').locator('..')).not.toHaveAttribute('clip-path')
  const path = await bird.evaluate(async svg => {
    const started = performance.now()
    const points = []
    let maxFeathers = 0
    while (svg.classList.contains('bird-returning')) {
      maxFeathers = Math.max(maxFeathers, document.querySelectorAll('.feather-particle').length)
      const rect = svg.getBoundingClientRect()
      points.push({ x: rect.x, y: rect.y })
      await new Promise(requestAnimationFrame)
    }
    return { points, maxFeathers, elapsed: performance.now() - started }
  })
  expect(path.elapsed).toBeGreaterThan(1400)
  expect(path.maxFeathers).toBeGreaterThan(3)
  expect(path.maxFeathers).toBeLessThanOrEqual(16)
  const lineDistance = point => Math.abs(90 * (point.x - moved.x) + 240 * (point.y - moved.y)) / Math.hypot(240, 90)
  expect(Math.max(...path.points.map(lineDistance))).toBeGreaterThan(5)
  await expect(bird).not.toHaveClass(/bird-returning/)
  const returned = await bird.boundingBox()
  expect(returned.x).toBeCloseTo(original.x, 1)
  expect(returned.y).toBeCloseTo(original.y, 1)
  await expect(bird).not.toHaveAttribute('style')
  await expect(bird.locator('[data-ground]')).toHaveCSS('visibility', 'visible')
  await expect(bird.locator('[data-legs]')).toHaveCSS('animation-name', 'none')
  await expect(bird.locator('[data-facing]')).not.toHaveAttribute('transform')
  await expect(bird.locator('[data-gaze]')).not.toHaveAttribute('transform')
  await expect(page.locator('.feather-particle').first()).toHaveCSS('pointer-events', 'none')
  await expect(page.locator('.feather-particle')).toHaveCount(0)
})

test('touch dragging and cancellation return the bird home on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.boundingBox()
  const x = original.x + original.width / 2
  const y = original.y + original.height / 2
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 150, y: y + 120 }] })
  await expect(bird).toHaveCSS('position', 'fixed')
  const moved = await bird.boundingBox()
  expect(moved.x).toBeCloseTo(original.x + 150, 1)
  expect(moved.y).toBeCloseTo(original.y + 120, 1)
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(bird).toHaveCSS('position', 'static')
  expect((await bird.boundingBox()).y).toBeCloseTo(original.y, 1)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
