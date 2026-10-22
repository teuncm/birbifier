import { test, expect } from '@playwright/test'

test('resizing during flight uses transform scaling and feathers do not rerender the bird', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const home = await bird.boundingBox()
  const x = home.x + home.width / 2, y = home.y + home.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 140, y + 100, { steps: 5 })
  await page.mouse.up()
  await bird.evaluate(async svg => {
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const instance = svg.__vueParentComponent
    const render = instance.render
    window.flightMetrics = { renders: 0, sizeChanges: 0, maxFeathers: 0 }
    instance.render = function (...args) { window.flightMetrics.renders++; return render.apply(this, args) }
    const width = svg.style.width, height = svg.style.height
    window.flightObserver = new MutationObserver(() => {
      if (svg.style.width && (svg.style.width !== width || svg.style.height !== height)) window.flightMetrics.sizeChanges++
      window.flightMetrics.maxFeathers = Math.max(window.flightMetrics.maxFeathers, document.querySelectorAll('.feather-particle').length)
    })
    window.flightObserver.observe(svg, { attributes: true, attributeFilter: ['style'] })
  })
  await page.setViewportSize({ width: 430, height: 812 })
  await expect(bird).toHaveCSS('position', 'static')
  const result = await page.evaluate(() => { window.flightObserver.disconnect(); return window.flightMetrics })
  expect(result.sizeChanges).toBe(0)
  expect(result.renders).toBeLessThanOrEqual(2)
  expect(result.maxFeathers).toBeGreaterThan(3)
  const frame = await bird.locator('..').boundingBox()
  const landed = await bird.boundingBox()
  for (const key of ['x', 'y', 'width', 'height']) expect(landed[key]).toBeCloseTo(frame[key], 1)
  await expect(page.locator('.feather-particle')).toHaveCount(0)
})

test('a bird outside the viewport does not create invisible feather particles', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const home = await bird.boundingBox()
  const x = home.x + home.width / 2, y = home.y + home.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 4000, y, { steps: 5 })
  await page.mouse.up()
  await expect(bird).toHaveClass(/bird-returning/)
  await page.waitForTimeout(200)
  expect((await bird.boundingBox()).x).toBeGreaterThan(375)
  await expect(page.locator('.feather-particle')).toHaveCount(0)
  await expect(bird).toHaveCSS('position', 'static')
  expect((await bird.boundingBox()).x).toBeCloseTo(home.x, 1)
})

test('bird drags outside its card and glides home without moving the layout', async ({ page }) => {
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.boundingBox()
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const x = original.x + original.width / 2
  const y = original.y + original.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await expect(bird.locator('[data-ground]')).toHaveCSS('visibility', 'hidden')
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
    const frame = svg.parentElement
    const originalMeasure = frame.getBoundingClientRect.bind(frame)
    let layoutReads = 0
    frame.getBoundingClientRect = () => { layoutReads++; return originalMeasure() }
    const started = performance.now()
    const points = []
    let maxFeathers = 0
    while (svg.classList.contains('bird-returning')) {
      maxFeathers = Math.max(maxFeathers, document.querySelectorAll('.feather-particle').length)
      const rect = svg.getBoundingClientRect()
      points.push({ x: rect.x, y: rect.y })
      await new Promise(requestAnimationFrame)
    }
    delete frame.getBoundingClientRect
    return { points, maxFeathers, layoutReads, elapsed: performance.now() - started }
  })
  expect(path.elapsed).toBeGreaterThan(1400)
  expect(path.maxFeathers).toBeGreaterThan(3)
  expect(path.maxFeathers).toBeLessThanOrEqual(16)
  expect(path.points.length).toBeGreaterThan(20)
  expect(path.layoutReads).toBeLessThan(12)
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

test('a quick release carries the bird in the throw direction before returning', async ({ page }) => {
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const home = await bird.boundingBox()
  const x = home.x + home.width / 2, y = home.y + home.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (const offset of [60, 120, 180]) await page.mouse.move(x - offset, y)
  const released = await bird.boundingBox()
  await page.mouse.up()
  await expect.poll(async () => (await bird.boundingBox()).x, { intervals: [16, 16, 32] }).toBeLessThan(released.x - 30)
  await expect(bird).toHaveCSS('position', 'static')
  expect((await bird.boundingBox()).x).toBeCloseTo(home.x, 1)
})

test('mobile scrolling during the return updates the landing position without a final jump', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const bird = page.getByRole('img', { name: 'Bird generated' })
  const original = await bird.boundingBox()
  const x = original.x + original.width / 2, y = original.y + original.height / 2
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 100, y: y + 100 }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const landing = await bird.evaluate(async svg => {
    window.scrollTo(0, 260)
    let lastTop
    while (svg.classList.contains('bird-returning')) {
      lastTop = svg.getBoundingClientRect().top
      await new Promise(requestAnimationFrame)
    }
    return { lastTop, finalTop: svg.getBoundingClientRect().top, homeTop: svg.parentElement.getBoundingClientRect().top, scroll: scrollY }
  })
  expect(landing.scroll).toBe(260)
  expect(landing.finalTop).toBeCloseTo(original.y - 260, 1)
  expect(Math.abs(landing.lastTop - landing.homeTop)).toBeLessThan(1)
  expect(landing.finalTop).toBe(landing.homeTop)
})
