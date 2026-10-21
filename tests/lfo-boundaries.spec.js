import { test, expect } from '@playwright/test'

test('LFO curves remain visible at zero and near-zero depth', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  for (const [id, depths] of [['vibrato', [0, 10]], ['tremolo', [0, 0.01]]]) {
    for (const depth of depths) {
      await page.locator(`#${id}-depth`).fill(String(depth))
      const coveredColumns = await page.locator(`#${id}-lfo svg`).evaluate(async svg => {
        // Rasterize the actual SVG so a present-but-invisible path fails too.
        const clone = svg.cloneNode(true)
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        clone.setAttribute('width', '320')
        clone.setAttribute('height', '80')
        clone.querySelector('path').setAttribute('stroke', getComputedStyle(svg.querySelector('path')).stroke)
        const image = new Image()
        image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 80
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        const pixels = context.getImageData(0, 38, 320, 4).data
        let covered = 0
        for (let x = 2; x < 318; x++) {
          if ([0, 1, 2, 3].some(y => pixels[(y * 320 + x) * 4 + 3] > 0)) covered++
        }
        return covered
      })
      expect(coveredColumns, `${id} depth ${depth}`).toBeGreaterThan(300)
    }
  }
})

for (const width of [1280, 375]) {
  test(`XY dot reaches each frame edge without guide lines at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    for (const id of ['vibrato', 'tremolo']) {
      const pad = page.locator(`#${id}-lfo`)
      await expect(pad.locator('.lfo-boundary, svg line')).toHaveCount(0)
      await expect(pad.locator('svg path')).toHaveCount(1)
      await pad.scrollIntoViewIfNeeded()
      const frame = await pad.boundingBox()
      await page.mouse.click(frame.x + 7, frame.y + frame.height - 7)
      await expect(page.locator(`#${id}-frequency`)).toHaveValue('0')
      await expect(page.locator(`#${id}-depth`)).toHaveValue('0')
      const minimum = await pad.locator('.lfo-dot').boundingBox()
      expect(minimum.x).toBeCloseTo(frame.x + 1, 1)
      expect(minimum.y + minimum.height).toBeCloseTo(frame.y + frame.height - 1, 1)
      await page.mouse.click(frame.x + frame.width - 7, frame.y + 7)
      await expect(page.locator(`#${id}-frequency`)).toHaveValue('30')
      await expect(page.locator(`#${id}-depth`)).toHaveValue(id === 'vibrato' ? '1200' : '1')
      const dot = await pad.locator('.lfo-dot').boundingBox()
      expect(dot.x + dot.width).toBeCloseTo(frame.x + frame.width - 1, 1)
      expect(dot.y).toBeCloseTo(frame.y + 1, 1)
    }
  })
}
