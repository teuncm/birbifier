import { test, expect } from '@playwright/test'

for (const width of [320, 375, 560, 768, 1024, 1280]) {
  test(`action row and paired controls fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    const actions = page.getByRole('group', { name: 'Sound actions' })
    const buttons = await actions.getByRole('button').all()
    const boxes = await Promise.all(buttons.map(button => button.boundingBox()))
    expect(new Set(boxes.map(box => box.y)).size).toBe(1)
    expect(boxes[0].x + boxes[0].width).toBeLessThan(boxes[1].x)
    expect(boxes[1].x + boxes[1].width).toBeLessThan(boxes[2].x)
    for (const id of ['wave', 'vibrato', 'tremolo', 'effects', 'timing']) {
      const pair = page.locator(`#${id}-controls .parameter-pair`)
      const sliders = await pair.locator('input[type="range"]').all()
      const [first, second] = await Promise.all(sliders.map(slider => slider.boundingBox()))
      const paired = width >= 560 && (width < 1024 || ['wave', 'vibrato', 'tremolo'].includes(id))
      if (paired) {
        expect(first.y).toBe(second.y)
        expect(first.x + first.width).toBeLessThan(second.x)
      } else {
        expect(first.x).toBe(second.x)
        expect(first.y + first.height).toBeLessThan(second.y)
      }
      for (const control of await pair.locator('.range-control').all()) {
        const label = await control.locator('label').boundingBox()
        const value = await control.locator('output').boundingBox()
        expect(label.x + label.width).toBeLessThan(value.x)
      }
    }
    await actions.getByRole('button', { name: 'Collapse', exact: true }).click()
    await expect(actions.getByRole('button', { name: 'Expand', exact: true })).toHaveAttribute('aria-expanded', 'false')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const width of [320, 375, 768, 1280]) {
  test(`bird and presets share one responsive card at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    const card = page.getByRole('region', { name: 'Your bird', exact: true })
    const presets = card.getByRole('combobox', { name: 'Presets', exact: true })
    const bird = card.getByRole('img', { name: 'Bird generated' })
    await expect(presets).toBeVisible()
    expect(await presets.evaluate(select => select.closest('.panel') === document.querySelector('[data-bird-perch]').closest('.panel'))).toBe(true)
    const birdBox = await bird.boundingBox()
    const presetsBox = await presets.boundingBox()
    if (width < 1024) expect(birdBox.x + birdBox.width).toBeLessThanOrEqual(presetsBox.x)
    else expect(presetsBox.y + presetsBox.height).toBeLessThanOrEqual(birdBox.y)
    const shareBox = await card.getByRole('button', { name: 'Share bird', exact: true }).boundingBox()
    expect(shareBox.y).toBeGreaterThanOrEqual(birdBox.y + birdBox.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`bird changes keep the page layout stable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await page.locator('#duration').scrollIntoViewIfNeeded()
    const measurements = await page.evaluate(async () => {
      const result = []
      for (const [id, values] of [['duration', [0.5, 0.8, 1, 1.5, 2]], ['tremolo-depth', [0, 0.25, 0.5, 0.75, 1]]]) {
        for (const value of values) {
          const input = document.getElementById(id)
          input.value = value
          input.dispatchEvent(new Event('input', { bubbles: true }))
          await new Promise(requestAnimationFrame)
          const bird = document.querySelector('svg[aria-label="Bird generated from the current sound parameters"]')
          const timing = document.getElementById('timing-controls')
          result.push({ birdHeight: bird.getBoundingClientRect().height, timingTop: timing.getBoundingClientRect().top, scrollY, pageHeight: document.documentElement.scrollHeight })
        }
      }
      return result
    })
    for (const key of ['birdHeight', 'timingTop', 'scrollY', 'pageHeight']) {
      const values = measurements.map(item => item[key])
      expect(Math.max(...values) - Math.min(...values), key).toBeLessThan(0.1)
    }
  })
}
