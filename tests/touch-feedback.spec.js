import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 900 }, hasTouch: true, isMobile: true })

for (const colorScheme of ['dark', 'light']) {
  test(`touch slider feedback is orange without highlighting XY dots in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/')
    const slider = page.locator('#vibrato-frequency')
    await slider.scrollIntoViewIfNeeded()
    const box = await slider.boundingBox()
    const session = await page.context().newCDPSession(page)
    const point = { x: box.x + box.width * 0.3, y: box.y + box.height / 2 }
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: box.x + box.width * 0.7 }] })
    await expect(slider).toHaveClass(/is-interacting/)
    await expect(page.locator('[data-parameter="vibrato-frequency"]')).toHaveCSS('color', colorScheme === 'dark' ? 'rgb(255, 188, 126)' : 'rgb(146, 67, 8)')
    const dot = page.locator('#vibrato-lfo .lfo-dot')
    await expect(dot).not.toHaveCSS('background-color', 'rgb(240, 120, 18)')
    await expect(dot).not.toHaveCSS('animation-name', 'lfo-drag')
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(slider).not.toHaveClass(/is-interacting/)
    await expect(page.locator('[data-parameter="vibrato-frequency"]')).toHaveCSS('color', colorScheme === 'dark' ? 'rgb(164, 201, 138)' : 'rgb(63, 99, 55)')
  })
}

test('touch presses override reset, play-attention and repeat animations with orange', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const session = await page.context().newCDPSession(page)
  for (const [selector, background] of [['.reset-button', 'rgb(71, 51, 32)'], ['.repeat-button.selected', 'rgb(185, 88, 13)'], ['.button-primary', 'rgb(185, 88, 13)']]) {
    const button = page.locator(selector)
    await button.scrollIntoViewIfNeeded()
    const box = await button.boundingBox()
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] })
    await expect(button).toHaveClass(/is-interacting/)
    await expect(button).toHaveCSS('background-color', background)
    await expect(button).toHaveCSS('animation-name', 'none')
    const element = await button.elementHandle()
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    const tapped = await element.evaluate(async button => {
      await new Promise(requestAnimationFrame)
      return button.classList.contains('is-interacting')
    })
    expect(tapped).toBe(true)
    await expect(page.locator('.is-interacting')).toHaveCount(0)
  }
})

test('XY touch dragging still highlights its dot and both value labels', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const pad = page.locator('#tremolo-lfo')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] })
  await expect(pad.locator('.lfo-dot')).toHaveCSS('background-color', 'rgb(240, 120, 18)')
  for (const parameter of ['tremolo-frequency', 'tremolo-depth']) await expect(page.locator(`[data-parameter="${parameter}"]`)).toHaveCSS('color', 'rgb(255, 188, 126)')
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(pad.locator('.lfo-dot')).not.toHaveCSS('background-color', 'rgb(240, 120, 18)')
})
