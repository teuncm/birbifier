import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

async function touch(session, type, points = []) {
  await session.send('Input.dispatchTouchEvent', { type, touchPoints: points })
}

test('pinch and double tap keep the page at native scale, while one-finger scrolling works', async ({ page }) => {
  await page.goto('/')
  const session = await page.context().newCDPSession(page)
  const scale = await page.evaluate(() => visualViewport.scale)
  await touch(session, 'touchStart', [{ x: 120, y: 400, id: 1 }, { x: 240, y: 400, id: 2 }])
  for (let i = 1; i <= 5; i++) {
    await touch(session, 'touchMove', [{ x: 120 - i * 12, y: 400, id: 1 }, { x: 240 + i * 12, y: 400, id: 2 }])
  }
  await touch(session, 'touchEnd')
  expect(await page.evaluate(() => visualViewport.scale)).toBe(scale)
  const title = await page.getByRole('heading', { name: 'Your bird', exact: true }).boundingBox()
  await page.touchscreen.tap(title.x + 20, title.y + 8)
  await page.touchscreen.tap(title.x + 20, title.y + 8)
  expect(await page.evaluate(() => visualViewport.scale)).toBe(scale)
  await touch(session, 'touchStart', [{ x: 4, y: 620 }])
  for (let y = 580; y >= 300; y -= 40) await touch(session, 'touchMove', [{ x: 4, y }])
  await touch(session, 'touchEnd')
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(80)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const player = await page.locator('.playback-player').boundingBox()
  expect(player.y + player.height).toBeCloseTo(812, 0)
})

test('selection and Safari gestures are guarded without blocking the copyable share link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveCSS('touch-action', 'pan-y')
  await expect(page.getByRole('heading', { name: 'Your bird', exact: true })).toHaveCSS('user-select', 'none')
  const prevented = await page.evaluate(() => {
    const heading = document.querySelector('h1')
    return ['selectstart', 'gesturestart', 'gesturechange'].map(type => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      heading.dispatchEvent(event)
      return event.defaultPrevented
    })
  })
  expect(prevented).toEqual([true, true, true])
  await expect(page.locator('#preset')).toHaveCSS('font-size', '16px')
  await page.getByRole('button', { name: 'Share bird', exact: true }).tap()
  const link = page.getByRole('textbox', { name: 'Bird share link' })
  await expect(link).toHaveCSS('user-select', 'text')
  await expect(link).toHaveCSS('font-size', '16px')
  expect(await link.evaluate(el => {
    const event = new Event('selectstart', { bubbles: true, cancelable: true })
    el.dispatchEvent(event)
    return event.defaultPrevented
  })).toBe(false)
  expect(await link.evaluate(el => el.selectionEnd - el.selectionStart)).toBe((await link.inputValue()).length)
})

test('touch slider drags change the sound and XY cancellation allows another drag', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).tap()
  const session = await page.context().newCDPSession(page)
  const slider = page.locator('#frequency')
  const rect = await slider.boundingBox()
  await touch(session, 'touchStart', [{ x: rect.x + rect.width * 0.2, y: rect.y + rect.height / 2 }])
  await touch(session, 'touchMove', [{ x: rect.x + rect.width * 0.85, y: rect.y + rect.height / 2 }])
  await touch(session, 'touchEnd')
  expect(Number(await slider.inputValue())).toBeGreaterThan(6000)
  const pad = page.locator('#vibrato-lfo')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  const scroll = await page.evaluate(() => scrollY)
  await touch(session, 'touchStart', [{ x: box.x + box.width * 0.2, y: box.y + box.height * 0.8 }])
  await touch(session, 'touchMove', [{ x: box.x + box.width * 0.8, y: box.y + box.height * 0.2 }])
  await expect(page.locator('.lfo-surface.is-dragging')).toHaveCount(1)
  await touch(session, 'touchCancel')
  await expect(page.locator('.lfo-surface.is-dragging')).toHaveCount(0)
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0)
  await page.touchscreen.tap(box.x + box.width * 0.25, box.y + box.height * 0.75)
  expect(Number(await page.locator('#vibrato-frequency').inputValue())).toBeLessThan(10)
  expect(Number(await page.locator('#vibrato-depth').inputValue())).toBeLessThan(400)
})
