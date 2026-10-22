import { test, expect } from '@playwright/test'

async function freezeReplacement(page, action) {
  await page.evaluate(async action => {
    if (action === 'select') {
      const select = document.querySelector('#preset')
      select.selectedIndex = (select.selectedIndex + 1) % select.options.length
      select.dispatchEvent(new Event('change', { bubbles: true }))
    } else document.querySelector(`[aria-label="${action}"]`)?.click()
    await Promise.resolve()
    for (const animation of document.getAnimations()) {
      const target = animation.effect?.target
      if (target?.matches('[data-bird-poof], [data-reveal], .feather-burst')) animation.pause()
    }
  }, action)
}

for (const width of [375, 1280]) {
  test(`presets poof the old bird and pop the new bird without layout shifts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    const bird = page.getByRole('img', { name: 'Bird generated' })
    const home = await bird.boundingBox()
    for (const action of ['Next preset', 'Previous preset', 'select']) {
      const color = await bird.locator('[data-torso]').getAttribute('fill')
      await freezeReplacement(page, action)
      await expect(page.locator('[data-bird-poof]')).toHaveCount(1)
      await expect(page.locator('[data-bird-poof] [data-torso]')).toHaveAttribute('fill', color)
      await expect(page.locator('[data-bird-poof]')).toHaveAttribute('aria-hidden', 'true')
      expect(await page.locator('[data-bird-poof]').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')
      expect(await bird.locator('[data-reveal]').evaluate(el => el.getAnimations().length)).toBe(1)
      expect(await page.locator('.feather-burst').count()).toBeGreaterThanOrEqual(12)
      expect(await page.locator('.feather-particle').count()).toBeLessThanOrEqual(16)
      const current = await bird.boundingBox()
      for (const key of ['x', 'y', 'width', 'height']) expect(current[key]).toBeCloseTo(home[key], 1)
      const ids = await page.locator('clipPath').evaluateAll(elements => elements.map(el => el.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        if (animation.effect?.target?.matches('[data-bird-poof], [data-reveal], .feather-burst')) animation.finish()
      }
    })
    await expect(page.locator('[data-bird-poof], .feather-particle')).toHaveCount(0)
  })
}

test('randomize animates, manual edits and reset do not, and reduced motion skips replacements', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect(page.locator('.feather-burst')).toHaveCount(12)
  await expect(page.locator('[data-bird-poof], .feather-particle')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.locator('#vibrato-depth').fill('1200')
  await expect(page.locator('[data-bird-poof], .feather-particle')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await page.getByRole('button', { name: 'Next preset', exact: true }).click()
  await expect(page.locator('[data-bird-poof], .feather-particle')).toHaveCount(0)
  expect(await page.locator('[data-reveal]').first().evaluate(el => el.getAnimations().length)).toBe(0)
})
