import { test, expect } from '@playwright/test'

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
